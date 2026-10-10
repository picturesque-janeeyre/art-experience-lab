// 수강 후기 받기 → reviews 표 (개인정보는 받지 않는다. 항상 '대기'로 시작)
const { clip, sb, ready, body, notify } = require('./_lib/sb');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능해요' });
  if (!ready()) return res.status(500).json({ error: '저장소 연결 정보가 없어요. 잠시 뒤 다시 시도해 주세요.' });
  const b = body(req);
  if (b.website || Number(b.elapsed) < 2500) return res.status(200).json({ ok: true }); // 스팸 함정
  const period = clip(b.period, 7);
  const row = {
    program_id: clip(b.program_id, 40), program: clip(b.program, 80),
    period: /^\d{4}-\d{2}$/.test(period) ? period : null,
    one_line: clip(b.one_line, 100), memorable: clip(b.memorable, 300), display_name: clip(b.display_name, 20),
    consent_public: b.consent_public === true,
  };
  if (!row.program) return res.status(400).json({ error: '참여한 강연이나 프로그램을 골라 주세요.' });
  if (!row.one_line) return res.status(400).json({ error: '한 줄 후기를 적어 주세요.' });

  const r = await sb('reviews', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!r.ok) return res.status(500).json({ error: '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' });

  await notify(`[새 후기] ${row.program}${row.consent_public ? ' (공개 동의)' : ' (비공개)'}`, [
    ['강연', row.program], ['한 줄 후기', row.one_line], ['기억에 남는 점', row.memorable],
    ['공개', row.consent_public ? '공개 동의 — 관리자 페이지에서 승인하면 게시됩니다' : '비공개 (작가에게만)'],
  ]);
  return res.status(200).json({ ok: true });
};
