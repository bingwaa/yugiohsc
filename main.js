(() => {
  const PAGES = ['BETB', 'UT01'];
  const KEY = 'yugioh_widget_positions';
  const PAD = 24;    // 卡片距左右边缘的最小间距
  const TOP = 96;    // 顶部为页头与说明文字预留的空间
  const BOTTOM = 72; // 底部为页脚预留的空间

  const area = document.getElementById('widget-area');
  if (!area) return;

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { } };
  const isMobile = () => matchMedia('(max-width:640px)').matches;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(max, min));

  const positions = read();
  let drag = null;

  /* 在视口内取一个随机落点；若保存过旧位置，则从旧位置平滑移动到新落点 */
  const place = el => {
    const w = el.offsetWidth || 180;
    const h = el.offsetHeight || 88;
    const to = {
      left: PAD + Math.floor(Math.random() * Math.max(innerWidth - w - PAD * 2, 0)),
      top: TOP + Math.floor(Math.random() * Math.max(innerHeight - h - TOP - BOTTOM, 0))
    };
    const from = positions[el.dataset.page];

    el.style.transition = 'none';
    el.style.left = (from ? from.left : to.left) + 'px';
    el.style.top = (from ? from.top : to.top) + 'px';
    if (from) {
      void el.offsetWidth; /* 强制重绘，让过渡动画生效 */
      el.style.transition = 'left .4s ease, top .4s ease';
      el.style.left = to.left + 'px';
      el.style.top = to.top + 'px';
      el.addEventListener('transitionend', () => { el.style.transition = ''; }, { once: true });
    }
    positions[el.dataset.page] = to;
    write(positions);
  };

  const startDrag = (el, e) => {
    if (isMobile() || e.button !== 0) return;
    const r = el.getBoundingClientRect();
    drag = { el, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false };
    el.classList.add('dragging');
    el.style.transition = 'none';
    try { el.setPointerCapture(e.pointerId); } catch { }
    e.preventDefault();
  };

  document.addEventListener('pointermove', e => {
    if (!drag) return;
    const { el, sx, sy, ox, oy } = drag;
    const x = ox + e.clientX - sx;
    const y = oy + e.clientY - sy;
    if (!drag.moved && (Math.abs(x - ox) > 4 || Math.abs(y - oy) > 4)) drag.moved = true;
    /* 拖拽也限制在视口内，避免卡片被拖出屏幕丢失 */
    el.style.left = clamp(x, PAD, innerWidth - el.offsetWidth - PAD) + 'px';
    el.style.top = clamp(y, TOP, innerHeight - el.offsetHeight - BOTTOM) + 'px';
  });

  const endDrag = e => {
    if (!drag) return;
    const { el, moved } = drag;
    try { el.releasePointerCapture(e.pointerId); } catch { }
    el.classList.remove('dragging');
    el.style.transition = '';
    if (moved) {
      el.dataset.suppress = Date.now() + 300; /* 拖动结束后短暂拦截点击，避免误触跳转 */
      const r = el.getBoundingClientRect();
      positions[el.dataset.page] = { left: r.left, top: r.top };
      write(positions);
    }
    drag = null;
  };

  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  PAGES.forEach(name => {
    const el = document.createElement('a');
    el.className = 'draggable-widget';
    el.href = `views/${name}.html`;
    el.dataset.page = name;
    el.textContent = `${name}`;
    el.tabIndex = 0;

    el.addEventListener('pointerdown', e => startDrag(el, e));
    el.addEventListener('click', e => { if (el.dataset.suppress > Date.now()) e.preventDefault(); });
    el.addEventListener('keydown', e => {
      if (e.key === ' ') { e.preventDefault(); location.href = el.href; }
    });

    area.appendChild(el);
    if (!isMobile()) place(el);
  });

  /* 跨过移动端断点时切换布局：移动端清掉内联定位，桌面端重新散放 */
  matchMedia('(max-width:640px)').addEventListener('change', e => {
    for (const el of area.children) {
      if (e.matches) el.style.cssText = '';
      else place(el);
    }
  });
})();
