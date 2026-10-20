# 阿雪的工作台 · Vercel + Supabase 版

这是在原工作台界面基础上适配的标准 Next.js 项目。保留暖色风格、三级目录、事项编辑、联系人、大幅详情、818项婚事模板、相对婚期计划和备份。

当前仓库目标：`lix32102/AI-chatgpt`。沿用现有 Supabase 项目，不创建新项目。不会覆盖仓库现有 README.md。

## 当前状态

源码已适配。2026-10-19本地TypeScript检查、13项功能/权限检查、Next.js生产构建及本地生产服务器启动检查通过。尚未上传GitHub、尚未执行真实Supabase SQL、尚未上线；数据库真实权限、账号登录和跨设备分享将在配置后继续验收。

## 构建设置

- Framework Preset：Next.js
- Root Directory：`./`
- Node.js：22或更高（本地测试使用24）
- Install Command：自动识别 `pnpm-lock.yaml`，无需手工修改
- Build Command：`pnpm run build`
- Output Directory：保持 Next.js 默认

## 只需两个环境变量

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

变量实际值在 Vercel 的项目环境变量中填写，不写入 GitHub 文件。无需数据库密码、`service_role`或Secret key。`.env.example`只有示例配置和空密钥。

## 数据库及管理员（等待逐步指导后操作）

1. 在现有项目的SQL Editor执行`supabase/01-initialize.sql`。
2. 在Supabase Authentication → Users创建工作台邮箱/密码账号。这里的账号独立于你登录Supabase控制台的账号。
3. 使用`supabase/02-owner-template.sql`，替换其中邮箱后执行，将你指定的用户加入管理员名单。
4. 部署后在`/login`登录。只读查看者使用工作台生成的分享链接。

初始化脚本只创建以`axue_wb_`命名的工作台表和`axue_private`权限表；不删除旧表，不导入你的私人任务。脚本可重复执行，不重置已有任务或管理员。

## 本地数据迁移

在原本地工作台“导出备份”，随后登录在线工作台，点击“导入本地备份”。该操作替换云端任务，界面会要求确认。没有实际备份时才选择“载入婚事计划”，加入818项通用模板。

备份JSON中可能包含联系人和私人安排，不要上传到公开GitHub仓库。

## 分享与同步

你可以编辑，只有管理员可写入。查看链接包含256位随机令牌，数据库仅保存令牌摘要。链接可撤销；撤销后不再返回新的数据，但不能收回已下载的副本。打开的查看页面每15秒检查进度。

同一工作台在多个页面编辑时，版本号会阻止旧页面覆盖新版本。保存失败时请保留页面并导出备份，随后重试同步。

## 检查命令

```text
pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm run build
```

测试中的Supabase接口使用模拟响应，SQL需要在真实项目初始化后完成权限验收，不能把本地测试通过视为已经上线。
