import { Worker } from "bullmq";
import IORedis from "ioredis";
import { expireOrders, renderOrderItem, scheduleExpiry } from "@tshirt/production";

const url = process.env.REDIS_URL;
if (!url) throw new Error("REDIS_URL 未配置");

const connection = new IORedis(url, { maxRetriesPerRequest: null });

const worker = new Worker(
  "production",
  async (job) => {
    if (job.name === "render") await renderOrderItem(job.data.orderItemId as string);
    if (job.name === "expire") await expireOrders();
  },
  { connection, concurrency: 2 },
);

worker.on("failed", (job, error) => {
  console.error("job failed", job?.id, error.message);
});

await scheduleExpiry();
console.log("production worker started");
