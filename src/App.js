import React, { useState, useEffect } from 'react';
import WinPercentage from './WinPercentage'; // Your existing WinPercentage component

const allChampions = [
  "Aatrox", "Ahri", "Akali", "Akshan", "Alistar", "Ambessa", "Amumu", "Anivia", "Annie",
  "Aphelios", "Ashe", "AurelionSol", "Azir", "Bard", "Belveth", "Blitzcrank",
  "Brand", "Braum", "Briar", "Caitlyn", "Camille", "Cassiopeia", "Chogath", "Corki",
  "Darius", "Diana", "DrMundo", "Draven", "Ekko", "Elise", "Evelynn", "Ezreal",
  "Fiddlesticks", "Fiora", "Fizz", "Galio", "Gangplank", "Garen", "Gnar",
  "Gragas", "Graves", "Gwen", "Hecarim", "Heimerdinger", "Illaoi", "Irelia",
  "Ivern", "Janna", "JarvanIV", "Jax", "Jayce", "Jhin", "Jinx", "KSante",
  "Kaisa", "Kalista", "Karma", "Karthus", "Kassadin", "Katarina", "Kayle",
  "Kayn", "Kennen", "Khazix", "Kindred", "Kled", "KogMaw", "Leblanc", "LeeSin",
  "Leona", "Lillia", "Lissandra", "Lucian", "Lulu", "Lux", "Malphite",
  "Malzahar", "Maokai", "MasterYi", "Mel", "Milio", "MissFortune", "Mordekaiser", "Morgana",
  "Nami", "Nasus", "Nautilus", "Neeko", "Nidalee", "Nilah", "Nocturne", "Nunu",
  "Olaf", "Orianna", "Ornn", "Pantheon", "Poppy", "Pyke", "Qiyana", "Quinn",
  "Rakan", "Rammus", "RekSai", "Rell", "Renekton", "Rengar", "Riven", "Rumble",
  "Ryze", "Samira", "Sejuani", "Senna", "Seraphine", "Sett", "Shaco", "Shen",
  "Shyvana", "Singed", "Sion", "Sivir", "Skarner", "Smolder", "Sona", "Soraka", "Swain",
  "Sylas", "Syndra", "TahmKench", "Taliyah", "Talon", "Taric", "Teemo",
  "Thresh", "Tristana", "Trundle", "Tryndamere", "TwistedFate", "Twitch",
  "Udyr", "Urgot", "Varus", "Vayne", "Veigar", "Velkoz", "Vex", "Vi", "Viego",
  "Viktor", "Vladimir", "Volibear", "Warwick", "MonkeyKing", "Xayah", "Xerath",
  "XinZhao", "Yasuo", "Yone", "Yorick", "Yunara", "Yuumi", "Zac", "Zed", "Zeri", "Ziggs",
  "Zilean", "Zoe", "Zyra"
];

const ddragonVersion = "15.14.1";

function App() {
  const [wins, setWins] = useState(() => {
    const saved = localStorage.getItem('arenaWins');
    return saved ? JSON.parse(saved) : [];
  });

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

      {/* Your win percentage component */}
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
    maxWidth: 720,
    margin: 'auto',
    padding: 20,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#f9fafb',
    color: '#1f2937',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '700',
    fontSize: '2.5rem',
    color: '#2563eb',
  },
  sectionTitle: {
    borderBottom: '2px solid #e0e7ff',
    paddingBottom: 6,
    marginBottom: 20,
    color: '#4338ca',
  },
  message: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#6b7280',
  },
  championList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    padding: 0,
    listStyle: 'none',
  },
  championItem: {
    width: 100,
    backgroundColor: 'white',
    borderRadius: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    padding: 10,
    textAlign: 'center',
    userSelect: 'none',
  },
  championImage: {
    width: 64,
    height: 64,
    objectFit: 'contain',
    borderRadius: 6,
    marginBottom: 8,
  },
  championName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
  },
};

export default App;
