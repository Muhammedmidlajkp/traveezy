require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  try {
    console.log("🔄 Testing Groq API...");
    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Return ONLY a valid JSON object with key 'spots' — array of 2 tourist attractions with name and description." },
        { role: "user", content: "List 2 top tourist spots in Kerala, India." }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = result.choices[0].message.content;
    const parsed = JSON.parse(raw);
    console.log("✅ Groq API is WORKING!\n");
    console.log(JSON.stringify(parsed, null, 2));
  } catch (err) {
    console.error("❌ Groq API FAILED:", err.message);
  }
}

test();
