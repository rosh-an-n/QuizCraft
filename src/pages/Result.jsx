import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import SnackbarContext from "../SnackbarContext";

const PARTICIPANT_BADGES = [
  { key: 'first', label: 'First Attempt', icon: <EmojiEventsIcon color="warning" />, desc: 'Took your first quiz!' },
  { key: 'highscore', label: 'High Scorer', icon: <StarIcon color="primary" />, desc: 'Scored 100% on a quiz!' },
  { key: 'sharer', label: 'Sharer', icon: <ShareIcon color="success" />, desc: 'Shared your quiz result!' }
];

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { score, total, answers, quiz } = location.state || {};
  const showSnackbar = useContext(SnackbarContext);
  const [badges, setBadges] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('participantBadges') || '{}');
    } catch {
      return {};
    }
  });
  const [newBadge, setNewBadge] = useState(null);

  useEffect(() => {
    let updated = { ...badges };
    let earned = null;
    if (!badges.first) {
      updated.first = true;
      earned = PARTICIPANT_BADGES[0];
    }
    if (score === total && !badges.highscore) {
      updated.highscore = true;
      earned = PARTICIPANT_BADGES[1];
    }
    if (earned) {
      setBadges(updated);
      localStorage.setItem('participantBadges', JSON.stringify(updated));
      setNewBadge(earned);
      showSnackbar(`Badge earned: ${earned.label}!`, "success");
    }
    // eslint-disable-next-line
  }, []);

  if (!score && score !== 0) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <Paper elevation={8} sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h5">No result data found.</Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(`/quiz/${quizId}`)}>
            Take Quiz
          </Button>
        </Paper>
      </Box>
    );
  }

  const percentage = Math.round((score / total) * 100);
  const quizUrl = `${window.location.origin}/quiz/${quizId}`;
  const shareText = `I scored ${score}/${total} (${percentage}%) on "${quiz?.title || 'Quiz'}"! Try it: ${quizUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(quizUrl);
    if (!badges.sharer) {
      const updated = { ...badges, sharer: true };
      setBadges(updated);
      localStorage.setItem('participantBadges', JSON.stringify(updated));
      setNewBadge(PARTICIPANT_BADGES[2]);
      showSnackbar(`Badge earned: ${PARTICIPANT_BADGES[2].label}!`, "success");
    }
  };

  const handleWebShare = () => {
    if (navigator.share) {
      navigator.share({
        title: quiz?.title || 'Quiz',
        text: shareText,
        url: quizUrl
      });
      if (!badges.sharer) {
        const updated = { ...badges, sharer: true };
        setBadges(updated);
        localStorage.setItem('participantBadges', JSON.stringify(updated));
        setNewBadge(PARTICIPANT_BADGES[2]);
        showSnackbar(`Badge earned: ${PARTICIPANT_BADGES[2].label}!`, "success");
      }
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxWidth="md" sx={{ px: { xs: 0.5, sm: 2 } }}>
        <Paper elevation={8} sx={{ p: { xs: 1, sm: 3 }, borderRadius: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2} justifyContent="center">
            {PARTICIPANT_BADGES.filter(b => badges[b.key]).map(badge => (
              <Tooltip key={badge.key} title={badge.desc}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  {badge.icon}
                  <Typography variant="body2" fontWeight={600}>{badge.label}</Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
          <Typography variant="h4" fontWeight={700} color="primary" align="center" gutterBottom>
            Quiz Results
          </Typography>
          <Typography variant="h5" align="center" gutterBottom>
            Score: {score} / {total}
          </Typography>
          <Typography variant="h6" align="center" color={percentage >= 60 ? 'success.main' : 'error.main'} gutterBottom>
            Percentage: {percentage}%
          </Typography>
          {/* Social Sharing Buttons */}
          <Box display="flex" justifyContent="center" gap={2} mb={2}>
            <Tooltip title="Share on WhatsApp">
              <IconButton color="success" component="a" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={handleCopy}>
                <WhatsAppIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share on X (Twitter)">
              <IconButton color="primary" component="a" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={handleCopy}>
                <TwitterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share on Facebook">
              <IconButton color="primary" component="a" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}&quote=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={handleCopy}>
                <FacebookIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy Link">
              <IconButton color="info" onClick={handleCopy}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
            {navigator.share && (
              <Tooltip title="Share...">
                <IconButton color="secondary" onClick={handleWebShare}>
                  <span role="img" aria-label="share">🔗</span>
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Answer Review
          </Typography>
          {quiz.questions.map((q, qIdx) => {
            const correctIndexes = q.options.map((opt, i) => opt.isCorrect ? i : null).filter(i => i !== null);
            const selected = answers[qIdx]?.selected || [];
            const isCorrect =
              correctIndexes.length === selected.length &&
              correctIndexes.every(idx => selected.includes(idx));
            return (
              <Box key={qIdx} mb={3}>
                <Typography fontWeight={600}>
                  Q{qIdx + 1}: {q.text}
                  {isCorrect ? (
                    <Chip label="Correct" color="success" size="small" sx={{ ml: 2 }} />
                  ) : (
                    <Chip label="Wrong" color="error" size="small" sx={{ ml: 2 }} />
                  )}
                </Typography>
                <ul style={{ marginTop: 8 }}>
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selected.includes(oIdx);
                    const isAnswer = opt.isCorrect;
                    return (
                      <li
                        key={oIdx}
                        style={{
                          color: isAnswer
                            ? "green"
                            : isSelected
                            ? "#d32f2f"
                            : undefined,
                          fontWeight: isAnswer || isSelected ? 600 : 400,
                          background: isAnswer
                            ? "#e8f5e9"
                            : isSelected
                            ? "#ffebee"
                            : undefined,
                          borderRadius: 4,
                          padding: "2px 8px",
                          display: "inline-block",
                          marginRight: 8
                        }}
                      >
                        {opt.text}
                        {isAnswer && " (Correct)"}
                        {isSelected && !isAnswer && " (Your Answer)"}
                      </li>
                    );
                  })}
                </ul>
              </Box>
            );
          })}
          <Divider sx={{ my: 3 }} />
          <Box display="flex" justifyContent="center" gap={2}>
            <Button variant="contained" color="primary" onClick={() => navigate(`/quiz/${quizId}`)}>
              Retake Quiz
            </Button>
            <Button variant="outlined" onClick={() => navigate(`/`)}>
              Go Home
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Result; 