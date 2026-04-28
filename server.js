import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import speechRoutes from "./src/modules/speech/speech.routes.js";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/speech", speechRoutes);

const PORT = 3001;
const DB_FILE = path.join(__dirname, "meetings.json");

// Init DB
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 UPDATED SUMMARIZE / RESPONSE API
app.post("/api/summarize", async (req, res) => {
  try {
    const { transcript, mode } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    // 🔥 Dynamic instruction based on mode
    let instruction = "";

    if (mode === "short") {
      instruction = "Give a very short and clear answer in 1-2 lines.";
    } else if (mode === "bullet") {
      instruction = "Answer in clear bullet points.";
    } else {
      instruction = "Give a detailed explanation.";
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a real-time AI assistant. Answer clearly and directly. Do not act like a meeting summarizer unless explicitly asked.",
        },
        {
          role: "user",
          content: `${instruction}\n\nUser said: ${transcript}`,
        },
      ],
    });

    const answer = response.choices[0].message.content;

    res.json({ result: answer });

  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: "Failed to generate response." });
  }
});

// GET meetings
app.get("/api/meetings", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    res.json(data.reverse());
  } catch {
    res.status(500).json({ error: "Failed to read meetings." });
  }
});

// POST meetings
app.post("/api/meetings", (req, res) => {
  try {
    const { title, date, transcript, summary } = req.body;

    const newMeeting = {
      id: Date.now().toString(),
      title: title || "Meeting " + new Date().toLocaleDateString(),
      date: date || new Date().toISOString(),
      transcript,
      summary,
    };

    const meetings = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    meetings.push(newMeeting);
    fs.writeFileSync(DB_FILE, JSON.stringify(meetings, null, 2));

    res.status(201).json(newMeeting);
  } catch {
    res.status(500).json({ error: "Failed to save meeting." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});