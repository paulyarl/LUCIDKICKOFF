// S3.3 E2E — consent gate → idempotent ingest → dedupe, against local :3000.
// Uses the demo parent account + service key for cleanup. Temporary verify script.
const fs = require('fs');
const path = require('path');

const env = {};
for (const f of ['.env.local', 'apps/web/.env.local']) {
  for (const line of fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}
const BASE = process.env.BASE || 'http://localhost:3000';
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;
const REF = new URL(URL_).hostname.split('.')[0];

const api = async (p, opts = {}) => {
  const res = await fetch(`${URL_}${p}`, {
    ...opts,
    headers: { apikey: ANON, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  return res.json();
};
const svc = async (p, method = 'POST', body) => {
  const res = await fetch(`${URL_}/rest/v1${p}`, {
    method,
    headers: {
      apikey: SVC, Authorization: `Bearer ${SVC}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status === 204 ? null : res.json();
};

(async () => {
  const session = await api('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: env.DEMO_PARENT_EMAIL, password: env.DEMO_PARENT_PASSWORD }),
  });
  if (!session.access_token) { console.log('LOGIN FAIL', session); process.exit(1); }
  console.log('logged in as parent', session.user.id, 'role:', session.user.app_metadata?.role);

  const sessionJson = JSON.stringify(session);
  const b64 = Buffer.from(sessionJson, 'utf8').toString('base64');
  const cookie = `sb-${REF}-auth-token=base64-${b64}`;
  const app = async (p, opts = {}) => {
    const res = await fetch(`${BASE}${p}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Cookie: cookie, ...(opts.headers || {}) },
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  };

  const startConsent = await app('/api/sync/consent');
  console.log('GET consent:', startConsent.status, startConsent.json);

  // snapshot pre-existing progress so cleanup can restore it exactly
  const prior = await svc(`/user_lesson_progress?user_id=eq.${session.user.id}&lesson_id=eq.lesson_amazing_01&select=step_index,stars,passed_steps,child_profile_id`, 'GET');

  const op = (opId, stepIndex) => ({
    opId, type: 'lesson_progress', payloadVersion: 1,
    payload: { lessonId: 'lesson_amazing_01', stepIndex, stars: 2, passedSteps: 1 },
  });
  const batch = (ops) => app('/api/sync/batch', { method: 'POST', body: JSON.stringify({ ops }) });

  const before = await batch([op('e2e-t1', 1)]);
  console.log('batch before consent:', before.status, JSON.stringify(before.json));

  const grant = await app('/api/sync/consent', { method: 'POST', body: JSON.stringify({ consent: true }) });
  console.log('grant consent:', grant.status, grant.json);

  const first = await batch([op('e2e-t1', 1), op('e2e-t2', 2)]);
  console.log('batch 1:', first.status, JSON.stringify(first.json));

  const replay = await batch([op('e2e-t1', 1)]);
  console.log('replay e2e-t1:', replay.status, JSON.stringify(replay.json));

  const lower = await batch([op('e2e-t3', 0)]);
  console.log('lower stepIndex (max merge):', lower.status, JSON.stringify(lower.json));

  // --- S3.4 artwork ops: apply → replay dedupe → same-key conflict ---
  const art = (opId, lines) => ({
    opId, type: 'artwork', payloadVersion: 1,
    payload: { key: 'e2e-test-art', json: { version: 2, templateId: null, lines, texts: [] } },
  });
  const art1 = await batch([art('e2e-a1', [{ x: 1 }])]);
  console.log('artwork apply:', art1.status, JSON.stringify(art1.json));
  const artReplay = await batch([art('e2e-a1', [{ x: 1 }])]);
  console.log('artwork replay:', artReplay.status, JSON.stringify(artReplay.json));
  const artConflict = await batch([art('e2e-a2', [{ x: 999 }])]);
  console.log('artwork conflict:', artConflict.status, JSON.stringify(artConflict.json));

  const revoke = await app('/api/sync/consent', { method: 'POST', body: JSON.stringify({ consent: false }) });
  console.log('withdraw:', revoke.status, revoke.json);

  const after = await batch([op('e2e-t4', 1)]);
  console.log('batch after withdraw:', after.status, JSON.stringify(after.json));

  const prog = await svc(`/user_lesson_progress?user_id=eq.${session.user.id}&lesson_id=eq.lesson_amazing_01&select=id,step_index,stars,passed_steps,child_profile_id`, 'GET');
  console.log('user_lesson_progress row:', JSON.stringify(prog));

  // cleanup test rows + restore pre-existing progress + initial consent state
  await svc(`/sync_operations?user_id=eq.${session.user.id}&op_id=like.e2e-*`, 'DELETE');
  await svc(`/user_lesson_progress?user_id=eq.${session.user.id}&lesson_id=eq.lesson_amazing_01`, 'DELETE');
  // remove the e2e artwork object (storage)
  await fetch(`${URL_}/storage/v1/object/drawings/${session.user.id}/e2e-test-art.json`, {
    method: 'DELETE', headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
  }).catch(() => {});
  if (prior?.[0]) {
    await svc('/user_lesson_progress', 'POST', {
      user_id: session.user.id,
      lesson_id: 'lesson_amazing_01',
      ...prior[0],
    });
    console.log('restored pre-existing progress row');
  }
  await svc(`/consent_records?guardian_id=eq.${session.user.id}&purpose=eq.cloud_sync`, 'DELETE');
  if (startConsent.json?.consent) {
    await app('/api/sync/consent', { method: 'POST', body: JSON.stringify({ consent: true }) });
    console.log('restored consent to granted');
  }
  console.log('cleanup done');
})().catch((e) => { console.error('E2E FAIL', e); process.exit(1); });
