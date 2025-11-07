const User = require('../models/user');
const Place = require('../models/place');
const { Perplexity } = require("@perplexity-ai/perplexity_ai");
require("dotenv").config();
const getUnsplashImage = require("../helpers/getUnsplashImage");




exports.onboardingpage = (req,res)=>{

    res.render('user/onboarding',{
        title: "Travecy - Save and Plan Your Perfect Trip",
        appName: "Travecy",
        heroTitle: "Save and plan your perfect trip",
        heroDescription: "Organize your favorite places, create custom itineraries, and share your adventures effortlessly.",
        locationText: "Allow Travecy to access your location for personalized recommendations.",
        selectedInterests: [],
        startDate: "ENTER YOU STARTING DATE",
        endDate: "ENTER YOUR ENDING DATE",
    });
}

// exports.homePage = async (req, res) => {
//   try {
//     // Fetch 3 published resorts
//     const resorts = await Place.find({ category: "Resort", status: "Published" })
//       .sort({ createdAt: -1 })
//       .limit(3);

//       const user = req.user || null;

//       let heroPlace = "Vythiri"; // Default
   
//       if (user && user.onboarding && user.onboarding.location) {
//       // Example: "Goa, India" → "Goa"
//       heroPlace = user.onboarding.location.split(",")[0].trim();
//     }


//     res.render('user/home', {
//       title: "Traveezy - Home",
//       resorts,
//        user,
//        heroPlace, // 👈 send resorts data to EJS
//     });
//   } catch (error) {
//     console.error("Error loading resorts:", error);
//     res.render('user/home', {
//       title: "Traveezy - Home",
//       resorts: [],
//        user: null,
//        heroPlace: "Vythiri", // Default
//     });
//   }
// };

const client = new Perplexity({ apiKey: process.env.PERPLEXITY_API_KEY });


// exports.homePage = async (req, res) => {
//   try {
//     const user = req.user || null;

//     // Default hero place
//     let heroPlace = "Vythiri";
//     let userLocation = "Vythiri";

//     // ✅ Get user's saved location from onboarding data
//     if (user && user.onboarding && user.onboarding.location) {
//       userLocation = user.onboarding.location.split(",")[0].trim(); // e.g. "Goa, India" → "Goa"
//       heroPlace = userLocation;
//     }

//     // ✅ 1. Fetch top spots dynamically using Perplexity API
//     let topSpots = [];
//     try {
//       const response = await client.search({
//         model: "llama-3.1-sonar-large-128k-online",
//         messages: [
//           {
//             role: "system",
//             content: `Return a JSON array of 3 tourist attractions with fields: name, description, image (direct URL).`,
//           },
//           {
//             role: "user",
//             content: `List 3 top tourist attractions in ${userLocation}, India. Provide short descriptions and image URLs.`,
//           },
//         ],
//       });

//       // Try to parse JSON from AI response
//       const jsonMatch = response.output_text.match(/\[.*\]/s);
//       if (jsonMatch) {
//         topSpots = JSON.parse(jsonMatch[0]);
//       }
//     } catch (err) {
//       console.error("❌ Perplexity API error:", err);
//     }

//     // ✅ 2. Fetch resorts (as before)
//     const resorts = await Place.find({ category: "Resort", status: "Published" })
//       .sort({ createdAt: -1 })
//       .limit(3);

//     // ✅ 3. Render homepage
//     res.render("user/home", {
//       title: `Traveezy - Explore ${heroPlace}`,
//       heroPlace,
//       user,
//       topSpots,
//       resorts,
//     });
//   } catch (error) {
//     console.error("Error loading home page:", error);
//     res.render("user/home", {
//       title: "Traveezy - Home",
//       heroPlace: "Vythiri",
//       user: null,
//       topSpots: [],
//       resorts: [],
//     });
//   }
// };




// exports.homePage = async (req, res) => {
//   try {
//     const user = req.user || null;

//     let heroPlace = "Vythiri";
//     let userLocation = "Vythiri";

//     if (user && user.onboarding && user.onboarding.location) {
//       userLocation = user.onboarding.location.split(",")[0].trim();
//       heroPlace = userLocation;
//     }

//     // ✅ 1. Fetch top spots from Perplexity
//     let topSpots = [];
//     try {
//       const completion = await client.chat.completions.create({
//         model: "sonar-pro",
//         messages: [
//           {
//             role: "system",
//             content:
//               "Return only valid JSON array — 3 tourist attractions with keys: name and description (omit image).",
//           },
//           {
//             role: "user",
//             content: `List 3 top tourist attractions in ${userLocation}, India. Include short descriptions.`,
//           },
//         ],
//       });

//       const rawResponse = completion.choices[0].message.content;
//       const jsonMatch = rawResponse.match(/\[.*\]/s);
//       if (jsonMatch) {
//         topSpots = JSON.parse(
//           jsonMatch[0].replace(/```json\n?/, "").replace(/```$/, "")
//         );
//       }
//     } catch (err) {
//       console.error("❌ Perplexity API error:", err);
//     }

//     // ✅ 2. Add Unsplash images for each top spot
//     try {
//       await Promise.all(
//         topSpots.map(async (spot) => {
//           const imageUrl = await getUnsplashImage(`${spot.name} ${userLocation}`);
//           spot.image =
//             imageUrl ||
//             "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1200&auto=format&fit=crop"; // fallback
//         })
//       );
//     } catch (imgErr) {
//       console.error("Unsplash image fetch failed:", imgErr);
//     }

//     // ✅ 3. Fetch resorts (as before)
//     const resorts = await Place.find({ category: "Resort", status: "Published" })
//       .sort({ createdAt: -1 })
//       .limit(3);

//     // ✅ 4. Render
//     res.render("user/home", {
//       title: `Traveezy - Explore ${heroPlace}`,
//       heroPlace,
//       user,
//       topSpots,
//       resorts,
//     });
//   } catch (error) {
//     console.error("Error loading home page:", error);
//     res.render("user/home", {
//       title: "Traveezy - Home",
//       heroPlace: "Vythiri",
//       user: null,
//       topSpots: [],
//       resorts: [],
//     });
//   }
// };

exports.homePage = async (req, res) => {
  try {
    const user = req.user || null;

    // Default location
    let heroPlace = "Vythiri";
    let userLocation = "Vythiri";

    if (user && user.onboarding && user.onboarding.location) {
      userLocation = user.onboarding.location.split(",")[0].trim();
      heroPlace = userLocation;
    }

    // ✅ 1️⃣ Fetch Top Spots dynamically
    let topSpots = [];
    try {
      const completion = await client.chat.completions.create({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content:
              "Return only a valid JSON array of 3 tourist attractions with fields: name and description.",
          },
          {
            role: "user",
            content: `List 3 must-visit tourist attractions in ${userLocation}, India. Include short descriptions.`,
          },
        ],
      });

      const rawResponse = completion.choices[0].message.content;
      const jsonMatch = rawResponse.match(/\[.*\]/s);

      if (jsonMatch) {
        topSpots = JSON.parse(
          jsonMatch[0].replace(/```json\n?/, "").replace(/```$/, "")
        );
      }

      // ✅ Add Unsplash image to each spot
      await Promise.all(
        topSpots.map(async (spot) => {
          const imageUrl = await getUnsplashImage(
            `${spot.name} ${userLocation}`
          );
          spot.image =
            imageUrl ||
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop";
        })
      );
    } catch (err) {
      console.error("❌ Perplexity API error (spots):", err);
    }

    // ✅ 2️⃣ Fetch Top Foods dynamically
    let topFoods = [];
    try {
      const completionFood = await client.chat.completions.create({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content:
              "Return only valid JSON array — 3 traditional or trending local foods in the given city with keys: name, description.",
          },
          {
            role: "user",
            content: `List 3 famous local dishes or trending foods in ${userLocation}, India. Include short descriptions.`,
          },
        ],
      });

      const rawFoodResponse = completionFood.choices[0].message.content;
      const jsonMatchFood = rawFoodResponse.match(/\[.*\]/s);
      if (jsonMatchFood) {
        topFoods = JSON.parse(
          jsonMatchFood[0].replace(/```json\n?/, "").replace(/```$/, "")
        );
      }

      // ✅ Add Unsplash images for each food item
      await Promise.all(
        topFoods.map(async (food) => {
          const imageUrl = await getUnsplashImage(
            `${food.name} food ${userLocation}`
          );
          food.image =
            imageUrl ||
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop";
        })
      );
    } catch (err) {
      console.error("❌ Perplexity API error (food):", err);
    }

    // ✅ 3️⃣ Fetch Resorts from DB
    const resorts = await Place.find({
      category: "Resort",
      status: "Published",
    })
      .sort({ createdAt: -1 })
      .limit(3);

    // ✅ 4️⃣ Render Page
    res.render("user/home", {
      title: `Traveezy - Explore ${heroPlace}`,
      heroPlace,
      user,
      topSpots,
      topFoods, // 👈 pass foods too
      resorts,
    });
  } catch (error) {
    console.error("Error loading home page:", error);
    res.render("user/home", {
      title: "Traveezy - Home",
      heroPlace: "Vythiri",
      user: null,
      topSpots: [],
      topFoods: [],
      resorts: [],
    });
  }
};

/**
 * Toggles the block status of a user.
 * This is an admin-only action.
 */
exports.toggleBlockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle the user's status between 'Active' and 'Blocked'
    user.status = user.status === 'Blocked' ? 'Active' : 'Blocked';
    await user.save();

    const message = user.status === 'Blocked' ? 'User has been blocked successfully.' : 'User has been unblocked successfully.';
    
    // Redirect back to the user management page
    res.redirect('/admin/usermanagement');

  } catch (error) {
    console.error('Error toggling user block status:', error);
    res.status(500).send('Server Error');
  }
};




exports.saveOnboardingData = async (req, res) => {
  try {
    // console.log(req.body);
    
    const userId = req.user._id; // from auth middleware
    const { location, latitude, longitude, interests, startDate, endDate, notifications } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.onboarding = {
      location,
      latitude,
      longitude,

      interests: Array.isArray(interests) ? interests : [interests],
      travelStart: startDate && startDate !== 'Select your start date' ? new Date(startDate) : null,
      travelEnd: endDate && endDate !== 'Select your end date' ? new Date(endDate) : null,
      notifications: {
        discoveries: notifications.new,
        recommendations: notifications.personalized,
        reminders: notifications.trip
      },
      completed: true
    };

    await user.save();
    res.status(200).json({
      message: 'Onboarding data saved successfully',
      user

    });
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    res.status(500).json({ message: 'Server error saving onboarding data' });
  }
};
