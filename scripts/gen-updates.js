/* 生成 updates.json：读取 views/ 下每个子页面最后一次 git 提交时间。
   推送前运行：node scripts/gen-updates.js */
const { execFileSync } = require('node:child_process');
const { readdirSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

const root = resolve(__dirname, '..');
const views = join(root, 'views');

const out = {};
for (const name of readdirSync(views)) {
  if (!name.endsWith('.html')) continue;
  const file = `views/${name}`;
  let time = '';
  try {
    time = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], { cwd: root }).toString().trim();
  } catch { /* 无提交记录时跳过该页 */ }
  if (time) out[file] = time;
}

writeFileSync(join(root, 'updates.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`updates.json 已生成：${Object.keys(out).length} 个页面`);
