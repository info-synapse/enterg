import { useState, type FormEvent } from 'react';
import { useAuth } from '@/state/AuthContext';
import { BrandMark, Icon } from './Icon';
import { LOGIN_TEST_MODE } from '@/api/mode';

export function AuthModal() {
  const { modal, openAuth } = useAuth();
  if (!modal) return null;
  return (
    <div className="backdrop center" onClick={() => openAuth(null)}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={modal === 'login' ? 'Log in' : 'Create account'} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px 0' }}>
          <BrandMark />
          <div className="seg" style={{ marginLeft: 8 }}>
            <button className={modal === 'login' ? 'active' : ''} onClick={() => openAuth('login')}>Log in</button>
            {!LOGIN_TEST_MODE && <button className={modal === 'register' ? 'active' : ''} onClick={() => openAuth('register')}>Join</button>}
          </div>
          <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => openAuth(null)} aria-label="Close"><Icon name="close" /></button>
        </div>
        {modal === 'login' || LOGIN_TEST_MODE ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}

function Sso() {
  const [note, setNote] = useState(false);
  return (
    <>
      <div className="sso">
        {['Google', 'Apple', 'Gov.gr'].map((p) => (
          <button key={p} type="button" className="btn btn-quiet" onClick={() => setNote(true)}>{p}</button>
        ))}
      </div>
      {note && <p className="hint">Single sign-on connects to your identity provider once the back end is live.</p>}
      <div className="divider">or</div>
    </>
  );
}

function LoginForm() {
  const { login, openAuth } = useAuth();
  const [username, setUsername] = useState(LOGIN_TEST_MODE ? '' : 'demo_player');
  const [password, setPassword] = useState(LOGIN_TEST_MODE ? '' : 'demo');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await login(username, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="modal-body" onSubmit={submit}>
      <h2 style={{ fontSize: 'var(--fs-xl)' }}>Welcome back</h2>
      {!LOGIN_TEST_MODE && <Sso />}
      <div className="field">
        <label htmlFor="login-user">Username or email</label>
        <input id="login-user" className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="login-pass">Password</label>
        <input id="login-pass" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <span className="hint">{LOGIN_TEST_MODE ? 'Use a test account from BetAPIService2. Demo credentials do not apply.' : 'Prototype: any username works with a password of 4 or more characters.'}</span>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      {!LOGIN_TEST_MODE && <p className="hint" style={{ textAlign: 'center' }}>New here? <button type="button" className="link" onClick={() => openAuth('register')}>Create an account</button></p>}
      <div className="rg-footer"><span className="age">21+</span>Only adults aged 21 or over can play.</div>
    </form>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [d, setD] = useState({ email: '', password: '', firstName: '', lastName: '', dateOfBirth: '', phone: '+30 ', terms: false, marketing: false });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof d, v: string | boolean) => setD((x) => ({ ...x, [k]: v }));

  const next = (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!/^\S+@\S+\.\S+$/.test(d.email)) return setError('Enter a valid email address.');
    if (d.password.length < 8) return setError('Use at least 8 characters for your password.');
    setStep(2);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!d.firstName || !d.lastName || !d.dateOfBirth) return setError('Fill in your name and date of birth as they appear on your ID.');
    if (!d.terms) return setError('Confirm you are 21 or over and accept the terms to continue.');
    setBusy(true);
    try {
      await register({ email: d.email, password: d.password, firstName: d.firstName, lastName: d.lastName, dateOfBirth: d.dateOfBirth, phone: d.phone });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return step === 1 ? (
    <form className="modal-body" onSubmit={next}>
      <h2 style={{ fontSize: 'var(--fs-xl)' }}>Create your account</h2>
      <p className="hint">Step 1 of 2 · Login details</p>
      <Sso />
      <div className="field"><label htmlFor="reg-email">Email</label><input id="reg-email" className="input" type="email" autoComplete="email" value={d.email} onChange={(e) => set('email', e.target.value)} /></div>
      <div className="field"><label htmlFor="reg-pass">Password</label><input id="reg-pass" className="input" type="password" autoComplete="new-password" value={d.password} onChange={(e) => set('password', e.target.value)} /><span className="hint">At least 8 characters.</span></div>
      {error && <div className="alert" role="alert">{error}</div>}
      <button className="btn btn-primary btn-block">Continue</button>
      <div className="rg-footer"><span className="age">21+</span>Need help signing up? Call us on +30 210 000 0000.</div>
    </form>
  ) : (
    <form className="modal-body" onSubmit={submit}>
      <h2 style={{ fontSize: 'var(--fs-xl)' }}>About you</h2>
      <p className="hint">Step 2 of 2 · Use the details on your ID so we can verify you quickly.</p>
      <div className="grid-2">
        <div className="field"><label htmlFor="reg-first">First name</label><input id="reg-first" className="input" autoComplete="given-name" value={d.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
        <div className="field"><label htmlFor="reg-last">Last name</label><input id="reg-last" className="input" autoComplete="family-name" value={d.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
      </div>
      <div className="field"><label htmlFor="reg-dob">Date of birth</label><input id="reg-dob" className="input" type="date" value={d.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} /></div>
      <div className="field"><label htmlFor="reg-phone">Mobile number</label><input id="reg-phone" className="input" type="tel" autoComplete="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} /></div>
      <label style={{ display: 'flex', gap: 10, fontSize: 'var(--fs-sm)' }}><input id="reg-terms" type="checkbox" checked={d.terms} onChange={(e) => set('terms', e.target.checked)} />I am 21 or over and accept the terms and privacy policy.</label>
      <label style={{ display: 'flex', gap: 10, fontSize: 'var(--fs-sm)', color: 'var(--ink-2)' }}><input id="reg-mkt" type="checkbox" checked={d.marketing} onChange={(e) => set('marketing', e.target.checked)} />Send me offers by email and SMS (optional).</label>
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="row-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </div>
    </form>
  );
}
