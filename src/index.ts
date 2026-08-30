import "dotenv/config";
import { connectRedis } from "./redis";

async function main() {
  await connectRedis();

  const { createApp } = await import("./app");
  const app = createApp();

  app.listen(3000, () => {
    console.log("Listening on port 3000");
  });
}

main();
