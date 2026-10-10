// 공개 후기 목록 — 공개 동의 + 관리자 승인된 후기의 표시용 칸만 내려 준다.
const { sb, ready } = require('./_lib/sb');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET만 가능해요' });
  if (!ready()) return res.status(200).json({ rows: [] });
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
  const program = String(req.query.program || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
  const q = [
    'select=id,created_at,program,period,one_line,memorable,display_name',
    'status=eq.승인', 'consent_public=is.true',
    program ? `program_id=eq.${program}` : '',
    'order=created_at.desc', `limit=${limit}`,
  ].filter(Boolean).join('&');
  const r = await sb(`reviews?${q}`);
  if (!r.ok) return res.status(200).json({ rows: [] });
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res.status(200).json({ rows: await r.json() });
};
