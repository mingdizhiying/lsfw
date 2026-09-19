# 版本更新与回滚

## 日常更新
1. 在修改前创建分支；仅提交源码、迁移与文档，不提交密钥、数据库、用户照片或备份。
2. 运行 `npm ci`、`npm run check`、`npm test`，在本地测试功能。
3. 提交并推送 GitHub，检查 Check website 成功。合并后创建唯一版本标签，如 v1.0.1；不要移动已有标签。
4. 数据库需要升级时，先导出到本地 private 目录：`npx wrangler d1 export lsfw-content --remote --output private/pre-release.sql`。备份包含私人内容，不上传 GitHub。
5. 仅应用向后兼容的新增字段/表迁移；破坏性变更需独立制定恢复方案。运行 `npx wrangler d1 migrations apply lsfw-content --remote`。
6. 使用本机已有 Cloudflare 登录，运行 `npm run deploy -- --message <Git提交SHA>`。这样不必给 GitHub 新增生产凭据。
7. 检查线上页面和接口，将 Worker 版本 ID 与 Git 提交写入 RELEASES.md 并推送。

## 紧急代码回滚
先用 `npm run versions` 查看版本，确认旧代码与现有数据库、绑定兼容。
运行 `npm run rollback -- <Worker版本ID> <回滚原因>`，按 Wrangler 提示确认。
命令只切换代码和静态资源，不回滚数据库内容或 R2 文件。然后检查首页、登录、相册、诗集及美食页面。
不要为了测试而把线上切回存在已知问题的版本。

## 从 GitHub 恢复代码
若 Cloudflare 版本无法使用：从已验证标签创建独立工作目录（`git worktree add ../lsfw-restore v1.0.0`），将本机未跟踪的 wrangler.jsonc 安全复制到该目录（不要提交），在其中 npm ci、检查、测试，再运行 npm run deploy。不要强推或重写 main 历史。恢复后将修复通过普通提交同步回 main，避免下一次发布重新带入问题。

## 数据恢复边界
GitHub 保存代码，不保存后台文章、评论、打卡、照片。代码回滚不会恢复已永久删除的 R2 图片；D1 恢复需另行确认恢复点与期间新增内容，不能自动覆盖。保留本地私密 D1 导出和照片原图备份。

官方说明：https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/
