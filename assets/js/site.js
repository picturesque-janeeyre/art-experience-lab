/* 미술 경험치 연구소 — 공통 스크립트
   머리말·꼬리말, 책·강연 데이터 그리기, 후기 불러오기, 두 개의 폼(후기 / 협업 의뢰). */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';

  /* ── 머리말·꼬리말 ───────────────────── */
  const NAV = [
    ['/about', '작가 소개'],
    ['/library', '작가의 서재'],
    ['/programs', '강연과 교육'],
    ['/voices', '수강생의 목소리'],
  ];
  const header = $('#site-header');
  if (header) {
    header.className = 'site-header';
    header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="/" aria-label="미술 경험치 연구소 홈"><b>미술 경험치 연구소</b><i>Art Experience Lab</i></a>
        <nav class="nav" id="nav" aria-label="주 메뉴">
          ${NAV.map(([h, t]) => `<a href="${h}"${path === h || path.startsWith(h + '/') ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
        </nav>
        <a class="btn header-cta" href="/contact">문의하기</a>
        <button class="menu-btn" type="button" aria-controls="nav" aria-expanded="false"><span></span><span></span><span class="sr-only">메뉴 열기</span></button>
      </div>`;
    const btn = $('.menu-btn', header), nav = $('#nav', header);
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  }
  const footer = $('#site-footer');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="wrap">
        <div class="f-brand"><b>미술 경험치 연구소</b><i>Art Experience Lab</i><p style="margin:8px 0 0">그림을 만나고, 취향을 발견하고, 생각을 남기다.</p></div>
        <nav aria-label="꼬리말 메뉴">
          ${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}
          <a href="/contact">협업 문의</a>
          <a href="https://blog.naver.com/picturesque-moment" target="_blank" rel="noopener">블로그</a>
          <a href="/privacy">개인정보 처리방침</a>
        </nav>
        <small>© 김수정 · 미술 경험치 연구소. 사이트의 명화 이미지는 저작권 보호 기간이 지난 작품으로, 위키미디어 공용에서 불러옵니다.</small>
      </div>`;
  }

  /* ── 데이터 ───────────────────── */
  const cache = {};
  const load = (name) => (cache[name] ||= fetch(`/data/${name}.json`).then((r) => r.json()));
  const searchUrl = (b) => `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=${encodeURIComponent(b.title)}`;

  const bookCover = (b, tag = 'button') => `
    <${tag} class="book" data-cloth="${esc(b.cloth)}" ${tag === 'button' ? `type="button" data-book="${esc(b.id)}" aria-label="${esc(b.title)} 자세히 보기"` : ''}>
      ${b.cover ? `<img class="cover" src="${esc(b.cover)}" alt="">` : ''}
      <span><span class="t">${esc(b.title)}</span><span class="rule" style="display:block"></span><span class="c">${esc(b.category)}</span></span>
      <span class="p">${esc(b.publisher)}</span>
      ${b.kind === 'upcoming' ? '<span class="badge">근간</span>' : ''}
    </${tag}>`;

  const bookCell = (b) => `
    <div class="book-cell">
      ${bookCover(b)}
      <div class="book-meta">${esc(b.publisher)}, ${esc(b.year)}${b.kind === 'upcoming' ? ' 출간 예정' : ''}</div>
    </div>`;

  async function renderShelves() {
    const targets = $$('[data-shelf]');
    if (!targets.length) return;
    const { books } = await load('books');
    targets.forEach((el) => {
      const kinds = el.dataset.shelf.split(',');
      el.innerHTML = books.filter((b) => kinds.includes(b.kind)).map(bookCell).join('');
    });
    setupBookDialog(books);
  }

  async function setupBookDialog(books) {
    const dlg = $('#book-detail');
    if (!dlg) return;
    const { programs } = await load('programs');
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-book]');
      if (!btn) return;
      const b = books.find((x) => x.id === btn.dataset.book);
      if (!b) return;
      const related = programs.filter((p) => b.programs.includes(p.id));
      const kindLabel = { book: '단행본', textbook: '미술 교과서', upcoming: '근간' }[b.kind];
      $('.detail-body', dlg).innerHTML = `
        <div class="detail-inner">
          <div>${bookCover(b, 'div')}</div>
          <div>
            <p class="muted" style="margin-bottom:6px">${kindLabel}, ${esc(b.category)}</p>
            <h2>${esc(b.title)}</h2>
            <p class="muted">${esc(b.publisher)}, ${esc(b.year)}${b.kind === 'upcoming' ? ' 출간 예정' : ''}</p>
            ${b.summary ? `<p>${esc(b.summary)}</p>` : '<p class="muted">책 소개를 준비하고 있어요.</p>'}
            ${b.contents.length ? `<h3 style="font-size:17px;margin:20px 0 8px">주요 내용</h3><ul>${b.contents.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
            ${related.length ? `<h3 style="font-size:17px;margin:20px 0 8px">이 책과 이어지는 강연</h3><ul>${related.map((p) => `<li><a class="text-link" href="/programs#${p.id}">${esc(p.title)}</a></li>`).join('')}</ul>` : ''}
            <div class="btn-row" style="margin-top:28px">
              <a class="btn" href="/contact?topic=${encodeURIComponent(b.title)}">이 책으로 강연 문의하기</a>
              ${b.kind !== 'upcoming' ? `<a class="btn btn-line" href="${esc(b.buyUrl || searchUrl(b))}" target="_blank" rel="noopener">${b.buyUrl ? '구매하기' : '온라인 서점에서 찾기'}</a>` : ''}
            </div>
          </div>
        </div>`;
      dlg.showModal();
    });
    $('.detail-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  async function renderPrograms() {
    const full = $('[data-programs="full"]');
    const compact = $('[data-programs="compact"]');
    if (!full && !compact) return;
    const [{ programs }, { books }] = await Promise.all([load('programs'), load('books')]);
    const bookTitle = (id) => books.find((b) => b.id === id)?.title;
    if (compact) {
      compact.innerHTML = programs.filter((p) => p.featured).map((p) => `
        <a class="program-compact" href="/programs#${p.id}"><h3>${esc(p.title)}</h3><span>자세히</span></a>`).join('');
    }
    if (full) {
      full.innerHTML = programs.map((p) => {
        const rel = p.books.map(bookTitle).filter(Boolean);
        const rows = [
          ['대상', p.audience], ['진행 방식', p.format], ['예상 시간', p.duration],
        ].filter(([, v]) => v);
        return `
        <li class="program" id="${p.id}">
          <div>
            <h3>${esc(p.title)}</h3>
            <p class="muted" style="margin:10px 0 0;font-size:15px">${p.detail ? esc(p.detail) : '세부 구성은 의뢰 기관의 대상과 일정에 맞춰 조정합니다.'}</p>
          </div>
          <dl>
            ${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}
            ${rel.length ? `<dt>함께 읽을 책</dt><dd>${rel.map((t) => `『${esc(t)}』`).join('<br>')}</dd>` : ''}
          </dl>
          <a class="btn btn-line" href="/contact?topic=${encodeURIComponent(p.title)}">이 주제로 문의하기</a>
        </li>`;
      }).join('');
      if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }
  }

  /* ── 후기 목록 (승인·공개 동의된 것만 서버가 내려 준다) ───── */
  async function renderVoices() {
    const targets = $$('[data-voices]');
    if (!targets.length) return;
    for (const el of targets) {
      const limit = Number(el.dataset.limit || 30);
      const filter = $('#voice-filter');
      const draw = async () => {
        const program = filter?.value || '';
        let rows = [];
        try {
          const r = await fetch(`/api/reviews?limit=${limit}${program ? `&program=${encodeURIComponent(program)}` : ''}`);
          if (r.ok) rows = (await r.json()).rows || [];
        } catch { /* 후기를 못 불러와도 페이지는 그대로 */ }
        if (!rows.length) {
          el.className = '';
          el.innerHTML = path === '/voices/write'
            ? `<div class="empty"><p style="margin:0">아직 남겨진 후기가 없어요. 첫 후기를 남겨 주세요.</p></div>`
            : `<div class="empty"><p>첫 번째 후기를 기다리고 있어요.</p><a class="btn btn-line" href="/voices/write">후기 남기기</a></div>`;
          return;
        }
        el.className = 'voices';
        el.innerHTML = rows.map((v) => `
          <article class="voice">
            <q>${esc(v.one_line)}</q>
            ${v.memorable ? `<p>${esc(v.memorable)}</p>` : ''}
            <footer>${esc(v.display_name || '익명 수강생')}, ${esc(v.program)}${v.period ? ` (${esc(v.period.replace('-', '년 '))}월)` : ''}</footer>
          </article>`).join('');
      };
      if (filter && !filter.dataset.bound) { filter.dataset.bound = '1'; filter.addEventListener('change', draw); }
      draw();
    }
  }

  /* 후기·필터에 쓸 프로그램 선택 목록 */
  async function fillProgramSelects() {
    const sels = $$('select[data-program-options]');
    if (!sels.length) return;
    const { programs, authorTalks } = await load('programs');
    const preset = new URLSearchParams(location.search).get('program');
    sels.forEach((sel) => {
      const withOther = sel.dataset.programOptions === 'form';
      sel.insertAdjacentHTML('beforeend', `
        <optgroup label="강연 프로그램">${programs.map((p) => `<option value="${p.id}">${esc(p.title)}</option>`).join('')}</optgroup>
        <optgroup label="저자 강연">${authorTalks.map((p) => `<option value="${p.id}">${esc(p.title)}</option>`).join('')}</optgroup>
        ${withOther ? '<option value="other">그 밖의 강연·수업 (직접 적기)</option>' : ''}`);
      if (preset && sel.querySelector(`option[value="${CSS.escape(preset)}"]`)) sel.value = preset;
      sel.dispatchEvent(new Event('change'));
    });
  }

  /* ── 폼 공통 ───────────────────── */
  const startedAt = Date.now();
  async function send(url, data, form) {
    const msg = $('.form-msg', form);
    const btn = $('button[type=submit]', form);
    msg.textContent = ''; msg.className = 'form-msg';
    btn.disabled = true; const label = btn.textContent; btn.textContent = '보내는 중…';
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, elapsed: Date.now() - startedAt }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      return true;
    } catch (e) {
      msg.textContent = e.message; msg.className = 'form-msg err';
      return false;
    } finally { btn.disabled = false; btn.textContent = label; }
  }
  const val = (form, name) => (form.elements[name]?.value ?? '').trim();

  $$('textarea[maxlength], input[data-count]').forEach((el) => {
    const c = el.closest('.field')?.querySelector('.counter');
    if (!c) return;
    const upd = () => { c.textContent = `${el.value.length}/${el.maxLength}`; };
    el.addEventListener('input', upd); upd();
  });

  /* 후기 폼 */
  const reviewForm = $('#review-form');
  if (reviewForm) {
    const sel = reviewForm.elements.program_id;
    const otherWrap = $('#program-other-wrap');
    sel.addEventListener('change', () => { otherWrap.hidden = sel.value !== 'other'; });
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = reviewForm;
      const consent = f.elements.consent_public.value;
      if (!sel.value) return showErr(f, '참여한 강연이나 프로그램을 골라 주세요.');
      if (!val(f, 'one_line')) return showErr(f, '한 줄 후기를 적어 주세요.');
      if (!consent) return showErr(f, '후기 공개 여부를 골라 주세요.');
      const label = sel.value === 'other' ? val(f, 'program_other') : sel.selectedOptions[0].textContent;
      if (!label) return showErr(f, '참여한 강연 이름을 적어 주세요.');
      const ok = await send('/api/review', {
        program_id: sel.value, program: label, period: val(f, 'period'),
        one_line: val(f, 'one_line'), memorable: val(f, 'memorable'), display_name: val(f, 'display_name'),
        consent_public: consent === 'yes', website: val(f, 'website'),
      }, f);
      if (ok) {
        f.hidden = true;
        const done = $('#review-done');
        $('[data-done-text]', done).textContent = consent === 'yes'
          ? '확인한 뒤 수강생의 목소리에 게시됩니다.'
          : '공개하지 않고 작가에게만 전달됩니다.';
        done.hidden = false; done.scrollIntoView({ block: 'center' });
      }
    });
  }

  /* 협업 의뢰 폼 */
  const contactForm = $('#contact-form');
  if (contactForm) {
    const topic = new URLSearchParams(location.search).get('topic');
    if (topic) contactForm.elements.topic.value = topic.slice(0, 120);
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = contactForm;
      const need = [['org', '기관명'], ['name', '담당자 이름'], ['email', '이메일'], ['message', '의뢰 내용']];
      for (const [k, t] of need) if (!val(f, k)) { f.elements[k].focus(); return showErr(f, `${t}을(를) 적어 주세요.`); }
      if (!f.elements.email.checkValidity()) { f.elements.email.focus(); return showErr(f, '이메일 주소를 다시 확인해 주세요.'); }
      if (!val(f, 'inquiry_type')) return showErr(f, '의뢰 유형을 골라 주세요.');
      if (!f.elements.consent.checked) return showErr(f, '개인정보 수집·이용에 동의해 주세요.');
      const ok = await send('/api/inquiry', {
        org: val(f, 'org'), name: val(f, 'name'), email: val(f, 'email'), phone: val(f, 'phone'),
        inquiry_type: val(f, 'inquiry_type'), schedule: val(f, 'schedule'), audience: val(f, 'audience'),
        topic: val(f, 'topic'), budget: val(f, 'budget'), message: val(f, 'message'),
        consent: f.elements.consent.checked, website: val(f, 'website'),
      }, f);
      if (ok) {
        f.hidden = true;
        const done = $('#contact-done');
        done.hidden = false; done.scrollIntoView({ block: 'center' });
      }
    });
  }
  function showErr(form, text) { const m = $('.form-msg', form); m.textContent = text; m.className = 'form-msg err'; }

  /* ── 홈: 두 그림 고르기 (2차 취향 연구소 맛보기) ───── */
  const duel = $('.duel');
  if (duel) {
    duel.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', duel).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      duel.classList.add('chosen');
      const r = $('#duel-result');
      $('[data-pick]', r).textContent = b.dataset.title;
      r.hidden = false;
    });
  }

  renderShelves();
  renderPrograms();
  fillProgramSelects().then(renderVoices);
})();
