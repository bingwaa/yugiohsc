const { readdirSync, statSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

const root = resolve(__dirname, '..');

const out = {};
for (const name of readdirSync(root)) {
  if (!name.endsWith('.html') || name === 'index.html') continue;
  const file = join(root, name);
  try {
    out[name] = statSync(file).mtime.toISOString();
  } catch { /* 文件读取失败时跳过 */ }
}

writeFileSync(join(root, 'updates.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`updates.json 已生成：${Object.keys(out).length} 个页面`);
