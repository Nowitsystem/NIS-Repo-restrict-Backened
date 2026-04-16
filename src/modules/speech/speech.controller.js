import { transcribeAudio } from "./speech.service.js";
import fs from "fs";

export const transcribe = async (req, res) => {
  try {
    console.log("File received:", req.file);

    const text = await transcribeAudio(req.file.path);

    // optional cleanup - only delete if file exists
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({ text }); // ✅ important
  } catch (err) {
    console.error("Controller ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};