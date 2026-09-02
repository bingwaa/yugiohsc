const { readFileSync, writeFileSync, readdirSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { createHash } = require('node:crypto');

const root = resolve(__dirname, '..');

/* 需要随内容变化让浏览器与 CDN 重新拉取的资源：首页与卡牌页引用的 JS/CSS */
const ASSETS = ['main.js', 'style.css', 'app.js'];

const hash = createHash('sha1');
for (const name of ASSETS) {
  try { hash.update(readFileSync(join(root, name))); } catch { /* 文件缺失时跳过 */ }
}
const v = hash.digest('hex').slice(0, 8);

/* 首页：main.js / style.css */
const index = join(root, 'index.html');
let html = readFileSync(index, 'utf8');
html = html.replace(/style\.css(?:\?v=[0-9a-zA-Z]+)?/, `style.css?v=${v}`);
html = html.replace(/main\.js(?:\?v=[0-9a-zA-Z]+)?/, `main.js?v=${v}`);
writeFileSync(index, html);

/* 卡牌页：app.js；枚举 *.html（排除 index.html） */
let cards = 0;
for (const name of readdirSync(root)) {
  if (!name.endsWith('.html') || name === 'index.html') continue;
  const file = join(root, name);
  const src = readFileSync(file, 'utf8');
  const next = src.replace(/app\.js(?:\?v=[0-9a-zA-Z]+)?/, `app.js?v=${v}`);
  if (next !== src) { writeFileSync(file, next); cards++; }
}

console.log(`index.html 资源版本号已更新：${v}`);
console.log(`卡牌页 app.js 版本号已更新：${cards} 个`);
