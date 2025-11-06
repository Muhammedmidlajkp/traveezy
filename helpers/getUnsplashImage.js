const fetch = require("node-fetch");

async function getUnsplashImage(query) {
  try {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (!key) throw new Error("Missing UNSPLASH_ACCESS_KEY in .env");

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${key}`;
    const response = await fetch(url);
    const data = await response.json();

    // return first image
    return data.results?.[0]?.urls?.regular || null;
  } catch (err) {
    console.error("Unsplash error:", err.message);
    return null;
  }
}

module.exports = getUnsplashImage;
