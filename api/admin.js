// 관리자 전용: 비밀번호 확인 + 문의·후기 목록 + 상태 바꾸기 + 후기 삭제
const crypto = require('node:crypto');
const { sb, ready, body } = require('./_lib/sb');

const same = (a, b) => {
  const h = (s) => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(h(a), h(b));
};
const TABLES = {
  inquiries: ['새 문의', '연락함', '완료'],
  reviews: ['대기', '승인', '숨김'],
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return res.status(500).json({ error: 'Vercel 환경변수에 ADMIN_PASSWORD를 넣고 Redeploy 해 주세요.' });
  if (!same(req.headers['x-admin-password'] || '', pass)) return res.status(401).json({ error: '비밀번호가 맞지 않아요.' });
  if (!ready()) return res.status(500).json({ error: 'Supabase 연결 정보가 없어요.' });

  if (req.method === 'GET') {
    const view = req.query.view === 'reviews' ? 'reviews' : 'inquiries';
    const r = await sb(`${view}?select=*&order=created_at.desc&limit=500`);
    if (!r.ok) return res.status(500).json({ error: '불러오지 못했어요.' });
    return res.status(200).json({ rows: await r.json() });
  }

  const b = body(req);
  const table = b.table in TABLES ? b.table : null;
  const id = Number(b.id);
  if (!table || !Number.isInteger(id)) return res.status(400).json({ error: '잘못된 요청이에요.' });

  if (req.method === 'PATCH') {
    if (!TABLES[table].includes(b.status)) return res.status(400).json({ error: '잘못된 요청이에요.' });
    if (table === 'reviews' && b.status === '승인') {
      // 공개에 동의하지 않은 후기는 승인할 수 없다
      const c = await sb(`reviews?id=eq.${id}&select=consent_public`);
      const [row] = c.ok ? await c.json() : [];
      if (!row) return res.status(404).json({ error: '후기를 찾지 못했어요.' });
      if (!row.consent_public) return res.status(400).json({ error: '공개에 동의하지 않은 후기는 게시할 수 없어요.' });
    }
    const r = await sb(`${table}?id=eq.${id}`, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status: b.status, updated_at: new Date().toISOString() }),
    });
    if (!r.ok) return res.status(500).json({ error: '바꾸지 못했어요.' });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    if (table !== 'reviews') return res.status(400).json({ error: '후기만 삭제할 수 있어요.' });
    const r = await sb(`reviews?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    if (!r.ok) return res.status(500).json({ error: '삭제하지 못했어요.' });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: '지원하지 않는 요청이에요.' });
};
