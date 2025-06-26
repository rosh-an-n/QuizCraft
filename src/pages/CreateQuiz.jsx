import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  IconButton,
  Grid,
  Divider,
  FormGroup,
  FormLabel,
  Switch,
  Alert,
  CircularProgress
} from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";

const steps = ["Quiz Details", "Add Questions", "Review & Save"];

const defaultOption = () => ({ text: "", isCorrect: false });
const defaultQuestion = () => ({
  text: "",
  options: [defaultOption(), defaultOption(), defaultOption()],
  timer: 30,
  allowMultiple: false
});

const CreateQuiz = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [quizDetails, setQuizDetails] = useState({
    title: "",
    description: "",
    timerType: "perQuiz",
    timer: 300
  });
  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fetching, setFetching] = useState(false);
  const navigate = useNavigate();
  const { quizId } = useParams();
  const isEdit = !!quizId;

  // Fetch quiz data if editing
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!isEdit) return;
      setFetching(true);
      setError("");
      try {
        const docRef = doc(db, "quizzes", quizId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setQuizDetails({
            title: data.title || "",
            description: data.description || "",
            timerType: data.timerType || "perQuiz",
            timer: data.timer || 300
          });
          setQuestions(data.questions || [defaultQuestion()]);
        } else {
          setError("Quiz not found.");
        }
      } catch (err) {
        setError("Failed to fetch quiz: " + err.message);
      } finally {
        setFetching(false);
      }
    };
    fetchQuiz();
    // eslint-disable-next-line
  }, [quizId]);

  // Step 1: Quiz Details
  const handleQuizDetailsChange = (e) => {
    setQuizDetails({ ...quizDetails, [e.target.name]: e.target.value });
  };

  // Step 2: Questions
  const handleQuestionChange = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx, oIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx].text = value;
    setQuestions(updated);
  };

  const handleCorrectChange = (qIdx, oIdx, checked) => {
    const updated = [...questions];
    if (updated[qIdx].allowMultiple) {
      updated[qIdx].options[oIdx].isCorrect = checked;
    } else {
      updated[qIdx].options = updated[qIdx].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === oIdx ? checked : false
      }));
    }
    setQuestions(updated);
  };

  const addOption = (qIdx) => {
    const updated = [...questions];
    if (updated[qIdx].options.length < 5) {
      updated[qIdx].options.push(defaultOption());
      setQuestions(updated);
    }
  };

  const removeOption = (qIdx, oIdx) => {
    const updated = [...questions];
    if (updated[qIdx].options.length > 3) {
      updated[qIdx].options.splice(oIdx, 1);
      setQuestions(updated);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, defaultQuestion()]);
  };

  const removeQuestion = (idx) => {
    if (questions.length > 1) {
      const updated = [...questions];
      updated.splice(idx, 1);
      setQuestions(updated);
    }
  };

  const handleAllowMultiple = (qIdx, checked) => {
    const updated = [...questions];
    updated[qIdx].allowMultiple = checked;
    if (!checked) {
      // Only one correct answer allowed
      const firstCorrect = updated[qIdx].options.findIndex(opt => opt.isCorrect);
      updated[qIdx].options = updated[qIdx].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === firstCorrect
      }));
    }
    setQuestions(updated);
  };

  // Stepper navigation
  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Step 3: Review & Save (Firestore integration)
  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You must be logged in to save a quiz.");
      const quizData = {
        ...quizDetails,
        questions,
        creatorId: user.uid,
        updatedAt: serverTimestamp()
      };
      if (isEdit) {
        await updateDoc(doc(db, "quizzes", quizId), quizData);
        setSuccess("Quiz updated successfully!");
      } else {
        await addDoc(collection(db, "quizzes"), {
          ...quizData,
          createdAt: serverTimestamp()
        });
        setSuccess("Quiz saved successfully!");
      }
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxWidth="md">
        <Paper elevation={8} sx={{ p: { xs: 2, sm: 5 }, borderRadius: 4 }}>
          <Typography variant="h4" fontWeight={700} color="primary" align="center" gutterBottom>
            {isEdit ? "Edit Quiz" : "Create a New Quiz"}
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {loading && <Box display="flex" justifyContent="center" my={2}><CircularProgress /></Box>}

          {/* Step 1: Quiz Details */}
          {activeStep === 0 && (
            <Box>
              <TextField
                label="Quiz Title"
                name="title"
                value={quizDetails.title}
                onChange={handleQuizDetailsChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Description"
                name="description"
                value={quizDetails.description}
                onChange={handleQuizDetailsChange}
                fullWidth
                margin="normal"
                multiline
                minRows={2}
              />
              <FormLabel sx={{ mt: 2 }}>Timer Type</FormLabel>
              <RadioGroup
                row
                name="timerType"
                value={quizDetails.timerType}
                onChange={handleQuizDetailsChange}
              >
                <FormControlLabel value="perQuiz" control={<Radio />} label="Per Quiz" />
                <FormControlLabel value="perQuestion" control={<Radio />} label="Per Question" />
              </RadioGroup>
              <TextField
                label={quizDetails.timerType === "perQuiz" ? "Quiz Timer (seconds)" : "Default Question Timer (seconds)"}
                name="timer"
                type="number"
                value={quizDetails.timer}
                onChange={handleQuizDetailsChange}
                fullWidth
                margin="normal"
                inputProps={{ min: 10 }}
              />
            </Box>
          )}

          {/* Step 2: Add Questions */}
          {activeStep === 1 && (
            <Box>
              {questions.map((q, qIdx) => (
                <Paper key={qIdx} elevation={2} sx={{ p: 3, mb: 3, position: 'relative' }}>
                  <IconButton
                    onClick={() => removeQuestion(qIdx)}
                    sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                    disabled={questions.length === 1}
                  >
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Question {qIdx + 1}
                  </Typography>
                  <TextField
                    label="Question Text"
                    value={q.text}
                    onChange={e => handleQuestionChange(qIdx, "text", e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <FormGroup row sx={{ mb: 1 }}>
                    <FormControlLabel
                      control={<Switch checked={q.allowMultiple} onChange={e => handleAllowMultiple(qIdx, e.target.checked)} />}
                      label="Allow multiple correct answers"
                    />
                  </FormGroup>
                  <Divider sx={{ mb: 2 }} />
                  {q.options.map((opt, oIdx) => (
                    <Grid container alignItems="center" spacing={1} key={oIdx} sx={{ mb: 1 }}>
                      <Grid item xs={7}>
                        <TextField
                          label={`Option ${oIdx + 1}`}
                          value={opt.text}
                          onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid item xs={3}>
                        {q.allowMultiple ? (
                          <FormControlLabel
                            control={<Checkbox checked={opt.isCorrect} onChange={e => handleCorrectChange(qIdx, oIdx, e.target.checked)} />}
                            label="Correct"
                          />
                        ) : (
                          <FormControlLabel
                            control={<Radio checked={opt.isCorrect} onChange={e => handleCorrectChange(qIdx, oIdx, e.target.checked)} />}
                            label="Correct"
                          />
                        )}
                      </Grid>
                      <Grid item xs={2}>
                        <IconButton onClick={() => removeOption(qIdx, oIdx)} disabled={q.options.length === 3} color="error">
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                  <Button
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => addOption(qIdx)}
                    disabled={q.options.length === 5}
                    sx={{ mt: 1 }}
                  >
                    Add Option
                  </Button>
                  {quizDetails.timerType === "perQuestion" && (
                    <TextField
                      label="Question Timer (seconds)"
                      type="number"
                      value={q.timer}
                      onChange={e => handleQuestionChange(qIdx, "timer", e.target.value)}
                      fullWidth
                      margin="normal"
                      inputProps={{ min: 10 }}
                    />
                  )}
                </Paper>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={addQuestion}
                sx={{ mb: 2 }}
              >
                Add Question
              </Button>
            </Box>
          )}

          {/* Step 3: Review & Save */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quiz Title: {quizDetails.title}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                {quizDetails.description}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Timer: {quizDetails.timerType === "perQuiz" ? `Per Quiz (${quizDetails.timer} seconds)` : `Per Question (default ${quizDetails.timer} seconds)`}
              </Typography>
              <Divider sx={{ my: 2 }} />
              {questions.map((q, qIdx) => (
                <Box key={qIdx} mb={2}>
                  <Typography fontWeight={600}>Q{qIdx + 1}: {q.text}</Typography>
                  <ul>
                    {q.options.map((opt, oIdx) => (
                      <li key={oIdx} style={{ color: opt.isCorrect ? 'green' : undefined }}>
                        {opt.text} {opt.isCorrect ? '(Correct)' : ''}
                      </li>
                    ))}
                  </ul>
                  {quizDetails.timerType === "perQuestion" && (
                    <Typography variant="caption">Timer: {q.timer} seconds</Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Navigation Buttons */}
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
              Back
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button onClick={handleNext} variant="contained" color="primary">
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} variant="contained" color="success" disabled={loading}>
                Save Quiz
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateQuiz; 