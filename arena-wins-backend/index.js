import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import favicon from 'serve-favicon';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Riot API keys and constants
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const PUUID = process.env.PUUID;
const REGION = 'americas';

// Helper functions - must be declared **before** routes!

async function fetchLast20ArenaMatchIds() {
  const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${PUUID}/ids?queue=1700&count=20`;
  const res = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY }
  });
  if (!res.ok) throw new Error(`Failed to fetch match IDs: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchMatchDetails(matchId) {
  const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  const res = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY }
  });
  if (!res.ok) throw new Error(`Failed to fetch match details for ${matchId}: ${res.status} ${res.statusText}`);
  return res.json();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchMatchDetailsWithRateLimit(matchIds) {
  const matches = [];
  for (const id of matchIds) {
    try {
      const match = await fetchMatchDetails(id);
      matches.push(match);
      console.log(`Fetched details for match ${id}`);
    } catch (error) {
      console.error(`Error fetching details for ${id}:`, error.message);
    }
    await delay(1200); // 1.2 seconds delay to avoid rate limit
  }
  return matches;
}

// Middleware
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`Requested URL: ${req.url}`);
  next();
});

// Content Security Policy header
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; img-src 'self' http://localhost:4000 data:; connect-src 'self';"
  );
  next();
});

// Routes

app.get('/api/win-percentage', async (req, res) => {
  try {
    const matchIds = await fetchLast20ArenaMatchIds();
    if (!matchIds || matchIds.length === 0) {
      return res.json({ winPercent: '0.00', totalMatches: 0, message: 'No Arena matches found' });
    }

    const matchDetailsList = await fetchMatchDetailsWithRateLimit(matchIds);

    let wins = 0;
    for (const match of matchDetailsList) {
      if (!match) continue;
      const participant = match.info.participants.find(p => p.puuid === PUUID);
      if (!participant) {
        console.warn(`PUUID not found in match ${match.metadata.matchId}`);
        continue;
      }
      console.log(`Placement for match ${match.metadata.matchId}: ${participant.placement}`);
      if (participant.placement === 1) wins++;
    }

    const total = matchDetailsList.length;
    const winPercent = total > 0 ? (wins / total) * 100 : 0;

    res.json({ winPercent: winPercent.toFixed(2), totalMatches: total, wins });
  } catch (error) {
    console.error('Error in /api/win-percentage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.use(express.static(path.join(__dirname, 'build')));

// For any other route, serve React's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});