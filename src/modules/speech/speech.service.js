import OpenAI from "openai";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "@ffmpeg-installer/ffmpeg";
import ffprobeStatic from "ffprobe-static";
import dotenv from "dotenv";

dotenv.config();

// Set ffmpeg and ffprobe paths for fluent-ffmpeg
ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supported audio formats by OpenAI Whisper
const SUPPORTED_FORMATS = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];

const convertAudioToSupportedFormat = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav') // Convert to WAV (always supported)
      .audioCodec('pcm_s16le')
      .audioChannels(1) // Mono
      .audioFrequency(16000) // 16kHz (optimal for Whisper)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
};

const getFileExtension = (filePath) => {
  return path.extname(filePath).toLowerCase().replace('.', '');
};

const isSupportedFormat = (filePath) => {
  const ext = getFileExtension(filePath);
  return SUPPORTED_FORMATS.includes(ext);
};

export const transcribeAudio = async (filePath) => {
  try {
    console.log("Reading file:", filePath);

    let audioFilePath = filePath;

    // Check if file format is supported
    if (!isSupportedFormat(filePath)) {
      console.log("File format not supported, converting to WAV...");
      const convertedPath = filePath + '_converted.wav';
      await convertAudioToSupportedFormat(filePath, convertedPath);
      audioFilePath = convertedPath;

      // Clean up original file after conversion
      fs.unlinkSync(filePath);
    }

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
    });

    console.log("OpenAI response received ✅");
    console.log("Text:", response.text);

    // Clean up converted file if it was created
    if (audioFilePath !== filePath) {
      fs.unlinkSync(audioFilePath);
    }

    return response.text || "";
  } catch (err) {
    console.error("OpenAI ERROR:", err);

    // Clean up any temporary files on error
    try {
      if (fs.existsSync(filePath + '_converted.wav')) {
        fs.unlinkSync(filePath + '_converted.wav');
      }
    } catch (cleanupErr) {
      console.error("Cleanup error:", cleanupErr);
    }

    return "";
  }
};