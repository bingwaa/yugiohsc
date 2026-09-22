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
  const RECENT_DAYS = 5; /* 更新日超过该天数后，日期不再显示，排序回落到发售日 */

  const area = document.getElementById('widget-area');
  if (!area) return;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad2 = n => String(n).padStart(2, '0');
  const fmt = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

  /* 按本地日历日计算相差天数 */
  const daysAgo = d => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((today - that) / DAY);
  };

  /* 相对日期：0 天显示「今天」，超过 5 天视为未更新，不显示日期 */
  const rel = d => {
    const days = daysAgo(d);
    if (days === 0) return '今天';
    if (days <= RECENT_DAYS) return `${days}天前`;
    return null;
  };

  /* 5 天窗口内视为最近更新：既显示日期，也参与置顶排序；窗口外回落到发售日排序 */
  const isRecent = p => p.time ? daysAgo(p.time) <= RECENT_DAYS : false;

  /* 从「发售日 YYYY/MM/DD」解析时间戳；解析失败返回 0，排序时垫底 */
  const releaseTs = s => { const m = String(s).match(/(\d{4})\/(\d{2})\/(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : 0; };
  /* 更新时间精确到秒（去掉毫秒）；不同天按此从新到旧 */
  const secondTs = d => Math.floor(d.getTime() / 1000) * 1000;
  /* 更新日期按日历日对齐；同一天更新的页面视为「更新日期相同」 */
  const dayTs = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

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
    rows.sort((a, b) => {
      const ra = isRecent(a);
      const rb = isRecent(b);
      if (ra !== rb) return ra ? -1 : 1; /* 5 天内的更新置顶，窗口外的排在后面 */
      if (!ra) return releaseTs(b.released) - releaseTs(a.released); /* 均超出窗口：按发售日从新到旧 */
      const da = dayTs(a.time);
      const db = dayTs(b.time);
      if (da === db) return releaseTs(b.released) - releaseTs(a.released); /* 同一天更新按发售日从新到旧 */
      const ta = secondTs(a.time);
      const tb = secondTs(b.time);
      return tb - ta; /* 不同天按更新时间从新到旧 */
    });
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
