import { useState } from 'react';
import { AppFrame } from '@/components/Layout';
import { useAuth } from '@/state/AuthContext';

export function LoginTestAccount() {
  const { player, openAuth, logout, restoring, sessionError, retrySession } = useAuth();
  const [error, setError] = useState('');
  const signOut = async () => {
    try { await logout(); } catch { setError('Could not reach the gateway to sign out. Try again.'); }
  };
  return <AppFrame slipRail={false}>
    <div className="card">
      <h1>Backend login test</h1>
      {restoring ? <p role="status">Checking your session…</p> : sessionError ? <div role="alert"><p>{sessionError}</p><button className="btn btn-primary" onClick={retrySession}>Retry session check</button></div> : player ? <>
        <p role="status">Login accepted for <strong>{player.username}</strong>.</p>
        <p>Backend user ID: {player.id}</p>
        <p>Profile, balance, KYC and betting are not connected. No balance or verification status is inferred from login.</p>
        <button className="btn btn-ghost" onClick={signOut}>Sign out of this test</button>
      </> : <button className="btn btn-primary" onClick={() => openAuth('login')}>Log in to a backend test account</button>}
      {error && <p role="alert">{error}</p>}
      <p className="hint">Sign-out clears the gateway session only. Reloading restores your login while the gateway session remains valid. Backend session termination is a later integration step.</p>
    </div>
  </AppFrame>;
}
