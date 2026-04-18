const Groq = require("groq-sdk");
require("dotenv").config();
const User = require("../models/user");
const Place = require("../models/place");
const getUnsplashImage = require("../helpers/getUnsplashImage");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// In-memory cache for AI Trip Planner
const tripCache = new Map();

exports.aiTripPlannerPage = async (req, res) => {
  try {
    // =====================================================
    // 1️⃣ USER FETCH
    // =====================================================
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.render("user/Explore", {
        title: "AI Trip Planner - Not Found",
        error: "No user data found in the database.",
        places: [],
        user: null,
      });
    }

    // =====================================================
    // 2️⃣ READ FILTERS FROM QUERY (IMPORTANT)
    // =====================================================
    const { category, activity, time, distance } = req.query;

    // =====================================================
    // 3️⃣ ONBOARDING DATA
    // =====================================================
    const { location, travelStart, travelEnd, interests } = user.onboarding || {};

    let days = 3;
    if (travelStart && travelEnd) {
      const diff = Math.ceil(
        (new Date(travelEnd) - new Date(travelStart)) / (1000 * 60 * 60 * 24)
      );
      days = diff <= 0 ? 1 : diff;
    }

    const userIdStr = user._id.toString();
    const regenerate = req.query.regenerate === 'true';

    let baseNormalizedPlaces = [];
    let q = "";

    if (!regenerate && tripCache.has(userIdStr)) {
      const cached = tripCache.get(userIdStr);
      // ✅ Fix: Only use cache if location matches current onboarding location
      if (cached.location === (location || "Kerala")) {
        baseNormalizedPlaces = cached.normalizedPlaces;
      }
    }

    if (baseNormalizedPlaces.length === 0) {
      // =====================================================
      // 4️⃣ AI PROMPT
      // =====================================================
      q = `
You are a professional tour planner with over 40 years of experience in Indian tourism.
Plan a ${days}-day trip for ${user.name}, starting from ${location || "Kerala"}.

Rules:
- Only 5–6 major stops per day
- Nearby places first
- Realistic timing
- Meals + rest included
- Hidden gems & food spots
- Avoid places closing before 4 PM unless last stop
- End each day peacefully

Traveler interests: ${interests?.length ? interests.join(", ") : "nature, food, culture"}.

Return ONLY a realistic itinerary.
`;

      const systemPrompt = `
Return ONLY JSON:
{
  "cards": [
    {
      "title": "string",
      "location": "string",
      "time": "string",
      "priority": "high" | "medium" | "low",
      "mapUrl": "string",
      "description": "string",
      "tags": ["string"]
    }
  ]
}
No extra text.
`;

      // =====================================================
      // 5️⃣ AI CALL
      // =====================================================
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: q }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const raw = result.choices[0].message.content;

      const safeJsonParse = (str) => {
        try {
          // LLMs frequently wrap JSON in markdown blocks, which breaks standard JSON.parse
          const cleanedText = str.replace(/```json/gi, "").replace(/```/g, "").trim();
          return JSON.parse(cleanedText);
        } catch (e) {
          console.error("JSON Parse failed for AI output:", e.message, "\nRaw Output:", str);
          return null;
        }
      };

      const json = safeJsonParse(raw);

      if (!json || !Array.isArray(json.cards)) {
        return res.render("user/Explore", {
          title: "AI Trip Planner - Error",
          error: "Invalid AI response. Try again later.",
          places: [],
          user,
        });
      }

      // =====================================================
      // 6️⃣ NORMALIZE AI DATA
      // =====================================================
      const getUnsplashImage = require("../helpers/getUnsplashImage");

      baseNormalizedPlaces = await Promise.all(
        json.cards.map(async (card) => {
          // Combine title, local location, and user target location for specific search
          const searchQuery = `${card.title || ""} ${card.location || ""} ${location || ""}`.trim();
          const photo = await getUnsplashImage(searchQuery);
          return {
            name: card.title || "Untitled Place",
            loc: card.location || "Unknown Location",
            time: card.time || "Anytime",
            desc: card.description || "No description available.",
            image: photo || "https://via.placeholder.com/400x250?text=No+Image",
            rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
            reviews: Math.floor(Math.random() * 400) + 20,
            dist: `${Math.floor(Math.random() * 20) + 1} km`,
            status: "upcoming",
            dur: "Flexible",
            icon: "📍",
            priority: card.priority || "medium",
            mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${card.title || ""} ${card.location || ""} ${location || ""}`.trim())}`,
            tags: card.tags || [],
          };
        })
      );

      // Save to cache with location identity
      tripCache.set(userIdStr, {
        normalizedPlaces: baseNormalizedPlaces,
        location: location || "Kerala"
      });
    }

    // =====================================================
    // 7️⃣ APPLY FILTERS (SERVER SIDE)
    // =====================================================
    let filteredPlaces = baseNormalizedPlaces;

    if (category && category !== "All") {
      filteredPlaces = filteredPlaces.filter(p =>
        p.name.toLowerCase().includes(category.toLowerCase()) ||
        p.desc.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (activity && activity !== "All") {
      filteredPlaces = filteredPlaces.filter(p =>
        p.desc.toLowerCase().includes(activity.toLowerCase())
      );
    }

    if (time && time !== "Any") {
      filteredPlaces = filteredPlaces.filter(p =>
        p.time.toLowerCase().includes(time.toLowerCase())
      );
    }

    if (distance && distance !== "Any") {
      filteredPlaces = filteredPlaces.filter(p =>
        p.dist.includes(distance)
      );
    }

    // =====================================================
    // 8️⃣ FINAL RENDER
    // =====================================================
    res.render("user/Explore", {
      title: `AI Trip Planner - ${user.name}`,
      query: q,
      places: filteredPlaces,
      user,
      error: null,
    });

  } catch (error) {
    console.error("AI Trip Planner Error:", error);

    res.render("user/Explore", {
      title: "AI Trip Planner - Error",
      error: "Something went wrong. Please try again later.",
      places: [],
      user: req.user || null,
    });
  }
};



exports.explorePage = async (req, res) => {
  try {
    const { category, activity, time, distance } = req.query;

    let filter = {};

    if (category) filter.category = category;
    if (activity) filter.activity = activity;
    if (time) filter.bestTime = time;
    if (distance) filter.distance = { $lte: Number(distance) };

    const rawPlaces = await Place.find(filter).limit(12);

    const places = rawPlaces.map(p => ({
      name: p.name || 'Unknown Place',
      loc: p.location || 'Unknown Location',
      time: p.bestTime || 'Anytime',
      desc: `${p.category || 'Destination'} perfect for ${p.activity || 'relaxation'}.`,
      image: p.image && !p.image.includes('placeholder') ? p.image : "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
      rating: (p.rating || 4.5).toFixed(1),
      reviews: Math.floor(Math.random() * 300) + 50,
      dist: p.distance ? `${p.distance} km` : '10 km',
      status: 'upcoming',
      dur: 'Flexible',
      icon: '📍',
      tags: [p.category, p.activity].filter(Boolean)
    }));

    res.render("user/Explore", {
      title: "Explore Destinations",
      places,
      user: req.user || null, // ✅ Pass user object to the template
      error: null
    });
  } catch (err) {
    console.error("Explore filter error:", err);
    res.render("user/Explore", {
      title: "Explore Destinations",
      places: [],
      user: req.user || null, // ✅ Pass user object even on error
    });
  }
};