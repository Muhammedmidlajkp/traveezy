const User = require('../models/user');
const Place = require('../models/place');


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

exports.homePage = async (req, res) => {
  try {
    // Fetch 3 published resorts
    const resorts = await Place.find({ category: "Resort", status: "Published" })
      .sort({ createdAt: -1 })
      .limit(3);

      const user = req.user || null;

    res.render('user/home', {
      title: "Traveezy - Home",
      resorts,
       user, // 👈 send resorts data to EJS
    });
  } catch (error) {
    console.error("Error loading resorts:", error);
    res.render('user/home', {
      title: "Traveezy - Home",
      resorts: [],
       user: null,
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
