# 印坊

T 恤定制 SaaS 的 MVP。一个 Next.js 应用包含店铺、商家后台和平台开通，Worker 负责生产图和超时关单。

## 本地运行

```bash
cd tshirt-saas
cp .env.example .env
cp .env apps/web/.env
cp .env packages/db/.env
cp .env apps/worker/.env
pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

店铺：http://localhost:3000/s/demo  
商家：http://localhost:3000/admin/login ，手机号 13800000001  
平台：http://localhost:3000/platform/login ，手机号 13800000000  
开发验证码：000000

`pnpm db:seed` 还会导入两家演示店铺「示例工作室」（`/s/demo`）和「南风印社」（`/s/nanfeng`），每家含 6 个商品、10 个印花素材及商品图片。南风印社的示例店主手机号为 `13700000011`。

完整示例目录保存在 `packages/db/prisma/demo-catalog`，不含客户、订单或用户上传文件。同名商品和素材已存在时会跳过；每次运行都会恢复随包提供的图片文件。因此 Render 免费实例应在启动命令中保留 `pnpm --filter @tshirt/db seed`，以便重新部署后恢复示例图片。实际经营中上传的图片仍需持久化存储。

生产图队列：

```bash
pnpm worker
```

没有 Redis 时，模拟支付会在 API 进程里直接渲染。

数据库端口是 54329，Redis 端口是 63799，避免和本机已有服务冲突。

## 界面组件

店铺前台与注册页面的基础组件位于 `apps/web/src/components/ui`，源码由项目自行维护，不依赖 shadcn CLI。交互组件继续使用 Base UI，样式使用 Tailwind CSS；组件所需的状态变体定义在 `apps/web/src/app/globals.css`。商家与平台后台继续使用 Ant Design。
