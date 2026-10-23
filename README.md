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

生产图队列：

```bash
pnpm worker
```

没有 Redis 时，模拟支付会在 API 进程里直接渲染。

数据库端口是 54329，Redis 端口是 63799，避免和本机已有服务冲突。
