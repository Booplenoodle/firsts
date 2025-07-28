import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Riot API config
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const PUUID = process.env.PUUID;
const QUEUE_ID_ARENA = 1700;

app.use(cors());
app.use(express.json());

app.get('/favicon.ico', (req, res) => res.status(204));
app.get('/', (req, res) => res.send('Arena Wins Backend is running!'));

// Win Percentage Route
app.get('/api/win-percentage', async (req, res) => {
  try {
    // 1. Get recent Arena match IDs
    const matchIdsRes = await fetch(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?start=0&count=20&api_key=${RIOT_API_KEY}`);
    const matchIds = await matchIdsRes.json();

    // 2. Fetch and filter Arena matches
    const arenaMatches = [];
    for (const matchId of matchIds) {
      const matchRes = await fetch(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${RIOT_API_KEY}`);
      const matchData = await matchRes.json();
      if (matchData.info?.queueId === QUEUE_ID_ARENA) {
        arenaMatches.push(matchData);
      }
    }

    // 3. Analyze match data
    let wins = 0;
    for (const match of arenaMatches) {
      const player = match.info.participants.find(p => p.puuid === PUUID);
      if (player && player.placement === 1) {
        wins += 1;
      }
    }

    const totalMatches = arenaMatches.length;
    const winPercent = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(2) : '0.00';

    res.json({
      wins,
      totalMatches,
      winPercent,
      message: `Analyzed ${totalMatches} Arena matches`,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch match data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend is running on port ${PORT}`);
});
