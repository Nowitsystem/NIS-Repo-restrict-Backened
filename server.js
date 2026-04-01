const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const DB_FILE = path.join(__dirname, 'meetings.json');

// Initialize local JSON DB
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// OpenAI specific setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST /api/summarize - Summarizes the transcript
app.post('/api/summarize', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI meeting assistant. Given a meeting transcript, generate 4 sections:\n1. Key points\n2. Summary\n3. Action items\n4. Important decisions\nKeep it concise and format as Markdown."
        },
        {
          role: "user",
          content: transcript
        }
      ]
    });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

// GET /api/meetings - Get all past meetings
app.get('/api/meetings', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    // Return latest first
    res.json(data.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to read meetings.' });
  }
});

// POST /api/meetings - Save a meeting
app.post('/api/meetings', (req, res) => {
  try {
    const { title, date, transcript, summary } = req.body;
    const newMeeting = {
      id: Date.now().toString(),
      title: title || 'Meeting ' + new Date().toLocaleDateString(),
      date: date || new Date().toISOString(),
      transcript,
      summary
    };

    const meetings = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    meetings.push(newMeeting);
    fs.writeFileSync(DB_FILE, JSON.stringify(meetings, null, 2));

    res.status(201).json(newMeeting);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save meeting.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
