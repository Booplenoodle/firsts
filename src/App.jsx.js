import React, { useState, useEffect } from 'react';
import WinPercentage from './WinPercentage'; // Your existing WinPercentage component

const allChampions = [
  // ... your champion list unchanged ...
];

const ddragonVersion = "15.14.1";

function App() {
  const [wins, setWins] = useState(() => {
    const saved = localStorage.getItem('arenaWins');
    return saved ? JSON.parse(saved) : [];
  });

  // New state for win percentage data from backend
  const [backendWinData, setBackendWinData] = useState({ winPercent: '0.00', totalMatches: 0, wins: 0, message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch win percentage from backend API once on mount
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/win-percentage`)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        setBackendWinData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Store wins in localStorage on change
  useEffect(() => {
    localStorage.setItem('arenaWins', JSON.stringify(wins));
  }, [wins]);

  // Toggle win status by clicking champion image
  const toggleWin = (champ) => {
    if (wins.includes(champ)) {
      setWins(wins.filter(w => w !== champ));
    } else {
      setWins([...wins, champ]);
    }
  };

  const championsLeft = allChampions.filter(champ => !wins.includes(champ));

  // Render champions as clickable images with color or gray filter
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

      {/* Show loading, error, or backend win stats */}
      {loading ? (
        <p>Loading win stats from backend...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error loading backend data: {error}</p>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <strong>Backend Stats:</strong> {backendWinData.message || `${backendWinData.wins} wins out of ${backendWinData.totalMatches} matches (${backendWinData.winPercent}%)`}
        </div>
      )}

      {/* Your manual WinPercentage component if needed */}
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
  // ... your existing styles unchanged ...
};

export default App;
