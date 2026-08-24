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

  const area = document.getElementById('widget-area');
  if (!area) return;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad2 = n => String(n).padStart(2, '0');
  const fmt = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

  /* 相对日期：按本地日历日计算；0 天显示「今天」，超过 5 天视为未更新，不显示日期 */
  const rel = d => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const days = Math.round((today - that) / DAY);
    if (days === 0) return '今天';
    if (days <= 5) return `${days}天前`;
    return null;
  };

  /* 从子页面 HTML 解析 p.small 内容，用于主页面发售日展示 */
  const smallOf = html => { const m = String(html).match(/<p class="small">([^<]*)<\/p>/); return m ? m[1].trim() : ''; };
  const loadPage = (p, map) =>
    fetch(p.file)
      .then(r => r.text())
      .then(html => ({ ...p, time: map[p.file] ? new Date(map[p.file]) : null, released: smallOf(html) }))
      .catch(() => ({ ...p, time: map[p.file] ? new Date(map[p.file]) : null, released: '' }));

  /* 按 widget-area 实际高度更新 --widget-h，保证页脚与列表间距恒为 16px；页面数变化无需再改样式常量 */
  const syncWidgetH = () => {
    const h = area.offsetHeight;
    if (h > 0) document.documentElement.style.setProperty('--widget-h', `${h}px`);
  };

  const render = rows => {
    rows.sort((a, b) => (b.time || 0) - (a.time || 0)); /* 新更新的排在上头 */
    area.innerHTML = '<div class="page-list">' + rows.map(p => {
      const relTxt = p.time ? rel(p.time) : null;
      const date = relTxt ? `<span class="page-date">- 更新于${esc(relTxt)} ${esc(fmt(p.time))}</span>` : '';
      const released = p.released ? `<span class="page-releasedate">- ${esc(p.released)}</span>` : '';
      return `<a class="page-link" href="${esc(p.file)}"><span class="page-title">${esc(p.code)}：${esc(p.title)}</span>${released}${date}</a>`;
    }).join('') + '</div>';
    syncWidgetH();
  };

  /* updates.json 由 scripts/gen-updates.js 生成并随仓库提交；缺失时回退为不带日期 */
  fetch('updates.json')
    .then(r => r.json())
    .then(map => Promise.all(PAGES.map(p => loadPage(p, map))))
    .catch(() => Promise.all(PAGES.map(p => loadPage(p, {}))))
    .then(render);

  window.addEventListener('resize', syncWidgetH); /* 窄屏换行会改变列表高度 */
})();
