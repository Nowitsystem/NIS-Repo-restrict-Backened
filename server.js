import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import speechRoutes from "./src/modules/speech/speech.routes.js";
import { fileURLToPath } from "url";
dotenv.config();
console.log("API KEY:", process.env.OPENAI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Fix __dirname (ESM doesn't support it directly)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/speech", speechRoutes);

const PORT = 3001;
const DB_FILE = path.join(__dirname, "meetings.json");

// Initialize local JSON DB
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Updated model (important)
app.post("/api/summarize", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 🔥 updated
      messages: [
        {
          role: "system",
          content:
            "You are an AI meeting assistant. Generate:\n1. Key points\n2. Summary\n3. Action items\n4. Important decisions\nKeep concise, Markdown format.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: "Failed to generate summary." });
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