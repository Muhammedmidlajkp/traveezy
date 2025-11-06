const { Perplexity } = require("@perplexity-ai/perplexity_ai");
require("dotenv").config();
const User = require("../models/user");
const place = require("../models/place");
const getUnsplashImage = require("../helpers/getUnsplashImage");


const client = new Perplexity({ apiKey: process.env.PERPLEXITY_API_KEY });

exports.aiTripPlannerPage = async (req, res) => {
  try {
    // 🧠 Fetch logged-in user (from middleware)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.render("user/Explore", {
        title: "AI Trip Planner - Not Found",
        error: "No user data found in the database.",
        cards: [],
      });
    }

    // 🧩 Extract onboarding info
    const { location, travelStart, travelEnd, interests } = user.onboarding || {};

    // 🧮 Calculate trip days
    let days = 3;
    if (travelStart && travelEnd) {
      const diff = Math.ceil(
        (new Date(travelEnd) - new Date(travelStart)) / (1000 * 60 * 60 * 24)
      );
      days = diff <= 0 ? 1 : diff; // Same-day trips = 1 day
    }

    // 🧠 Create the AI query
//     const q = `
// You are a professional tour planner with over 40 years of experience in Indian tourism.
// Plan a ${days}-day trip for ${user.name}, starting from ${location || "Kerala"}.

// Your goal:
// - Create a realistic, local-style itinerary.
// - Suggest nearby locations, ordered from nearest to farthest.
// - Each day should have meaningful travel flow (no backtracking).
// - Include hidden gems, authentic food spots, and local experiences.
// - Consider travel time and distance between each spot.

// Traveler’s interests: ${interests?.length ? interests.join(", ") : "nature, adventure, culture"}.

// Output only the best trip plan that feels curated by a local guide, not AI.
// `;


const q = `
You are a professional tour planner with over 40 years of experience in Indian tourism.
Plan a ${days}-day trip for ${user.name}, starting from ${location || "Kerala"}.

Your goal:
- Design a realistic, human-friendly itinerary.
- Include only 5–6 major stops per day (avoid overpacking the schedule).
- Prioritize nearby locations first, with minimal travel time between them.
- Allocate proper time for meals, rest, and travel.
- Include hidden gems, authentic food spots, and local experiences.
- Make it feel achievable for a normal traveler, not a rushed schedule.
- Keep the tone conversational and local, as if spoken by an experienced guide.
- Avoid suggesting places that close early after 4 PM unless they’re the last stop.
- Ensure the final stop of the day is peaceful or sunset-friendly.

Traveler’s interests: ${interests?.length ? interests.join(", ") : "nature, food, and culture"}.

Output only the best trip plan that feels curated by a local guide with realistic timing.
`;



    const systemPrompt = `
    Return ONLY JSON in this format:
    {
      "cards": [
        {
          "title": "string",
          "location": "string",
          "time": "string",
          "mapUrl": "string",
          "description": "string",
          "tags": ["string"]
        }
      ]
    }
    No markdown or text outside JSON.
    `;

    const safeJsonParse = (str) => {
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    };

    // 🔮 Ask Perplexity AI
    const completion = await client.chat.completions.create({
      model: "sonar-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: q },
      ],
      temperature: 0.2,
      search_mode: "web",
      media_response: { overrides: { return_images: true } },
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const json = safeJsonParse(raw);

    if (!json || !Array.isArray(json.cards)) {
      return res.render("user/Explore", {
        title: "AI Trip Planner - Error",
        error: "Invalid AI response. Try again later.",
        places: [],
      });
    }

   // 🧩 Normalize AI response into EJS-friendly format
// const images = completion.images || [];
// const normalizedPlaces = json.cards.map((card, i) => ({
//   name: card.title || "Untitled Place",
//   loc: card.location || "Unknown Location",
//   time: card.time || "Anytime",
//   desc: card.description || "No description available.",
//   image: images[i]?.image_url || "https://via.placeholder.com/400x250?text=No+Image",
//   rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1), // Random 3.5–5 rating
//   reviews: Math.floor(Math.random() * 400) + 20, // Random number of reviews
//   dist: `${Math.floor(Math.random() * 20) + 1} km away`, // Random distance
//   status: "upcoming",
//   dur: "Flexible",
//   icon: "📍"
// }));


const getUnsplashImage = require("../helpers/getUnsplashImage");

const normalizedPlaces = await Promise.all(
  json.cards.map(async (card) => {
    const photo = await getUnsplashImage(card.title || card.location);
    return {
      name: card.title || "Untitled Place",
      loc: card.location || "Unknown Location",
      time: card.time || "Anytime",
      desc: card.description || "No description available.",
      image: photo || "https://via.placeholder.com/400x250?text=No+Image",
      rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
      reviews: Math.floor(Math.random() * 400) + 20,
      dist: `${Math.floor(Math.random() * 20) + 1} km away`,
      status: "upcoming",
      dur: "Flexible",
      icon: "📍"
    };
  })
);



    // ✅ Render the Explore page with AI data
    res.render("user/Explore", {
      title: `AI Trip Planner - ${user.name}`,
      query: q,
      places: normalizedPlaces,
      error: null,
    });
  } catch (error) {
    console.error("AI Trip Planner Error:", error);
    res.render("user/Explore", {
      title: "AI Trip Planner - Error",
      error: "Something went wrong with the AI service or database.",
      places: [],
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

    const places = await Place.find(filter).limit(12);

    res.render("user/Explore", {
      title: "Explore Destinations",
      places,
    });
  } catch (err) {
    console.error("Explore filter error:", err);
    res.render("user/Explore", {
      title: "Explore Destinations",
      places: [],
    });
  }
};