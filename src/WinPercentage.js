import React, { useState, useEffect } from 'react';

function WinPercentage() {
  const [winPercent, setWinPercent] = useState(null);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWinPercent() {
      setLoading(true);
      try {
        const res = await fetch('https://arena-wins-backend-de7eb58946d6.herokuapp.com/api/win-percentage'); // Change URL if deployed
        if (!res.ok) throw new Error('Failed to fetch win percentage');
        const data = await res.json();
        setWinPercent(data.winPercent);
        setTotalMatches(data.totalMatches);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchWinPercent();
  }, []);

  if (loading) return <p>Loading win percentage...</p>;
  if (error) return <p style={{color: 'red'}}>Error: {error}</p>;

  return (
    <div style={{textAlign: 'center', margin: '20px 0'}}>
      <h2>Last {totalMatches} Arena Games Win %</h2>
      <p style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{winPercent}%</p>
    </div>
  );
}

export default WinPercentage;