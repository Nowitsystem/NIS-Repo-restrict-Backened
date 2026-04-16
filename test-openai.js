import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const main = async () => {
  try {
    console.log("Testing OpenAI API with gpt-4o...");
    
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Write a one-sentence bedtime story about a unicorn."
        }
      ]
    });

    console.log("✅ API Response:");
    console.log(response.choices[0].message.content);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
};

main();
