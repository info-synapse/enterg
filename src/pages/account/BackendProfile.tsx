import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api';
import type { Player, ProfileUpdate } from '@/api/types';
import { useAuth } from '@/state/AuthContext';
import { AppFrame } from '@/components/Layout';
import { AccountFrame } from './AccountFrame';
import { LOGIN_TEST_MODE } from '@/api/mode';
import { LoginTestAccount } from './LoginTestAccount';

type Key = keyof ProfileUpdate;
const groups: { title: string; fields: [Key, string, number?][] }[] = [
  { title: 'Personal information', fields: [['firstName', 'First name', 60], ['lastName', 'Surname', 70], ['dateOfBirth', 'Date of birth'], ['gender', 'Gender'], ['countryOfBirth', 'Country of birth', 100], ['nationality', 'Nationality', 100]] },
  { title: 'Contact details', fields: [['email', 'Email', 80], ['phone', 'Mobile phone', 40], ['landline', 'Landline', 60], ['address', 'Address line 1', 100], ['addressLine2', 'Address line 2', 100], ['postcode', 'Postcode', 30], ['countryCode', 'Country code', 15], ['region', 'Region', 60]] },
  { title: 'Identity document', fields: [['identityNumber', 'Identity number', 20], ['identityType', 'Identity type']] },
  { title: 'Language and time zone', fields: [['language', 'My language', 25], ['timezoneName', 'Time zone name', 50], ['timezoneId', 'Time zone ID'], ['timezoneOffset', 'Match time difference (hours)']] },
  { title: 'Promo code', fields: [['promoCode', 'My promo code', 50]] },
];
const preferences: [Key, string][] = [
  ['resultsEmail', 'Receive my results by email'], ['finalScoreUpdates', 'Receive final score updates for my bets'],
  ['liveScoreUpdates', 'Receive live score updates for my bets'], ['resultsSmsPush', 'Receive my results by SMS or push notification'],
  ['contactEmail', 'Contact me by email'], ['weeklyPromotions', 'Send me promotional updates weekly'],
  ['dailyPromotions', 'Send me promotional updates daily'], ['aiSuggestions', 'Receive AI agent suggestions'],
  ['autoFavouriteLeagues', 'Automatically set my favourite leagues'],
];
function values(p: Player): ProfileUpdate {
  const { promoCodeEditable: _editable, ...details } = p.details!;
  return { ...details, firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone, address: p.address, dateOfBirth: p.dateOfBirth.slice(0, 10) };
}
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 16 };

export function BackendProfile() {
  const { player, restoring } = useAuth();
  const [profile, setProfile] = useState<Player | null>(null);
  const [draft, setDraft] = useState<ProfileUpdate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const saveLock = useRef(false);
  useEffect(() => {
    const id = ++generation.current;
    setProfile(null); setDraft({}); setError(''); setMessage(''); setSaving(false); saveLock.current = false;
    if (!player || restoring) { setLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 35000);
    setLoading(true);
    api.account.getPlayer(controller.signal).then(result => {
      if (generation.current === id) { setProfile(result); setDraft(values(result)); }
    }).catch(() => {
      if (generation.current === id) setError('Could not load your personal details. Please retry, or log in again if your session has expired.');
    }).finally(() => { window.clearTimeout(timer); if (generation.current === id) setLoading(false); });
    return () => { ++generation.current; controller.abort(); window.clearTimeout(timer); };
  }, [player, restoring, attempt]);

  const original = profile ? values(profile) : {};
  const changed = Object.fromEntries(Object.entries(draft).filter(([key, value]) => value !== original[key as Key])) as ProfileUpdate;
  const dirty = Object.keys(changed).length > 0;
  const set = (key: Key, value: string | number | boolean | null) => { setDraft(old => ({ ...old, [key]: value })); setMessage(''); };
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!dirty || saveLock.current) return;
    saveLock.current = true; setSaving(true); setError(''); setMessage('');
    const id = generation.current;
    let confirmed = false;
    try {
      await api.account.updateProfile(changed); confirmed = true;
      const result = await api.account.getPlayer();
      if (generation.current === id) { setProfile(result); setDraft(values(result)); setMessage('Your personal details have been saved.'); }
    } catch (err) {
      if (generation.current === id) {
        if (confirmed) { setProfile(null); setDraft({}); setError('Saved, but the updated details could not be loaded. Refresh to view them.'); }
        else setError(`${err instanceof Error ? err.message : 'The update could not be confirmed.'} Refresh before retrying if the connection was interrupted.`);
      }
    } finally { if (generation.current === id) { saveLock.current = false; setSaving(false); } }
  }
  if (!player || restoring) return LOGIN_TEST_MODE ? <LoginTestAccount /> : <AccountFrame><p role="status">Checking your account…</p></AccountFrame>;
  const content = <>
    <h1 className="page-title">Personal details</h1>
    <button className="btn btn-ghost" disabled={loading || saving || dirty} onClick={() => setAttempt(n => n + 1)}>Refresh personal details</button>
    {loading && <p role="status">Loading personal details…</p>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!loading && profile && <form onSubmit={save}>
      <p>User ID: {profile.id} · Username: {profile.username} · Member since: {profile.memberSince.slice(0, 10) || 'Not provided'}</p>
      <fieldset disabled={saving} style={{ border: 0, padding: 0, minWidth: 0 }}>
        {groups.map(group => <section className="card" key={group.title}><h2>{group.title}</h2><div style={grid}>
          {group.fields.map(([key, label, maxLength]) => <label key={key} style={{ display: 'grid', gap: 5 }}>{label}
            {key === 'identityType' || key === 'gender' ? <select className="select" value={String(draft[key] ?? '')} onChange={e => set(key, key === 'identityType' ? Number(e.target.value) : e.target.value)}>
              <option value="" disabled>Not provided</option>
              {key === 'identityType' ? <><option value="1">ID</option><option value="2">Passport</option><option value="3">Driving licence</option>{draft.identityType != null && ![1, 2, 3].includes(draft.identityType) && <option value={draft.identityType}>Unknown type ({draft.identityType})</option>}</> : <><option value="M">Male</option><option value="F">Female</option></>}
            </select> : <input className="input" type={key === 'dateOfBirth' ? 'date' : key === 'email' ? 'email' : key === 'timezoneId' || key === 'timezoneOffset' ? 'number' : 'text'}
              value={String(draft[key] ?? '')} maxLength={maxLength} step={1} min={key === 'timezoneOffset' ? -24 : key === 'timezoneId' ? 0 : undefined} max={key === 'timezoneOffset' ? 24 : key === 'timezoneId' ? 2147483647 : undefined}
              readOnly={key === 'promoCode' && !profile.details?.promoCodeEditable}
              onChange={e => set(key, key === 'timezoneId' || key === 'timezoneOffset' ? e.target.value === '' ? null : Number(e.target.value) : e.target.value)} />}
          </label>)}
        </div>{group.title === 'Promo code' && !profile.details?.promoCodeEditable && <p className="hint">Your existing promo code cannot be edited.</p>}</section>)}
        <section className="card"><h2>Notifications and preferences</h2>
          {preferences.map(([key, label]) => <label key={key} style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={draft[key] === true} onChange={e => set(key, e.target.checked)} />{label}{draft[key] == null && <span className="hint">Not provided</span>}</label>)}
        </section>
        <button className="btn btn-primary" disabled={!dirty} type="submit">{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn btn-ghost" type="button" disabled={!dirty} onClick={() => { setDraft(values(profile)); setError(''); setMessage(''); }}>Discard changes</button>
      </fieldset>
    </form>}
  </>;
  return LOGIN_TEST_MODE ? <AppFrame slipRail={false}><Link to="/account">Back to account</Link>{content}</AppFrame> : <AccountFrame>{content}</AccountFrame>;
}
