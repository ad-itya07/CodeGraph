import redis from "@/lib/redis.js";

class CacheService {

    async get(key: string): Promise<string | null> {
        try {
            return await redis.get(key);
        } catch (err) {
            console.error(`Redis GET failed for key "${key}":`, err);
            return null;
        }
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        try {
            if (ttlSeconds !== undefined) {
                await redis.set(key, value, { EX: ttlSeconds });
                return;
            }

            await redis.set(key, value);
        } catch (err) {
            console.error(`Redis SET failed for key "${key}":`, err);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await redis.del(key);
        } catch (err) {
            console.error(`Redis DELETE failed for key "${key}":`, err);
        }
    }
}

export default new CacheService();