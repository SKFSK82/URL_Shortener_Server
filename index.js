const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
const cors = require("cors");
// const redis = require("redis");

const app = express();
const PORT = process.env.PORT || 7081;
const MONGO_URI = "mongodb://localhost:27017/urlshortener";

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Redis client
// let redisClient = redis.createClient();

// redisClient.on("error", (err) => {
//   console.error("Redis error:", err);
//   // Attempt to reconnect on error
// });

// redisClient.on("connect", () => {
//   console.log("Redis Client Connected");
// });

// redisClient.on("ready", () => {
//   console.log("Redis Client Ready");
// });

// URL schema and model
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
});

const URL = mongoose.model("URL", urlSchema);

app.use(cors());
app.use(express.json());

// Function to generate short URL
const generateShortUrl = async (originalUrl) => {
  const shortUrl = shortid.generate();
  const newUrl = new URL({ originalUrl, shortUrl });
  await newUrl.save();
  return shortUrl;
};

// Endpoint to shorten URL
app.post("/generate-url", async (req, res) => {
  const { originalUrl } = req.body;
  if (!originalUrl) {
    return res.status(400).json({ message: "Original URL is required" });
  }

  try {
    const shortUrl = await generateShortUrl(originalUrl);
    res.json({ originalUrl, shortUrl });
  } catch (err) {
    console.error("Error generating short URL:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint to redirect to original URL
app.get("/shortUrl/:shortUrl", async (req, res) => {
  try {
    const { shortUrl } = req.params;

    // Check Redis cache first
    // redisClient.get(shortUrl, async (err, cachedUrl) => {
    //   if (err) throw err;

    //   if (cachedUrl) {
    //     return res.json({ originalUrl: cachedUrl });
    //   } else {
    const urlDoc = await URL.findOne({ shortUrl });
    if (urlDoc) {
      // Cache the result in Redis

      return res.json({ originalUrl: urlDoc.originalUrl });
    } else {
      return res.status(404).json({ message: "URL not found" });
    }
  } catch (err) {
    console.error("Error getting original URL:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
