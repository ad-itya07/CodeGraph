import { createClient } from "redis";
import { config } from "@/config/env.js";

const redis = createClient({
    url: config.redisUrl,
    disableOfflineQueue: true,

    socket: {
        reconnectStrategy: (retries) => {
            const delay = Math.min(retries * 500, 5000);

            console.log(
                `Redis reconnecting in ${delay}ms (attempt ${retries})`
            );

            return delay;
        },
    },
});

redis.on("error", (err) => {
    console.error("Redis Client Error:", err);
});

export default redis;