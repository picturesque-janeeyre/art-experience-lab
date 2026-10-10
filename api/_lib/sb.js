// Supabase·알림 공통 도우미 — 키는 환경변수 이름으로만 읽는다. (_lib 폴더는 주소로 열리지 않는다)
const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const sbHeaders = () => ({
  apikey: SB_KEY,
  ...(String(SB_KEY).startsWith('eyJ') ? { Authorization: `Bearer ${SB_KEY}` } : {}),
  'Content-Type': 'application/json',
});
const ready = () => Boolean(SB_URL && SB_KEY);
const body = (req) => {
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  return b;
};
const sb = (path, opts = {}) => fetch(`${SB_URL}/rest/v1/${path}`, { ...opts, headers: { ...sbHeaders(), ...(opts.headers || {}) } });

// 새 문의·후기 알림 메일. RESEND_API_KEY와 NOTIFY_EMAIL이 있을 때만 보낸다. 실패해도 접수는 그대로 성공.
async function notify(subject, lines) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const html = `<div style="font-family:sans-serif;line-height:1.7">${lines.map(([k, v]) => `<p style="margin:0 0 8px"><b>${esc(k)}</b><br>${esc(v || '-').replace(/\n/g, '<br>')}</p>`).join('')}<p style="margin-top:20px;color:#888">관리자 페이지(/admin)에서 확인하세요.</p></div>`;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM || '미술 경험치 연구소 <onboarding@resend.dev>', to: [to], subject, html }),
    });
  } catch { /* 알림 실패는 무시 */ }
}

module.exports = { clip, sb, ready, body, notify };
