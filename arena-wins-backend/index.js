import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const PUUID = process.env.PUUID;
const QUEUE_ID_ARENA = 1700;

app.use(cors());
app.use(express.json());

app.get('/favicon.ico', (req, res) => res.status(204));

// Helper function to fetch match IDs
async function fetchMatchIds() {
  const url = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?count=20&api_key=${RIOT_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch match IDs: ${response.statusText}`);
  return response.json();
}

// Helper function to fetch match details
async function fetchMatchDetails(matchId) {
  const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${RIOT_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch match details: ${response.statusText}`);
  return response.json();
}

app.get('/api/win-percentage', async (req, res) => {
  try {
    const matchIds = await fetchMatchIds();

    const arenaMatches = [];
    for (const matchId of matchIds) {
      if (arenaMatches.length >= 5) break; // limit to 5 Arena matches

      const match = await fetchMatchDetails(matchId);
      if (match.info?.queueId === QUEUE_ID_ARENA) {
        arenaMatches.push(match);
      }
    }

    let wins = 0;
    for (const match of arenaMatches) {
      const participant = match.info.participants.find(p => p.puuid === PUUID);
      if (participant && participant.placement === 1) {
        wins++;
      }
    }

    const totalMatches = arenaMatches.length;
    const winPercent = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(2) : '0.00';

    res.json({
      message: `Analyzed ${totalMatches} Arena matches.`,
      wins,
      totalMatches,
      winPercent,
    });
  } catch (error) {
    console.error('Error in /api/win-percentage:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch match data' });
  }
});

app.get('/', (req, res) => {
  res.send('Arena Wins Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
