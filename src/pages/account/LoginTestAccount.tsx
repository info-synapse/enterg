import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppFrame } from '@/components/Layout';
import { useAuth } from '@/state/AuthContext';

export function LoginTestAccount() {
  const { player, openAuth, logout, restoring, sessionError, retrySession } = useAuth();
  const [error, setError] = useState('');
  const signOut = async () => {
    setError('');
    try { await logout(); } catch { setError('Sign-out was not confirmed by the backend. Please try again.'); }
  };
  return <AppFrame slipRail={false}>
    <div className="card">
      <h1>Backend login test</h1>
      {restoring ? <p role="status">Checking your session…</p> : sessionError && !player ? <div role="alert"><p>{sessionError}</p><button className="btn btn-primary" onClick={retrySession}>Retry session check</button></div> : player ? <>
        <p role="status">Login accepted for <strong>{player.username}</strong>.</p>
        <p>Backend user ID: {player.id}</p>
        <p>Profile, balance, KYC and betting are not connected. No balance or verification status is inferred from login.</p>
        <Link className="btn btn-ghost" to="/account/deposit">View deposit methods</Link>
        <button className="btn btn-ghost" onClick={signOut}>Sign out of this test</button>
      </> : <button className="btn btn-primary" onClick={() => openAuth('login')}>Log in to a backend test account</button>}
      {sessionError && player && <p role="alert">{sessionError}</p>}
      {error && <p role="alert">{error}</p>}
      <p className="hint">Activity validates and renews your login through the backend, at most once per minute. After 30 minutes without renewal, log in again. Sign-out waits for backend confirmation.</p>
    </div>
  </AppFrame>;
}
