import Dashboard from './Dashboard';
import { useEffect, useState } from 'react';
import './App.css';
import LoginPanel from './LoginPanel';

const weekPlan = [
  { day: 'FRI', date: '23', topic: 'Cell division review', time: '9:00 AM', tone: 'blue' },
  { day: 'MON', date: '26', topic: 'Mitosis: stages and key ideas', time: '9:00 AM', tone: 'peach' },
  { day: 'TUE', date: '27', topic: 'Meiosis vs. mitosis', time: '9:00 AM', tone: 'lavender' },
];

function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('preppulse_theme') === 'dark');
  const [authOpen, setAuthOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem('access_token'),
  );

  useEffect(() => {
    localStorage.setItem('preppulse_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    function handleSessionExpired() {
      localStorage.removeItem('access_token');
      setAuthToken(null);
      setAuthOpen(true);
      setAuthNotice('Your session expired. Please log in again to open your plan.');
    }

    window.addEventListener('preppulse:session-expired', handleSessionExpired);
    return () => window.removeEventListener('preppulse:session-expired', handleSessionExpired);
  }, []);

  function handleLogout() {
    localStorage.removeItem('access_token');
    setAuthToken(null);
    setAuthOpen(false);
    setAuthNotice('');
  }

  if (authToken) {
    return (
      <main className={`app-shell ${darkMode ? 'dark' : ''}`}>
        <header className="topbar planner-topbar">
          <a className="brand" href="#dashboard" aria-label="PrepPulse dashboard">
            <span className="brand-mark">✳</span>
            <span><strong>PrepPulse</strong><small>YOUR STUDY SPACE</small></span>
          </a>
          <div className="top-actions">
            <button className="mode-button" onClick={() => setDarkMode((value) => !value)} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? '☀' : '☾'}
            </button>
            <button className="logout-button" onClick={handleLogout}>Log out ↗</button>
          </div>
        </header>
        <Dashboard token={authToken} />
        <footer className="footer">
          <a className="brand footer-brand" href="#dashboard"><span className="brand-mark">✳</span><span><strong>PrepPulse</strong><small>EXAM REVISION PLANNER</small></span></a>
          <p>Find your rhythm. Feel exam-ready.</p>
        </footer>
      </main>
    );
  }

  return (
    <main className={`app-shell ${darkMode ? 'dark' : ''}`}>

      <header className="topbar">
        <a className="brand" href="#home" aria-label="PrepPulse home">
          <span className="brand-mark">✳</span>
          <span>
            <strong>PrepPulse</strong>
            <small>EXAM REVISION PLANNER</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#preview">The planner</a>
          <a href="#reading">Study breaks</a>
        </nav>

        <div className="top-actions">
          <button
            className={`mode-button ${darkMode ? 'selected' : ''}`}
            onClick={() => setDarkMode((value) => !value)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? '☀' : '☾'}
          </button>
          <button className="login-cta" onClick={() => { setAuthNotice(''); setAuthOpen(true); }}>Log in / Sign up <span>↗</span></button>
        </div>
      </header>

      <section className="hero-section" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span>✦</span> A calmer way to get exam-ready</div>
          <h1>
            Make your next
            <br />
            study session
            <br />
            <span className="gradient-text">count.</span>
          </h1>
          <p className="hero-description">
            A revision plan that fits your subjects, your exam dates, and your real life.
            Small steps, steady progress, less last-minute panic.
          </p>

          <div className="hero-buttons">
            <button className="primary-button" onClick={() => setAuthOpen(true)}>
              Build my study plan <span>↗</span>
            </button>
            <a className="quiet-link" href="#how-it-works">
              See how it works <span>↓</span>
            </a>
          </div>

          <div className="trust-row">
            <div className="avatar-stack" aria-hidden="true">
              <span>🌱</span><span>📚</span><span>☀️</span>
            </div>
            <p><strong>Your pace.</strong> Your plan. Your progress.</p>
          </div>
        </div>

        <div className="hero-visual" aria-label="A preview of a revision plan">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="spark spark-one">✦</div>
          <div className="spark spark-two">✧</div>

          <div className="floating-note note-top">
            <span className="note-icon">✳</span>
            <span><strong>One step at a time</strong><small>Your plan adapts to you</small></span>
          </div>

          <div className="planner-card genie-card">
            <div className="planner-card-head">
              <div>
                <span className="card-kicker">YOUR NEXT SESSION</span>
                <h2>Biology</h2>
              </div>
              <span className="subject-icon">🧬</span>
            </div>
            <div className="session-topic">
              <span className="topic-check">✓</span>
              <div><strong>Cell division</strong><small>Focus topic · 60 minutes</small></div>
            </div>
            <div className="session-meta">
              <span>◷ &nbsp;Tomorrow, 9:00 AM</span>
              <span className="break-chip">+ 10 min break</span>
            </div>
            <div className="card-progress">
              <div className="progress-label"><span>Weekly rhythm</span><strong>3 of 5 sessions</strong></div>
              <div className="progress-track"><span /></div>
            </div>
            <div className="ai-caption"><span>✦</span> Shaped around your goals</div>
          </div>

          <div className="floating-note note-bottom">
            <span className="streak-icon">↗</span>
            <span><strong>Nice momentum!</strong><small>3 sessions planned this week</small></span>
          </div>
          <div className="hero-glow" />
        </div>
      </section>

      <section className="stats-strip" aria-label="Planner highlights">
        <div><strong>01</strong><span>Add your subjects</span></div>
        <div><strong>02</strong><span>Set your available time</span></div>
        <div><strong>03</strong><span>Get a plan made for you</span></div>
        <div className="stats-spark">✳</div>
      </section>

      <section className="intro-section" id="how-it-works">
        <div className="section-heading">
          <span className="eyebrow">LESS STRESS, MORE STEADY</span>
          <h2>Big exams. <span>Manageable days.</span></h2>
          <p>PrepPulse turns your goals into a clear, gentle rhythm you can actually follow.</p>
        </div>

        <div className="feature-grid">
          <article className="feature-card feature-blue">
            <span className="feature-icon">✦</span>
            <span className="feature-number">01 / PERSONAL</span>
            <h3>Made around you</h3>
            <p>Your exam dates, subjects, weak spots, and free hours shape every plan.</p>
            <div className="feature-decoration blue-decoration">✳</div>
          </article>
          <article className="feature-card feature-olive">
            <span className="feature-icon">↗</span>
            <span className="feature-number">02 / BALANCED</span>
            <h3>Room to breathe</h3>
            <p>Short sessions and breaks help you keep a steady, sustainable pace.</p>
            <div className="feature-decoration olive-decoration">◌</div>
          </article>
          <article className="feature-card feature-peach">
            <span className="feature-icon">✧</span>
            <span className="feature-number">03 / FOCUSED</span>
            <h3>Start with what’s hard</h3>
            <p>Give the topics you find tricky a little more attention, one session at a time.</p>
            <div className="feature-decoration peach-decoration">✿</div>
          </article>
        </div>
      </section>

      <section className="plan-section" id="preview">
        <div className="plan-copy">
          <span className="eyebrow">YOUR WEEK, AT A GLANCE</span>
          <h2>A little structure goes a <span>long way.</span></h2>
          <p>
            See what’s next, keep your breaks, and build confidence as you move through
            each subject.
          </p>
          <button className="primary-button" onClick={() => setAuthOpen(true)}>Explore your planner <span>↗</span></button>
          <div className="small-note"><span>✦</span> Powered by your own goals and study rhythm</div>
        </div>

        <div className="week-card">
          <div className="week-card-head">
            <div>
              <span className="card-kicker">YOUR REVISION RHYTHM</span>
              <h3>This week <span>↗</span></h3>
            </div>
            <button className="week-menu" aria-label="More options">•••</button>
          </div>
          <div className="week-days">
            {weekPlan.map((item) => (
              <article className="week-row" key={item.date}>
                <div className="date-block"><small>{item.day}</small><strong>{item.date}</strong></div>
                <div className={`week-topic ${item.tone}`}>
                  <span className="topic-dot" />
                  <div><strong>{item.topic}</strong><small>{item.time} · 60 min</small></div>
                </div>
                <span className="row-arrow">↗</span>
              </article>
            ))}
          </div>
          <div className="week-footer">
            <span><i /> Balanced with your free hours</span>
            <strong>3 sessions</strong>
          </div>
          <div className="genie-orb" aria-hidden="true"><span>✦</span></div>
        </div>
      </section>
      <section className="reading-section" id="reading">
        <div className="reading-copy">
          <span className="eyebrow">A RESET THAT HELPS</span>
          <h2>Breaks are part <span>of the plan.</span></h2>
          <p>Take a short walk, stretch your shoulders, or drink a glass of water between study sessions.</p>
        </div>

        <div className="landing-break-card">
          <span>💧</span><strong>Water. Movement. A fresh thought.</strong>
          <p>Your personal dashboard has a timed break with gentle reminders and a new little study fact.</p>
          <button className="quiet-link" onClick={() => setAuthOpen(true)}>Open your planner ↗</button>
        </div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-mark">✳</span>
          <span><strong>PrepPulse</strong><small>EXAM REVISION PLANNER</small></span>
        </a>
        <p>Find your rhythm. Feel exam-ready.</p>
        <a className="back-top" href="#home">Back to top ↑</a>
      </footer>

      {authOpen && (
        <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="auth-close" onClick={() => setAuthOpen(false)} aria-label="Close login">×</button>
            <span className="eyebrow">WELCOME TO PREPPULSE</span>
            <h2 id="auth-title">Your plan starts <span>with you.</span></h2>
            <p>Log in or create an account to see your subjects and study plan.</p>
            {authNotice && <p className="auth-message" role="status">{authNotice}</p>}
            <LoginPanel onLogin={(token) => {
              localStorage.setItem('access_token', token);
              setAuthToken(token);
              setAuthOpen(false);
              setAuthNotice('');
            }} />
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
