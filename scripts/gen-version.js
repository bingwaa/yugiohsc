const { readFileSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { createHash } = require('node:crypto');

const root = resolve(__dirname, '..');

const ASSETS = ['main.js', 'style.css', 'banlist.js'];
const PAGES = ['index.html', 'ban.html'];

const hash = createHash('sha1');
for (const name of ASSETS) {
  try { hash.update(readFileSync(join(root, name))); } catch {  }
}
const v = hash.digest('hex').slice(0, 8);

let done = [];
for (const page of PAGES) {
  const file = join(root, page);
  let html;
  try { html = readFileSync(file, 'utf8'); } catch { continue; }
  for (const name of ASSETS) {
    const re = new RegExp(name.replace(/\./g, '\\.') + '(?:\\?v=[0-9a-zA-Z]+)?');
    html = html.replace(re, `${name}?v=${v}`);
  }
  writeFileSync(file, html);
  done.push(page);
}

console.log(`资源版本号已更新：${v}（${done.join('、')}）`);
