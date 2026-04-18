const fetch = require("node-fetch");

const FALLBACK_IMAGES = {
  nature: [
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop"
  ],
  beach: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?q=80&w=1200&auto=format&fit=crop"
  ],
  city: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1200&auto=format&fit=crop"
  ],
  food: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1476224484781-aec29a1c28bc?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=1200&auto=format&fit=crop"
  ],
  adventure: [
    "https://images.unsplash.com/photo-1533240332313-0db36245e4a2?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500673922987-e212871fec22?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1200&auto=format&fit=crop"
  ],
  default: [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop"
  ]
};

async function getUnsplashImage(query) {
  try {
    const key = process.env.PIXABAY_API_KEY;
    if (!key) throw new Error("Missing PIXABAY_API_KEY");

    // Pixabay API URL - Increased per_page to 20 for better variety
    const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=20&safesearch=true`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        console.error(`Pixabay API Error: ${response.status} ${response.statusText}`);
        return getThemedFallback(query);
    }

    const data = await response.json();
    
    // Pixabay returns results in 'hits' array
    if (data.hits && data.hits.length > 0) {
        // Pick a random image from the top hits to ensure variety
        const randomIndex = Math.floor(Math.random() * data.hits.length);
        const imageUrl = data.hits[randomIndex].largeImageURL || data.hits[randomIndex].webformatURL;
        
        // Proxy through our backend to evade hotlinking restrictions that cause the browser to fail loading it
        return `/user/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    }

    // No results? Try themed fallback
    return getThemedFallback(query);
  } catch (err) {
    console.error("Image fetch error (Pixabay):", err.message);
    return getThemedFallback(query);
  }
}

function getThemedFallback(query) {
  const lowQuery = query.toLowerCase();
  let pool = FALLBACK_IMAGES.default;

  if (lowQuery.includes("food") || lowQuery.includes("dish") || lowQuery.includes("eat") || lowQuery.includes("restaurant")) {
    pool = FALLBACK_IMAGES.food;
  } else if (lowQuery.includes("beach") || lowQuery.includes("sea") || lowQuery.includes("water") || lowQuery.includes("ocean")) {
    pool = FALLBACK_IMAGES.beach;
  } else if (lowQuery.includes("city") || lowQuery.includes("building") || lowQuery.includes("street") || lowQuery.includes("town")) {
    pool = FALLBACK_IMAGES.city;
  } else if (lowQuery.includes("trek") || lowQuery.includes("hike") || lowQuery.includes("mountain") || lowQuery.includes("adventure") || lowQuery.includes("trail")) {
    pool = FALLBACK_IMAGES.adventure;
  } else if (lowQuery.includes("nature") || lowQuery.includes("park") || lowQuery.includes("forest") || lowQuery.includes("green") || lowQuery.includes("tree")) {
    pool = FALLBACK_IMAGES.nature;
  }
  
  // Pick random from selected pool
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = getUnsplashImage;
