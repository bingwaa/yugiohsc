(() => {
  const PAGES = [
    { code: 'BETB', file: 'BETB.html', title: '勇无止尽+补缀包' },
    { code: 'SGP1', file: 'SGP1.html', title: '时光飞越包' },
    { code: 'UT01', file: 'UT01.html', title: '实战精选' },
    { code: 'DBGV', file: 'DBGV.html', title: '荣光胜利者' },
    { code: 'WPS3', file: 'WPS3.html', title: '世界先行精选包2026' },
    { code: 'YAC1', file: 'YAC1.html', title: '源绘典藏包' },
    { code: 'IMPH', file: 'IMPH.html', title: '不死凤凰+补缀包' },
  ];
  const DAY = 86400000;
  const RECENT_DAYS = 5;

  const area = document.getElementById('widget-area');
  if (!area) return;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad2 = n => String(n).padStart(2, '0');
  const fmt = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

  const daysAgo = d => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((today - that) / DAY);
  };

  const rel = d => {
    const days = daysAgo(d);
    if (days === 0) return '今天';
    if (days <= RECENT_DAYS) return `${days}天前`;
    return null;
  };

  const isRecent = p => p.time ? daysAgo(p.time) <= RECENT_DAYS : false;

  const releaseTs = s => { const m = String(s).match(/(\d{4})\/(\d{2})\/(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : 0; };
  const secondTs = d => Math.floor(d.getTime() / 1000) * 1000;
  const dayTs = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

  const smallOf = html => { const m = String(html).match(/<p class="small">([^<]*)<\/p>/); return m ? m[1].trim() : ''; };
  const loadPage = (p, map) =>
    fetch(p.file)
      .then(r => r.text())
      .then(html => ({ ...p, time: map[p.file] ? new Date(map[p.file]) : null, released: smallOf(html) }))
      .catch(() => ({ ...p, time: map[p.file] ? new Date(map[p.file]) : null, released: '' }));

  const syncWidgetH = () => {
    const h = area.offsetHeight;
    if (h > 0) document.documentElement.style.setProperty('--widget-h', `${h}px`);
  };

  const render = rows => {
    rows.sort((a, b) => {
      const ra = isRecent(a);
      const rb = isRecent(b);
      if (ra !== rb) return ra ? -1 : 1;
      if (!ra) return releaseTs(b.released) - releaseTs(a.released);
      const da = dayTs(a.time);
      const db = dayTs(b.time);
      if (da === db) return releaseTs(b.released) - releaseTs(a.released);
      const ta = secondTs(a.time);
      const tb = secondTs(b.time);
      return tb - ta;
    });
    area.innerHTML = '<div class="page-list">' + rows.map(p => {
      const relTxt = p.time ? rel(p.time) : null;
      const date = relTxt ? `<span class="page-date">- 更新于${esc(relTxt)} ${esc(fmt(p.time))}</span>` : '';
      const released = p.released ? `<span class="page-releasedate">- ${esc(p.released)}</span>` : '';
      return `<a class="page-link" href="${esc(p.file)}"><span class="page-title">${esc(p.code)}：${esc(p.title)}</span>${released}${date}</a>`;
    }).join('') + '</div>';
    syncWidgetH();
  };

  fetch('updates.json')
    .then(r => r.json())
    .then(map => Promise.all(PAGES.map(p => loadPage(p, map))))
    .catch(() => Promise.all(PAGES.map(p => loadPage(p, {}))))
    .then(render);

  window.addEventListener('resize', syncWidgetH);
})();
