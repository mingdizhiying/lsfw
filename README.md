# 岚山飞文

一个偏向个人生活记录的网站，以米白、低饱和配色和手账风格，收纳照片、文字、诗歌、项目，以及喜欢的番剧、游戏、音乐与美食。

项目基于 Cloudflare Workers、D1 和 R2 构建，提供独立管理后台，支持手机端编辑与日常维护。

网站：[lsfw.top](https://lsfw.top/)  
仓库：[mingdizhiying/lsfw](https://github.com/mingdizhiying/lsfw)

## 当前功能

| 模块 | 功能 |
|---|---|
| 首页 | 个人介绍、照片与文章、诗集与单诗、在看番剧、游戏、音乐及生活打卡入口；支持后台修改首页文案 |
| 博客与说说 | 富文本编辑，支持粘贴及导入 DOCX、HTML、TXT；说说标题可留空；博客可设置独立访问密码 |
| 相册 | 按旅行、日期或主题整理照片；横竖图适配、点击放大、照片备注、独立评论；同一照片可被多个相册引用 |
| 诗集 | 按诗集和单首诗浏览；支持封面、配图、日期与排序；诗集封面可直接选择相册照片 |
| 项目 | 以时间线记录进展，自动识别节点日期；后台设置正序或倒序，前台按选定方向展示 |
| 番剧 | 读取 Bangumi 公开资料、在看、看过海报墙及时间轴；通过年度目录生成看番年表 |
| 游戏橱窗 | Bangumi 搜索导入资料、Steam 游玩时长同步、推荐短评及置顶；点击封面翻转查看短评 |
| 音乐 | 网易云分享链接识别、黑胶唱片展示、标签筛选与置顶；可用音源播放时唱片旋转 |
| 美食 | 按省份、城市分类，记录名称、地址、日期、感受及 0–5 分评分 |
| 收藏夹 | 收藏网站、视频等资料，支持分类、搜索、短评与封面预览 |
| 生活打卡 | 每月圆盘热力图、按年浏览、自定义活动与私人活动；支持补打卡，每项每天只能点亮一次 |
| 评论与留言 | 昵称必填、邮箱选填，审核后公开；支持独立留言板与管理员回复 |
| 管理与备份 | 内容管理、统一粘贴识别、R2 用量查看、JSON 内容导出、GitHub 发布记录同步 |

后台将常用创建操作集中在“新建”菜单。诗集与其他内容统一进入“内容管理”，单首诗在所属诗集内部管理。导航位于左侧时子菜单向右展开，位于顶部时向下展开。

## 技术组成

- **前端**：原生 JavaScript、HTML、CSS。
- **后端**：Hono + Cloudflare Workers。
- **数据库**：Cloudflare D1。
- **图片存储**：Cloudflare R2，由网站接口检查访问权限。
- **开发与发布**：Node.js、Wrangler、GitHub Actions。
- **内容处理**：DOMPurify、sanitize-html、Mammoth。

## 部署

以下步骤用于新部署。维护现有站点时，请保留已有配置和数据库。

### 1. 准备环境

需要 Node.js 22 或更新版本，以及已开通 Workers、D1、R2 的 Cloudflare 账号。

```bash
git clone https://github.com/mingdizhiying/lsfw.git
cd lsfw
npm ci
npx wrangler login
```

### 2. 创建资源并填写配置

```bash
npx wrangler d1 create lsfw-content
npx wrangler r2 bucket create lsfw-media
```

复制 `wrangler.example.jsonc` 为 `wrangler.jsonc`，填写自己的配置：

| 配置 | 用途 |
|---|---|
| `account_id` | Cloudflare 账号 ID |
| `d1_databases[].database_id` | 创建 D1 后返回的数据库 ID |
| `r2_buckets[].bucket_name` | 图片存储桶名称 |
| `SITE_ORIGIN` | 网站实际访问地址 |
| `ADMIN_EMAIL` | 管理员登录邮箱 |
| `BANGUMI_USER` | Bangumi 用户名或用户 ID |

绑定名称保持为 `DB`、`MEDIA` 和 `ASSETS`。R2 桶保持私有，由网站控制图片访问。

**当前项目仍包含原站点的个性化配置**，例如 Steam 账号、发布记录仓库地址、预置 Bangumi 目录及部分文案。部署为自己的站点前，应检查并替换这些内容，不能只修改域名。

### 3. 初始化数据库与管理员密钥

```bash
npx wrangler d1 migrations apply lsfw-content --remote
node setup-secret.mjs
```

初始化脚本会生成或复用 `private/setup-token.txt`，并将其写入 Worker 的 `SETUP_TOKEN` secret。

### 4. 检查并发布

```bash
npm run check
npm test
npm run deploy
```

在 Cloudflare 控制台为 Worker 绑定域名，并确保 `SITE_ORIGIN` 与实际地址一致。

打开 `/admin`，使用初始化密钥设置管理密码。初始化完成后，使用配置的管理员邮箱和密码登录。

### 5. 本地开发

配置本地所需变量后执行：

```bash
npx wrangler d1 migrations apply lsfw-content --local
npm run dev
```

默认开发地址为 `http://localhost:8787`。本地数据库与线上数据库分别管理，不要将本地测试数据覆盖到生产环境。

## 可选服务

- **邮件回复通知**：配置 `RESEND_API_KEY` 和已验证的 `MAIL_FROM`。未配置时，网站上的回复仍可使用。
- **Steam 游玩时长**：配置 Steam Web API Key，并确保相关游戏资料可读取。
- **R2 请求统计**：需要额外统计授权；存储费展示仅作参考，实际费用以 Cloudflare 账单为准。

密钥使用 Cloudflare secrets 或项目已有的后台配置入口保存，不写入前端文件和 GitHub。

## 日常维护

建议按以下流程更新：

1. 修改源码，运行 `npm run check` 和 `npm test`。
2. 如涉及数据库变更，先备份，再应用迁移。
3. 发布后检查关键页面、登录、上传与保存功能。
4. 在 `RELEASES.md` 记录变更、验证结果、版本标签和 Worker 版本 ID。
5. 提交并推送 GitHub，保留可恢复的版本标签。

GitHub Actions 会执行检查、测试和部署构建验证，**不会自动发布到生产站点**。

网站“版本记录”项目会自动读取 GitHub 上的 `RELEASES.md`；这一同步仅更新展示内容，不会自动部署代码。

## 备份与回滚

后台“账户与备份”可以导出内容数据。图片文件需另外备份，JSON 导出不包含 R2 中的图片二进制文件。

也可导出 D1：

```bash
npx wrangler d1 export lsfw-content --remote --output private/database.sql
```

查看部署版本并回滚：

```bash
npm run versions
npm run rollback -- <Worker版本ID> <回滚原因>
```

回滚前须确认旧代码与当前数据库结构兼容。**代码回滚不会恢复数据库内容，也不会恢复已永久删除的照片。**

更多说明见 [ROLLBACK.md](ROLLBACK.md)，历史变更见 [RELEASES.md](RELEASES.md)。

## 使用说明与限制

- 博客密码属于服务端访问保护，并非端到端加密。
- 图片上传会压缩处理，请另行保存原始照片。
- “移出相册”只解除关联，原图仍占用存储；“彻底删除原图”会影响所有引用位置。
- 私人相册照片被选为公开诗集封面后，该封面图片会公开展示。
- 网易云播放受音源、版权、地区和账号权限影响，不能保证每首歌曲都能站内播放。
- 网站及视频预览可能受到反爬、登录或动态渲染限制；识别失败不代表链接失效。
- 备份可能包含私人正文和访客邮箱，应妥善保存，不提交到公开仓库。
- 不要提交 `wrangler.jsonc`、`.dev.vars`、`private/`、数据库文件或用户照片。
