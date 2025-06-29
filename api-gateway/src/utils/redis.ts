import Redis from "ioredis";

const redisClient = new Redis({
    host: "localhost",
    port: 6379,
});

redisClient.on("connect", () => console.log("redis client connected"));
redisClient.on("error", (err) => console.error("redis error", err));

export default redisClient;
