// 강연·집필·협업 의뢰 받기 → inquiries 표
const { clip, sb, ready, body, notify } = require('./_lib/sb');

const TYPES = ['미술 인문학 강연', '학교 출강', '교사 연수', '저자와의 만남', '원고 집필', '교과서 및 교육 콘텐츠 집필', '미술교육 프로그램 개발', '기타 협업'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능해요' });
  if (!ready()) return res.status(500).json({ error: '저장소 연결 정보가 없어요. 잠시 뒤 다시 시도해 주세요.' });
  const b = body(req);
  if (b.website || Number(b.elapsed) < 2500) return res.status(200).json({ ok: true }); // 스팸 함정
  const row = {
    org: clip(b.org, 80), name: clip(b.name, 40), email: clip(b.email, 120), phone: clip(b.phone, 30),
    inquiry_type: clip(b.inquiry_type, 40), schedule: clip(b.schedule, 100), audience: clip(b.audience, 100),
    topic: clip(b.topic, 120), budget: clip(b.budget, 40), message: clip(b.message, 2000),
    consent: b.consent === true,
  };
  if (!row.org || !row.name || !row.email || !row.message) return res.status(400).json({ error: '기관명, 담당자 이름, 이메일, 의뢰 내용을 적어 주세요.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return res.status(400).json({ error: '이메일 주소를 다시 확인해 주세요.' });
  if (!TYPES.includes(row.inquiry_type)) return res.status(400).json({ error: '의뢰 유형을 골라 주세요.' });
  if (!row.consent) return res.status(400).json({ error: '개인정보 수집·이용에 동의해 주세요.' });

  const r = await sb('inquiries', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!r.ok) return res.status(500).json({ error: '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' });

  await notify(`[새 문의] ${row.org} · ${row.inquiry_type}`, [
    ['기관명', row.org], ['담당자', row.name], ['이메일', row.email], ['연락처', row.phone],
    ['의뢰 유형', row.inquiry_type], ['희망 일정', row.schedule], ['대상·인원', row.audience],
    ['희망 주제', row.topic], ['예상 예산', row.budget], ['의뢰 내용', row.message],
  ]);
  return res.status(200).json({ ok: true });
};
