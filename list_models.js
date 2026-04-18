require("dotenv").config();

const fs = require('fs');
async function run() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const text = await res.text();
    fs.writeFileSync('models.json', text);
  } catch(e) {
    console.error(e);
  }
}
run();
