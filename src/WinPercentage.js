import React, { useState } from 'react';

function WinPercentage() {
  const [summoner, setSummoner] = useState('');
  const [region, setRegion] = useState('');
  const [winPercent, setWinPercent] = useState(null);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchWinPercent() {
    setLoading(true);
    setError(null);
    setWinPercent(null);
    try {
      const query = new URLSearchParams({ summoner, region }).toString();
      const res = await fetch(`https://arena-wins-backend-de7eb58946d6.herokuapp.com/api/win-percentage?${query}`);
      if (!res.ok) throw new Error('Failed to fetch win percentage');
      const data = await res.json();
      setWinPercent(data.winPercent);
      setTotalMatches(data.totalMatches);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <h2>Arena Win Percentage Checker</h2>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Summoner Name"
          value={summoner}
          onChange={(e) => setSummoner(e.target.value)}
          style={{ marginRight: '10px', padding: '8px' }}
        />
        <input
          type="text"
          placeholder="Region (e.g., na1)"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{ padding: '8px' }}
        />
      </div>
      
      <button onClick={fetchWinPercent} disabled={loading || !summoner || !region} style={{ padding: '10px 20px' }}>
        {loading ? 'Loading...' : 'Check Win %'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {winPercent && (
        <div style={{ marginTop: '20px' }}>
          <h3>Last {totalMatches} Arena Games</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{winPercent}%</p>
        </div>
      )}
    </div>
  );
}

export default WinPercentage;
