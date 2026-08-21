/* 生成 updates.json：读取根目录下每个子页面最后一次 git 提交时间。
   推送前运行：node scripts/gen-updates.js */
const { execFileSync } = require('node:child_process');
const { readdirSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

const root = resolve(__dirname, '..');

const out = {};
for (const name of readdirSync(root)) {
  if (!name.endsWith('.html') || name === 'index.html') continue;
  const file = name;
  let time = '';
  try {
    time = execFileSync('git', ['log', '-1', '--follow', '--format=%cI', '--', file], { cwd: root }).toString().trim();
  } catch { /* 无提交记录时跳过该页 */ }
  if (time) out[file] = time;
}

writeFileSync(join(root, 'updates.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`updates.json 已生成：${Object.keys(out).length} 个页面`);
