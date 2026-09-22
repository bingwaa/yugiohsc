(() => {
  const root = document.getElementById('ban-groups');
  if (!root) return;

  const search = document.getElementById('search-input');

  const GROUPS = window.CARD_GROUPS || [];

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const badgeLabel = x => `${x.from || '无限制'}→${x.badge}`;

  const STATE_ICON = {
    '无限制': 'three',
    '准限制': 'semi',
    '限制': 'limited',
    '禁止': 'forbidden',
  };

  const badgeHTML = x => {
    if (!x.badge) return '';
    const label = badgeLabel(x);
    const from = STATE_ICON[x.from || '无限制'];
    const to = STATE_ICON[x.badge];
    if (!from || !to) return `<span class="ban-badge ban-badge-text">${esc(label)}</span>`;
    return `<span class="ban-badge" role="img" aria-label="${esc(label)}" title="${esc(label)}">` +
      `<img class="ban-icon" src="assets/images/${from}.webp" alt="" width="64" height="64" loading="lazy">` +
      '<svg class="ban-arrow" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1 9 5 1 9z" fill="currentColor"/></svg>' +
      `<img class="ban-icon" src="assets/images/${to}.webp" alt="" width="64" height="64" loading="lazy">` +
      '</span>';
  };

  let query = '';

  const toRows = items => {
    const rows = new Map();
    items.forEach(x => {
      const key = x.badge || '';
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(x);
    });
    return [...rows.values()];
  };

  const render = () => {
    const q = query.toLowerCase();
    const groups = GROUPS
      .map(g => ({ title: g.title, items: q ? g.items.filter(x => x.name.toLowerCase().includes(q)) : g.items }))
      .filter(g => g.items.length);

    root.innerHTML = groups.length
      ? groups.map(g =>
          `<section class="ban-group"><header class="ban-group-head"><h2>${esc(g.title)}</h2><span class="ban-count">${g.items.length} 张</span></header>` +
          toRows(g.items).map(row =>
            '<div class="data-grid' + (row[0].badge ? ' has-badge' : '') + '">' + row.map(x =>
              '<div class="cell-slot">' + badgeHTML(x) +
              `<div class="cell" tabindex="0"><div class="cell-label">${esc(x.name)}</div>` +
              `<img class="cell-img zoomable" src="${esc(x.img)}" alt="${esc(x.name)}" loading="lazy">` +
              '</div></div>').join('') + '</div>').join('') +
          '</section>').join('')
      : `<div class="empty">未找到匹配「${esc(query)}」的卡片</div>`;
  };

  const filter = () => {
    query = search ? search.value.trim() : '';
    render();
  };

  if (search) search.addEventListener('input', filter);

  const closeZoom = () => {
    const overlay = document.querySelector('.zoom-overlay');
    if (!overlay || overlay.dataset.closing) return;
    overlay.dataset.closing = '1';
    document.body.classList.remove('zoom-lock');
    const img = overlay.querySelector('img');
    const from = JSON.parse(overlay.dataset.from);
    img.style.transition = 'left .2s ease, top .2s ease, width .2s ease, height .2s ease';
    Object.assign(img.style, {
      left: from.left + 'px', top: from.top + 'px',
      width: from.width + 'px', height: from.height + 'px'
    });
    img.addEventListener('transitionend', () => overlay.remove(), { once: true });
    setTimeout(() => overlay.remove(), 260);
  };

  root.addEventListener('click', e => {
    const thumb = e.target.closest('img.zoomable');
    if (!thumb || document.querySelector('.zoom-overlay')) return;
    const from = thumb.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'zoom-overlay';
    overlay.dataset.from = JSON.stringify({ left: from.left, top: from.top, width: from.width, height: from.height });
    const img = document.createElement('img');
    img.src = thumb.src;
    img.alt = thumb.alt;
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    document.body.classList.add('zoom-lock');

    img.style.transition = 'none';
    Object.assign(img.style, {
      left: from.left + 'px', top: from.top + 'px',
      width: from.width + 'px', height: from.height + 'px'
    });

    const animateIn = () => {
      void img.offsetWidth;
      img.style.transition = 'left .2s ease, top .2s ease, width .2s ease, height .2s ease';
      const maxW = innerWidth - 48;
      const maxH = innerHeight - 48;
      const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight) || 1;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      Object.assign(img.style, {
        left: (innerWidth - w) / 2 + 'px',
        top: (innerHeight - h) / 2 + 'px',
        width: w + 'px',
        height: h + 'px'
      });
    };
    if (img.complete && img.naturalWidth) animateIn();
    else img.addEventListener('load', animateIn);

    overlay.addEventListener('click', closeZoom);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });

  filter();
})();
