import React, { useState, useEffect } from 'react';
import WinPercentage from './WinPercentage';
import championsData from './champion.json'; // Import the full Riot JSON

const ddragonVersion = "15.14.1";

function App() {
  const allChampions = Object.values(championsData.data).map(champ => champ.id);

  const [wins, setWins] = useState(() => {
    const saved = localStorage.getItem('arenaWins');
    return saved ? JSON.parse(saved) : [];
  });

  // --- New states for user input ---
  const [summonerInput, setSummonerInput] = useState('');
  const [regionInput, setRegionInput] = useState('na1');

  // Backend win stats states
  const [backendWinData, setBackendWinData] = useState({ winPercent: '0.00', totalMatches: 0, wins: 0, message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Timestamp for caching last fetch per summoner+region
  const [lastUpdate, setLastUpdate] = useState(0);
  const [currentSummoner, setCurrentSummoner] = useState('');
  const [currentRegion, setCurrentRegion] = useState('');

  // Store wins in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('arenaWins', JSON.stringify(wins));
  }, [wins]);

  // Helper: check if cache is expired (>24h)
  const isCacheExpired = (timestamp) => {
    if (!timestamp) return true;
    return (Date.now() - timestamp) > 24 * 60 * 60 * 1000;
  };

  // Key for localStorage caching per summoner+region
  const getCacheKey = (summoner, region) => `arenaWinData_${summoner.toLowerCase()}_${region.toLowerCase()}`;

  // Fetch backend win percentage for given summoner and region
  const fetchBackendWinData = async (summoner, region) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://arena-wins-backend-de7eb58946d6.herokuapp.com/api/win-percentage?summoner=${encodeURIComponent(summoner)}&region=${encodeURIComponent(region)}`
      );

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);

      const data = await response.json();

      setBackendWinData(data);
      setCurrentSummoner(summoner);
      setCurrentRegion(region);
      setLastUpdate(Date.now());

      // Cache result
      localStorage.setItem(getCacheKey(summoner, region), JSON.stringify({ data, timestamp: Date.now() }));
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  // On mount: try to load cached data for default (or last used) summoner+region
  useEffect(() => {
    // You can store last summoner+region to localStorage if you want persistence, here just fallback:
    const defaultSummoner = 'booplenoodle'; // your default summoner or empty
    const defaultRegion = 'na1';

    const cacheKey = getCacheKey(defaultSummoner, defaultRegion);
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);
      if (!isCacheExpired(parsed.timestamp)) {
        setBackendWinData(parsed.data);
        setCurrentSummoner(defaultSummoner);
        setCurrentRegion(defaultRegion);
        setLastUpdate(parsed.timestamp);
        setSummonerInput(defaultSummoner);
        setRegionInput(defaultRegion);
        return; // don't fetch fresh data yet
      }
    }

    // If no valid cache, fetch fresh
    setSummonerInput(defaultSummoner);
    setRegionInput(defaultRegion);
    fetchBackendWinData(defaultSummoner, defaultRegion);
  }, []);

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!summonerInput.trim()) {
      setError('Please enter a summoner name.');
      return;
    }
    if (!regionInput.trim()) {
      setError('Please enter a region.');
      return;
    }

    const cacheKey = getCacheKey(summonerInput.trim(), regionInput.trim());
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (!isCacheExpired(parsed.timestamp)) {
        setBackendWinData(parsed.data);
        setCurrentSummoner(summonerInput.trim());
        setCurrentRegion(regionInput.trim());
        setLastUpdate(parsed.timestamp);
        setError(null);
        return;
      }
    }

    fetchBackendWinData(summonerInput.trim(), regionInput.trim());
  };

  // Toggle win status for a champion
  const toggleWin = (champ) => {
    if (wins.includes(champ)) {
      setWins(wins.filter(w => w !== champ));
    } else {
      setWins([...wins, champ]);
    }
  };

  const championsLeft = allChampions.filter(champ => !wins.includes(champ));

  const renderChampionList = (champions) => (
    <ul style={styles.championList}>
      {champions.map(champ => (
        <li
          key={champ}
          style={styles.championItem}
          title={champ}
          onClick={() => toggleWin(champ)}
        >
          <img
            src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champ}.png`}
            alt={champ}
            style={{
              ...styles.championImage,
              filter: wins.includes(champ) ? 'none' : 'grayscale(100%)',
              cursor: 'pointer',
              transition: 'filter 0.3s ease',
            }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <div style={styles.championName}>{champ}</div>
        </li>
      ))}
    </ul>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Arena Wins Tracker</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Summoner Name"
          value={summonerInput}
          onChange={e => setSummonerInput(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          type="text"
          placeholder="Region (e.g. na1, euw1)"
          value={regionInput}
          onChange={e => setRegionInput(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Get Win Percentage'}
        </button>
      </form>

      {loading ? (
        <p>Loading win stats from backend...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error loading backend data: {error}</p>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <strong>Backend Stats for {currentSummoner} ({currentRegion}):</strong> {backendWinData.message || `${backendWinData.wins} wins out of ${backendWinData.totalMatches} matches (${backendWinData.winPercent}%)`}
        </div>
      )}

      <WinPercentage />

      <section>
        <h2 style={styles.sectionTitle}>Champions Won 1st Place With (click to toggle):</h2>
        {wins.length === 0 ? (
          <p style={styles.message}>No wins yet! Click champions below to mark wins.</p>
        ) : (
          renderChampionList(wins)
        )}
      </section>

      <section>
        <h2 style={styles.sectionTitle}>Champions Left To Win With (click to mark win):</h2>
        {championsLeft.length === 0 ? (
          <p style={styles.message}>Congrats! You've won with all champions.</p>
        ) : (
          renderChampionList(championsLeft)
        )}
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: '30px',
  },
  championList: {
    display: 'flex',
    flexWrap: 'wrap',
    listStyle: 'none',
    padding: 0,
  },
  championItem: {
    width: '80px',
    margin: '10px',
    textAlign: 'center',
    userSelect: 'none',
  },
  championImage: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.2)',
  },
  championName: {
    marginTop: '5px',
    fontSize: '12px',
  },
  message: {
    fontStyle: 'italic',
  },
};

export default App;
