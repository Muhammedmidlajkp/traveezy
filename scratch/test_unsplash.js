require("dotenv").config();
const getUnsplashImage = require("../helpers/getUnsplashImage");

async function runTest() {
    console.log("🧪 Testing Unsplash Helper Fallbacks...");
    
    const queries = [
        "Delicious Italian Pizza",
        "Beautiful Sunny Beach in Goa",
        "Hiking in the Himalayas",
        "A busy street in New York City",
        "A peaceful garden"
    ];

    for (const q of queries) {
        console.log(`\n🔍 Query: "${q}"`);
        // We simulate a failure by using a fake API key if none exists, 
        // leading to fallback trigger.
        const result = await getUnsplashImage(q);
        console.log(`🖼️  Result: ${result}`);
        
        if (result.includes("pixabay.com") || result.includes("images.unsplash.com")) {
            console.log("✅ Image URL received successfully!");
        } else {
            console.log("❌ Unexpected result.");
        }
    }
}

runTest();
