(() => {
  const grid = document.getElementById('data-grid');
  if (!grid) return;

  const search = document.getElementById('search-input');
  const prev = document.getElementById('prev-page');
  const next = document.getElementById('next-page');
  const info = document.getElementById('page-info');
  const toggle = document.getElementById('toggle-mode');
  const PER_PAGE = 40;

  /* 数据与图片由各 UTxx.html 内联定义（window.CARD_DATA），app.js 只负责渲染 */
  const DATA = window.CARD_DATA || [];

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* 占位图 null.png 不参与放大，其余图片可单击放大查看 */
  const zoomable = item => item.img && !item.img.endsWith('null.png');

  let data = DATA, page = 1, query = '', showAll = false;

  const render = () => {
    const pages = Math.ceil(data.length / PER_PAGE) || 1;
    if (page > pages) page = pages;
    const slice = showAll ? data : data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    grid.innerHTML = data.length
      ? slice.map(item => `<div class="cell" tabindex="0"><div class="cell-label">${String(item.id).padStart(3, '0')}</div>` +
          (item.img ? `<img class="cell-img${zoomable(item) ? ' zoomable' : ''}" src="${esc(item.img)}" alt="${esc(item.name)}">` : '') + '</div>').join('')
      : `<div class="empty">未找到匹配「${esc(query)}」的卡片</div>`;

    prev.hidden = showAll;
    next.hidden = showAll;
    info.textContent = data.length ? (showAll ? `${data.length} 张` : `${page}/${pages}`) : '无结果';
    prev.disabled = page <= 1;
    next.disabled = page >= pages;
  };

  const filter = () => {
    query = search ? search.value.trim().toLowerCase() : '';
    data = query ? DATA.filter(x => (x.name + ' ' + x.desc).toLowerCase().includes(query)) : DATA;
    page = 1;
    render();
  };

  if (search) search.addEventListener('input', filter);
  if (prev) prev.addEventListener('click', () => { if (page > 1) { page--; render(); } });
  if (next) next.addEventListener('click', () => { if (page < Math.ceil(data.length / PER_PAGE)) { page++; render(); } });
  if (toggle) toggle.addEventListener('click', () => {
    showAll = !showAll;
    toggle.textContent = showAll ? '分页显示' : '显示全部';
    page = 1;
    render();
  });

  /* 单击非占位图片放大查看：从原位置 0.2s 放大到居中，关闭时 0.2s 缩回原位置 */
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
    setTimeout(() => overlay.remove(), 260); /* 兜底：图片未加载时 transition 不会触发 */
  };

  grid.addEventListener('click', e => {
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
      void img.offsetWidth; /* 强制重排，让初始位置生效后再过渡 */
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
