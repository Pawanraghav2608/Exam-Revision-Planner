import { useState, type FormEvent } from 'react';
import { loginUser, signupUser } from './api';

type LoginPanelProps = {
  onLogin: (token: string) => void;
};

export default function LoginPanel({ onLogin }: LoginPanelProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        onLogin(await loginUser(email, password));
      } else {
        const result = await signupUser(displayName, email, password);
        if (result.token) onLogin(result.token);
        else {
          setMessage(result.message);
          setMode('login');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-content">
      <div className="auth-tabs" role="tablist" aria-label="Account access">
        <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setMessage(''); }}>Log in</button>
        <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>Sign up</button>
      </div>

      <form className="login-panel" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <label>
            Your name
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required />
        </label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in to my plan ↗' : 'Create my account ↗'}
        </button>
      </form>
      <p className="auth-footnote">Your study plan stays private to your account.</p>
    </div>
  );
}
