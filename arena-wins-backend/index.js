import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
let RIOT_API_KEY = process.env.RIOT_API_KEY;

const QUEUE_ID_ARENA = 1700;
const MAX_ARENA_MATCHES = 50;
const CONCURRENT_REQUESTS = 5;
const CACHE_DURATION = 23 * 60 * 60 * 1000;

const allowedOrigins = [
  'https://booplenoodle.github.io',
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked CORS origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

const cache = {};
const isCacheValid = (timestamp) => (Date.now() - timestamp) < CACHE_DURATION;
const getCacheKey = (summoner, region) => `${summoner.toLowerCase()}_${region.toLowerCase()}`;

const matchRegionMap = {
  na1: 'americas',
  br1: 'americas',
  la1: 'americas',
  la2: 'americas',
  euw1: 'europe',
  eun1: 'europe',
  tr1: 'europe',
  ru: 'europe',
  kr: 'asia',
  jp1: 'asia',
  oc1: 'sea'
};

const getSummonerByNameUrl = (region, summonerName) =>
  `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;

const getMatchIdsUrl = (puuid, region, count = MAX_ARENA_MATCHES) => {
  const matchRegion = matchRegionMap[region];
  return `https://${matchRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=${QUEUE_ID_ARENA}&count=${count}`;
};

const getMatchDetailsUrl = (matchId, region) => {
  const matchRegion = matchRegionMap[region];
  return `https://${matchRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchArenaMatches(matchIds, region) {
  const arenaMatches = [];
  let index = 0;

  async function worker() {
    while (index < matchIds.length && arenaMatches.length < MAX_ARENA_MATCHES) {
      const matchId = matchIds[index++];
      console.log(`Fetching match details for matchId=${matchId} (index=${index - 1})`);
      try {
        const res = await fetch(getMatchDetailsUrl(matchId, region), {
          headers: { 'X-Riot-Token': RIOT_API_KEY }
        });

        if (res.status === 429) {
          console.warn(`Rate limited on match ${matchId}. Backing off for 1.5 seconds...`);
          await delay(1500);
          index--;
          continue;
        }

        if (!res.ok) {
          console.warn(`Failed to fetch match ${matchId}: HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        if (data.info?.queueId === QUEUE_ID_ARENA) {
          arenaMatches.push(data);
          console.log(`Added Arena match: ${matchId} (total arena matches: ${arenaMatches.length})`);
        } else {
          console.log(`Skipping non-Arena match: ${matchId} with queueId ${data.info?.queueId}`);
        }

        await delay(150);
      } catch (err) {
        console.error(`Error fetching match ${matchId}: ${err.message}`);
      }
    }
  }

  const workers = Array(CONCURRENT_REQUESTS).fill(null).map(() => worker());
  await Promise.all(workers);
  console.log(`Finished fetching matches. Total Arena matches collected: ${arenaMatches.length}`);
  return arenaMatches;
}

app.get('/api/win-percentage', async (req, res) => {
  const summonerRaw = req.query.summoner;
  const regionRaw = req.query.region;

  const summoner = summonerRaw ? summonerRaw.trim().toLowerCase() : null;
  const region = regionRaw ? regionRaw.trim().toLowerCase() : null;

  console.log(`Received request: summoner='${summoner}', region='${region}'`);

  if (!RIOT_API_KEY) {
    console.error('Missing Riot API Key in environment variables.');
    return res.status(500).json({ error: 'Missing Riot API Key.' });
  }
  if (!summoner || !region) {
    console.error('Missing summoner or region parameter.');
    return res.status(400).json({ error: 'Missing summoner or region.' });
  }
  if (!matchRegionMap[region]) {
    console.error(`Invalid region provided: ${region}`);
    return res.status(400).json({ error: 'Invalid region provided.' });
  }

  const cacheKey = getCacheKey(summoner, region);
  if (cache[cacheKey] && isCacheValid(cache[cacheKey].timestamp)) {
    console.log(`Serving cached data for ${cacheKey}`);
    return res.json(cache[cacheKey].data);
  }

  try {
    console.log(`Fetching summoner data for '${summoner}' in region '${region}'`);
    const summonerRes = await fetch(getSummonerByNameUrl(region, summoner), {
      headers: { 'X-Riot-Token': RIOT_API_KEY }
    });

    if (!summonerRes.ok) {
      console.error(`Failed to fetch summoner: HTTP ${summonerRes.status} - ${summonerRes.statusText}`);
      return res.status(summonerRes.status).json({ error: `Summoner fetch error: ${summonerRes.statusText}` });
    }

    const summonerData = await summonerRes.json();
    console.log(`Summoner found: ${summonerData.name} (PUUID: ${summonerData.puuid})`);

    console.log(`Fetching match IDs for PUUID=${summonerData.puuid} in region ${region}`);
    const matchIdsRes = await fetch(getMatchIdsUrl(summonerData.puuid, region), {
      headers: { 'X-Riot-Token': RIOT_API_KEY }
    });

    if (!matchIdsRes.ok) {
      console.error(`Failed to fetch match IDs: HTTP ${matchIdsRes.status} - ${matchIdsRes.statusText}`);
      return res.status(matchIdsRes.status).json({ error: `Match ID fetch error: ${matchIdsRes.statusText}` });
    }

    const matchIds = await matchIdsRes.json();
    console.log(`Received ${matchIds.length} match IDs`);

    const arenaMatches = await fetchArenaMatches(matchIds, region);

    let wins = 0;
    arenaMatches.forEach(match => {
      const player = match.info.participants.find(p => p.puuid === summonerData.puuid);
      if (player?.placement === 1) wins++;
    });

    const totalMatches = arenaMatches.length;
    const winPercent = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(2) : '0.00';

    console.log(`Calculated wins: ${wins} out of ${totalMatches} matches (${winPercent}%)`);

    const result = {
      summonerName: summonerData.name,
      region,
      wins,
      totalMatches,
      winPercent,
      message: `Analyzed ${totalMatches} Arena matches for ${summonerData.name}`
    };

    cache[cacheKey] = { data: result, timestamp: Date.now() };

    res.json(result);
  } catch (err) {
    console.error('Error in /api/win-percentage:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Arena Win Tracker backend is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
