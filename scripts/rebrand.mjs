#!/usr/bin/env node
// @ts-check
/**
 * 神农信息系统 · 品牌重命名脚本
 *
 * 用途：
 *   1. 首次从 vue-vben-admin fork 后，一次性把所有 vben 标识符替换为 shennong。
 *   2. 未来从上游同步代码时，跑一次此脚本即可把上游新增的 vben 字样统一改名。
 *
 * 设计原则：
 *   - 纯 Node ESM，零依赖（在 pnpm install 之前也能跑）。
 *   - 只动 "标识符 / 包名 / 常量名"，不动业务文本（README / docs / LICENSE）。
 *   - 替换矩阵长串先于短串，避免二次替换。
 *   - 黑名单目录与二进制文件全部跳过。
 *
 * 用法：
 *   node scripts/rebrand.mjs            # 执行替换
 *   node scripts/rebrand.mjs --dry-run  # 仅打印将要替换的文件，不写入
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');

// ───────────────────── 替换矩阵（顺序敏感：长串先） ─────────────────────
const REPLACEMENTS = [
  // 编译时全局常量
  ['__VBEN_ADMIN_METADATA__', '__SHENNONG_ADMIN_METADATA__'],
  ['_VBEN_ADMIN_PRO_APP_CONF_', '_SHENNONG_ADMIN_PRO_APP_CONF_'],
  ['VBEN_ADMIN_PRO_APP_CONF', 'SHENNONG_ADMIN_PRO_APP_CONF'],
  ['VbenAdminProAppConfigRaw', 'ShennongAdminProAppConfigRaw'],

  // constants 包导出的 VBEN_* 常量名（仅前缀，避免误伤业务字符串）
  ['VBEN_DOC_URL', 'SHENNONG_DOC_URL'],
  ['VBEN_GITHUB_URL', 'SHENNONG_GITHUB_URL'],
  ['VBEN_LOGO_URL', 'SHENNONG_LOGO_URL'],
  ['VBEN_ANT_PREVIEW_URL', 'SHENNONG_ANT_PREVIEW_URL'],
  ['VBEN_ANTDV_NEXT_PREVIEW_URL', 'SHENNONG_ANTDV_NEXT_PREVIEW_URL'],
  ['VBEN_ELE_PREVIEW_URL', 'SHENNONG_ELE_PREVIEW_URL'],
  ['VBEN_NAIVE_PREVIEW_URL', 'SHENNONG_NAIVE_PREVIEW_URL'],
  ['VBEN_TDESIGN_PREVIEW_URL', 'SHENNONG_TDESIGN_PREVIEW_URL'],
  ['VBEN_TD_PREVIEW_URL', 'SHENNONG_TD_PREVIEW_URL'],
  ['VBEN_PREVIEW_URL', 'SHENNONG_PREVIEW_URL'],
  ['Vben Logo', 'Shennong Logo'],

  // npm workspace scope（@vben-core/ 必须在 @vben/ 之前替换）
  ['@vben-core/', '@shennong-core/'],
  ['@vben/', '@shennong/'],

  // DOM 元素 ID & CSS 变量前缀
  ['__vben_main_content', '__shennong_main_content'],
  ['--vben-', '--shennong-'],

  // 根 package.json name
  ['vben-admin-monorepo', 'shennong-frame-monorepo'],

  // 应用级标识（VITE_APP_TITLE / VITE_APP_NAMESPACE / HTML meta）
  ['Vben Admin', 'Shennong Admin'],
  ['vben-web-antdv-next', 'shennong-web-antdv-next'],
  ['vben-web-antd', 'shennong-web-antd'],
  ['vben-web-ele', 'shennong-web-ele'],
  ['vben-web-naive', 'shennong-web-naive'],
  ['vben-web-tdesign', 'shennong-web-tdesign'],
  ['vben-playground', 'shennong-playground'],
  ['vben-backend-mock', 'shennong-backend-mock'],
  ['vben-docs', 'shennong-docs'],

  // .vscode/launch.json 调试配置
  ['vben admin playground dev', 'shennong admin playground dev'],
  ['vben admin antd dev', 'shennong admin antd dev'],
  ['vben admin ele dev', 'shennong admin ele dev'],
  ['vben admin naive dev', 'shennong admin naive dev'],

  // changeset 默认仓库（清空，等用户填）
  ['{ "repo": "vbenjs/vue-vben-admin" }', '{ "repo": "" }'],

  // package.json 元数据（清空 URL，author 改名）
  ['"homepage": "https://vben.pro"', '"homepage": ""'],
  ['"homepage": "https://github.com/vbenjs/vue-vben-admin"', '"homepage": ""'],
  ['"bugs": "https://github.com/vbenjs/vue-vben-admin/issues"', '"bugs": ""'],
  ['"url": "git+https://github.com/vbenjs/vue-vben-admin.git"', '"url": ""'],
  ['"name": "vben"', '"name": "shennong"'],
  ['ann.vben@gmail.com', ''],

  // HTML meta author
  ['<meta name="author" content="Vben" />', '<meta name="author" content="Shennong" />'],

  // license banner（vite 构建插件）
  ['Author: vben', 'Author: shennong'],
  ['Copyright (C) 2024 Vben', 'Copyright (C) 2024 Shennong'],
  ['Contact: ', 'Contact: '],

  // PascalCase 标识符兜底：所有 VbenXxx 类型/组件/函数名（Vue Devtools 可见）
  // 一条规则覆盖：VbenForm/VbenModal/VbenInput/VbenLayout/VbenViteConfig/...
  // 注意：必须在所有具名规则之后，且 'Vben' 不能再细分（无歧义）
  ['Vben', 'Shennong'],

  // docker 镜像名
  ['vben-admin-local', 'shennong-frame-local'],
  ['vben-admin-pro', 'shennong-frame-pro'],

  // vsh 脚本中硬编码的工作区文件名
  ["join('vben-admin.code-workspace')", "join('shennong-frame.code-workspace')"],

  // CSS BEM 类名前缀（DEFAULT_NAMESPACE 派生）
  // 必须改：DEFAULT_NAMESPACE 已改成 'shennong'，模板中硬编码的 vben- 类前缀
  // 与 CSS 选择器 .vben-xxx 不会被替换会导致样式不匹配，UI 崩溃。
  // 4 个前缀覆盖：CSS 选择器 / 双引号 class / 单引号 class / 模板字符串
  ['.vben-', '.shennong-'],
  ['"vben-', '"shennong-'],
  ["'vben-", "'shennong-"],
  ['`vben-', '`shennong-'],
  // 空格分隔（CSS 动画名 / 多 class 列表中第二个 class）
  [' vben-', ' shennong-'],

  // SCSS BEM 命名空间声明（每个 .vue / .scss 文件可能本地覆盖默认值）
  // 必须改：与 TS 的 DEFAULT_NAMESPACE 同源；299+ 文件本地声明覆盖了 design 包默认值。
  // 三种引号变体全覆盖：
  ['$namespace: vben;', '$namespace: shennong;'],
  ["$namespace: 'vben'", "$namespace: 'shennong'"],
  ['$namespace: "vben"', '$namespace: "shennong"'],
];

// ───────────────────── 黑名单：跳过的目录 ─────────────────────
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '.turbo',
  'dist',
  'dist.prod',
  '.husky',
  '.cache',
  'coverage',
]);

// ───────────────────── 黑名单：跳过的文件（按文件名） ─────────────────────
const SKIP_FILES = new Set([
  'pnpm-lock.yaml', // 重新生成
  'LICENSE',         // 保留上游 MIT
  'README.md',       // 后续手工重写
  'README.zh-CN.md',
  'README.ja-JP.md',
  'rebrand.mjs',     // 不替换自己
  'MIGRATION.md',    // 维护手册中含 rebrand 映射示例文字，会被规则误伤
  'tea.yaml',        // tea.xyz 元数据，与品牌无关
]);

// ───────────────────── 黑名单：二进制扩展名 ─────────────────────
const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp4', '.webm', '.mp3', '.wav',
  '.zip', '.tar', '.gz', '.7z',
  '.pdf', '.exe',
]);

// ───────────────────── 工具 ─────────────────────
let totalFilesChanged = 0;
let totalReplacements = 0;
const changedFilesLog = [];

function isBinary(filePath) {
  return BINARY_EXT.has(path.extname(filePath).toLowerCase());
}

function processFile(filePath) {
  const name = path.basename(filePath);
  if (SKIP_FILES.has(name)) return;
  if (isBinary(filePath)) return;

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return; // 不可读文件跳过
  }

  // 快速过滤：不含 vben/VBEN/Vben 直接跳
  if (!/vben/i.test(content)) return;

  let result = content;
  let fileCount = 0;
  for (const [from, to] of REPLACEMENTS) {
    const occurrences = result.split(from).length - 1;
    if (occurrences > 0) {
      result = result.split(from).join(to);
      fileCount += occurrences;
    }
  }

  if (fileCount === 0) return;

  totalFilesChanged += 1;
  totalReplacements += fileCount;
  changedFilesLog.push({ file: path.relative(ROOT, filePath), count: fileCount });

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, result, 'utf8');
  }
}

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full);
    } else if (entry.isFile()) {
      processFile(full);
    }
  }
}

// ───────────────────── 文件改名 ─────────────────────
function renameWorkspaceFile() {
  const oldPath = path.join(ROOT, 'vben-admin.code-workspace');
  const newPath = path.join(ROOT, 'shennong-frame.code-workspace');
  if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
    if (!DRY_RUN) fs.renameSync(oldPath, newPath);
    console.log(`  [改名] vben-admin.code-workspace → shennong-frame.code-workspace`);
  }
}

// ───────────────────── 条件删除 lock 文件 ─────────────────────
// 仅当 lock 文件本身含 vben 字样（说明里面有旧 scope 引用）才删除。
// 首次 fork 后跑脚本会触发删除；之后再跑（lock 已 install 重生成）不会动。
function removeLockFileIfStale() {
  const lockPath = path.join(ROOT, 'pnpm-lock.yaml');
  if (!fs.existsSync(lockPath)) return;
  let content;
  try {
    content = fs.readFileSync(lockPath, 'utf8');
  } catch {
    return;
  }
  if (!/@vben(-core)?\//.test(content)) return; // lock 已干净，不动
  if (!DRY_RUN) fs.unlinkSync(lockPath);
  console.log(`  [删除] pnpm-lock.yaml （含旧 scope 引用，需重新 install 生成）`);
}

// ───────────────────── 主流程 ─────────────────────
console.log('━'.repeat(60));
console.log(`神农信息系统 · 品牌重命名${DRY_RUN ? '（试运行）' : ''}`);
console.log(`仓库根：${ROOT}`);
console.log('━'.repeat(60));

walk(ROOT);
renameWorkspaceFile();
removeLockFileIfStale();

console.log('');
console.log('━'.repeat(60));
console.log(`变更文件数：${totalFilesChanged}`);
console.log(`总替换次数：${totalReplacements}`);
console.log('━'.repeat(60));
if (changedFilesLog.length > 0 && changedFilesLog.length <= 80) {
  for (const { file, count } of changedFilesLog) {
    console.log(`  ${count.toString().padStart(4)}  ${file}`);
  }
} else if (changedFilesLog.length > 80) {
  console.log(`  （共 ${changedFilesLog.length} 个文件，仅显示前 80 个）`);
  for (const { file, count } of changedFilesLog.slice(0, 80)) {
    console.log(`  ${count.toString().padStart(4)}  ${file}`);
  }
}
console.log('');
if (DRY_RUN) {
  console.log('试运行完成，未写入磁盘。去掉 --dry-run 正式执行。');
} else {
  console.log('完成。');
}
