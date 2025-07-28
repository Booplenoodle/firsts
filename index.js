import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for all origins (for now)
app.use(cors());
app.use(express.json());
app.get('/favicon.ico', (req, res) => res.status(204));

// Sample data (replace with real logic later)
let matchData = [
  { result: 'win' },
  { result: 'loss' },
  { result: 'win' },
  { result: 'win' },
  { result: 'loss' },
];

// Win percentage API
app.get('/api/win-percentage', (req, res) => {
  const totalMatches = matchData.length;
  const wins = matchData.filter(m => m.result === 'win').length;
  const winPercent = ((wins / totalMatches) * 100).toFixed(2);
  
  res.json({
    message: '',
    wins,
    totalMatches,
    winPercent,
  });
});

app.get('/', (req, res) => {
  res.send('Arena Wins Backend is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
