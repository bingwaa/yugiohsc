const { readFileSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { createHash } = require('node:crypto');

const root = resolve(__dirname, '..');

/* 需要随内容变化让浏览器与 CDN 重新拉取的资源：首页引用的 JS/CSS */
const ASSETS = ['main.js', 'style.css'];

const hash = createHash('sha1');
for (const name of ASSETS) {
  try { hash.update(readFileSync(join(root, name))); } catch { /* 文件缺失时跳过 */ }
}
const v = hash.digest('hex').slice(0, 8);

/* 首页：main.js / style.css。子页面不再注入 app.js?v=，避免每次提交改写子页面导致更新时间被刷新 */
const index = join(root, 'index.html');
let html = readFileSync(index, 'utf8');
html = html.replace(/style\.css(?:\?v=[0-9a-zA-Z]+)?/, `style.css?v=${v}`);
html = html.replace(/main\.js(?:\?v=[0-9a-zA-Z]+)?/, `main.js?v=${v}`);
writeFileSync(index, html);

console.log(`index.html 资源版本号已更新：${v}`);
