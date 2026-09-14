import app from "./app.js";
import redis from "./lib/redis.js";

const PORT = process.env.PORT || 3000;

redis
  .connect()
  .then(() => {
    console.log("Redis connected successfully");
  })
  .catch((err) => {
    console.error("Redis unavailable:", err);
  });

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});