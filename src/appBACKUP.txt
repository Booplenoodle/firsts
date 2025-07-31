import React, { useState, useEffect } from 'react';
import WinPercentage from './WinPercentage';
import championsData from './champion.json'; // Import the full Riot JSON

const ddragonVersion = "15.14.1";

function App() {
  // Extract champions from the imported JSON
  // championsData.data is an object with champion IDs as keys
  const allChampions = Object.values(championsData.data).map(champ => champ.id);

  const [wins, setWins] = useState(() => {
    const saved = localStorage.getItem('arenaWins');
    return saved ? JSON.parse(saved) : [];
  });

  // Backend win stats states
  const [backendWinData, setBackendWinData] = useState({ winPercent: '0.00', totalMatches: 0, wins: 0, message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch backend win percentage once on mount
  useEffect(() => {
    fetch('https://arena-wins-backend-de7eb58946d6.herokuapp.com/api/win-percentage')

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

  // Store wins in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('arenaWins', JSON.stringify(wins));
  }, [wins]);

  // Toggle win status for a champion
  const toggleWin = (champ) => {
    if (wins.includes(champ)) {
      setWins(wins.filter(w => w !== champ));
    } else {
      setWins([...wins, champ]);
    }
  };

  const championsLeft = allChampions.filter(champ => !wins.includes(champ));

  // Render list of champions with clickable images
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

      {loading ? (
        <p>Loading win stats from backend...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error loading backend data: {error}</p>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <strong>Backend Stats:</strong> {backendWinData.message || `${backendWinData.wins} wins out of ${backendWinData.totalMatches} matches (${backendWinData.winPercent}%)`}
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
