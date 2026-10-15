import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api';
import type { Player, PersonalDetails } from '@/api/types';
import { useAuth } from '@/state/AuthContext';
import { AppFrame } from '@/components/Layout';
import { AccountFrame } from './AccountFrame';
import { LOGIN_TEST_MODE } from '@/api/mode';
import { LoginTestAccount } from './LoginTestAccount';

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return <label style={{ display: 'grid', gap: 5 }}>{label}
    <input className="input" readOnly value={value == null || value === '' ? 'Not provided' : String(value)} />
  </label>;
}
function Preference({ label, value }: { label: string; value: boolean | null | undefined }) {
  return <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <input type="checkbox" disabled checked={value === true} />{label}
    {value == null && <span className="hint">Not provided</span>}
  </label>;
}
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 16 };
const preferences: { key: keyof PersonalDetails; label: string }[] = [
  { key: 'resultsEmail', label: 'Receive my results by email' },
  { key: 'finalScoreUpdates', label: 'Receive final score updates for my bets' },
  { key: 'liveScoreUpdates', label: 'Receive live score updates for my bets' },
  { key: 'resultsSmsPush', label: 'Receive my results by SMS or push notification' },
  { key: 'contactEmail', label: 'Contact me by email' },
  { key: 'weeklyPromotions', label: 'Send me promotional updates weekly' },
  { key: 'dailyPromotions', label: 'Send me promotional updates daily' },
  { key: 'aiSuggestions', label: 'Receive AI agent suggestions' },
  { key: 'autoFavouriteLeagues', label: 'Automatically set my favourite leagues' },
];

export function BackendProfile() {
  const { player, restoring } = useAuth();
  const [profile, setProfile] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [promoDraft, setPromoDraft] = useState('');
  useEffect(() => {
    setProfile(null); setError(''); setPromoDraft('');
    if (!player || restoring) { setLoading(false); return; }
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 35000);
    setLoading(true);
    api.account.getPlayer(controller.signal).then(result => {
      if (active) { setProfile(result); setPromoDraft(result.details?.promoCode ?? ''); }
    }).catch(() => {
      if (active) setError('Could not load your personal details. Please try again. If your session has expired, log in again.');
    }).finally(() => { window.clearTimeout(timer); if (active) setLoading(false); });
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [player, restoring, attempt]);

  if (!player || restoring) return LOGIN_TEST_MODE ? <LoginTestAccount /> : <AccountFrame><p role="status">Checking your account…</p></AccountFrame>;
  const d = profile?.details;
  const content = <>
    <h1 className="page-title">Personal details</h1>
    <p className="hint">Your saved account information. Changes cannot be saved from this page yet.</p>
    <button className="btn btn-ghost" disabled={loading} onClick={() => setAttempt(n => n + 1)}>Refresh personal details</button>
    {loading && <p role="status">Loading personal details…</p>}
    {error && <div role="alert">{error}<button className="btn btn-ghost" onClick={() => setAttempt(n => n + 1)}>Retry</button></div>}
    {!loading && profile && d && <>
      <section className="card"><h2>Personal information</h2><div style={grid}>
        <Detail label="User ID" value={profile.id} /><Detail label="Username" value={profile.username} />
        <Detail label="First name" value={profile.firstName} /><Detail label="Surname" value={profile.lastName} />
        <Detail label="Date of birth" value={profile.dateOfBirth.slice(0, 10)} />
        <Detail label="Gender" value={d.gender === 'M' ? 'Male' : d.gender === 'F' ? 'Female' : d.gender} />
        <Detail label="Country of birth" value={d.countryOfBirth} /><Detail label="Nationality" value={d.nationality} />
        <Detail label="Member since" value={profile.memberSince.slice(0, 10)} />
      </div></section>
      <section className="card"><h2>Contact details</h2><div style={grid}>
        <Detail label="Email" value={profile.email} /><Detail label="Mobile phone" value={profile.phone} />
        <Detail label="Landline" value={d.landline} /><Detail label="Address line 1" value={profile.address} />
        <Detail label="Address line 2" value={d.addressLine2} /><Detail label="Postcode" value={d.postcode} />
        <Detail label="Country code" value={d.countryCode} /><Detail label="Region" value={d.region} />
      </div></section>
      <section className="card"><h2>Identity document</h2><div style={grid}>
        <Detail label="Identity number" value={d.identityNumber} />
        <label style={{ display: 'grid', gap: 5 }}>Identity type
          <select className="select" disabled value={d.identityType ?? ''}>
            <option value="">Not provided</option><option value={1}>ID</option><option value={2}>Passport</option><option value={3}>Driving licence</option>
            {d.identityType !== null && ![1, 2, 3].includes(d.identityType) && <option value={d.identityType}>Unknown type ({d.identityType})</option>}
          </select>
        </label>
      </div><p className="hint">Identity verification status is not provided by this data.</p></section>
      <section className="card"><h2>Language and time zone</h2><div style={grid}>
        <Detail label="My language" value={d.language} /><Detail label="Time zone name" value={d.timezoneName} />
        <Detail label="Time zone ID" value={d.timezoneId} />
        <label style={{ display: 'grid', gap: 5 }}>Match time difference: {d.timezoneOffset === null ? 'Not provided' : `${d.timezoneOffset >= 0 ? '+' : ''}${d.timezoneOffset} hours`}
          <input type="range" disabled min={Math.min(-24, d.timezoneOffset ?? 0)} max={Math.max(24, d.timezoneOffset ?? 0)} step={1} value={d.timezoneOffset ?? 0} />
        </label>
      </div></section>
      <section className="card"><h2>Notifications and preferences</h2>
        {preferences.map(({ key, label }) => <Preference key={key} label={label} value={d[key] as boolean | null} />)}
      </section>
      <section className="card"><h2>Promo code</h2>
        <label>My promo code<input className="input" value={promoDraft} readOnly={!d.promoCodeEditable} onChange={event => setPromoDraft(event.target.value)} maxLength={50} /></label>
        <p className="hint">{d.promoCodeEditable ? 'No promo code is saved. You can enter a draft here, but it will not be saved yet.' : 'Your existing promo code cannot be edited.'}</p>
      </section>
    </>}
  </>;
  return LOGIN_TEST_MODE ? <AppFrame slipRail={false}><Link to="/account">Back to account</Link>{content}</AppFrame> : <AccountFrame>{content}</AccountFrame>;
}
