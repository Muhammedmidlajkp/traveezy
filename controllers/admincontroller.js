const User = require('../models/user');
const Place = require('../models/place');
const path = require('path');
const fs = require('fs');

// --- Middleware to load admin data for all admin routes ---
exports.loadAdminData = (req, res, next) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'traveezy@gmail.com';
    const profilePath = path.join(__dirname, '../data/adminProfile.json');
    let adminData;

    if (fs.existsSync(profilePath)) {
      const fileData = fs.readFileSync(profilePath, 'utf8');
      adminData = JSON.parse(fileData);
    } else {
      // Fallback default data if JSON file doesn't exist
      adminData = {
        name: 'Admin',
        email: adminEmail,
        avatar: '/assets/images/ADMIN IMG.jpg'
      };
    }
    res.locals.admin = adminData; // Make admin data available in all templates
    next();
  } catch (error) {
    console.error('Error loading admin data:', error);
    next(error); // Pass error to the error handler
  }
};

// --- Admin Dashboard ---
exports.dashboardPage = (req, res) => {
  res.render('admin/admindashboard', {  
    adminName: 'Muhammed Midlaj',
    adminEmail: 'admin@traveezy.com',
    totalUsers: 24567,
    activeBookings: 1879,
    totalRevenue: '3.2M',
    newReviews: 450,


    activities: [
      { icon: 'fas fa-user-plus', text: 'New user registered: Jane Doe', time: '2 hours ago' },
      { icon: 'fas fa-check', text: 'Booking confirmed for "Green Valley Resort"', time: '5 hours ago' },
    ],
    notifications: [
      { type: 'critical', title: 'Payment gateway error affecting 5 bookings.', time: 'Just now' },
      { type: 'info', title: 'New user Alice Wonderland registered.', time: '1 hour ago' },
    ],
    page: 'overview',
    title: 'Admin Dashboard',
    activePage:"dashboard"
  });
};


exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;


    const searchQuery = req.query.search || '';
    const filterRole = req.query.role || '';
    const filterStatus = req.query.status || '';
    const lastLogin = req.query.lastLogin || '';

   
    const query = {};

    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    if (filterRole) query.role = filterRole;
    if (filterStatus) query.status = filterStatus;

    // Count & Fetch users
    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query).skip(skip).limit(limit).lean();

    // Format last login nicely
    users.forEach(user => {
      user.lastLogin = user.lastLogin
        ? new Date(user.lastLogin).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '—';
      user.avatarBg = '#e0e0e0'; // Default avatar background color
    });

    const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

    res.render('admin/usermanagement', {
      users,
      totalPages,
      currentPage: page,
      userInitials: 'JD',
      searchQuery,
      filterRole,
      filterStatus,
      lastLogin,
      page: 'users',
      title: 'User Management',
      activePage:"usermanagement"
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).send('Server Error');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/usermanagement');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};


exports.viewUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};



// GET all places
exports.getPlaces = async (req, res) => {
  try {
    const places = await Place.find().sort({ createdAt: -1 });
    res.render('admin/contentmanagement', {
      places,
      currentPage: 1,
      totalPages: 1,
      activePage: 'contentmanagement',
      title: 'Content Management'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// ADD new place
exports.addPlace = async (req, res) => {
  try {
    const { name, category, status, rating } = req.body;
    let imagePath = req.file ? `/uploads/places/${req.file.filename}` : null;

    const newPlace = new Place({
      name,
      category,
      status,
      rating,
      image: imagePath || 'https://via.placeholder.com/120?text=No+Image'
    });

    await newPlace.save();
    res.redirect('/admin/contentmanagement');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding place');
  }
};

// DELETE place
exports.deletePlace = async (req, res) => {
  try {
    await Place.findByIdAndDelete(req.params.id);
    res.redirect('/admin/contentmanagement');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting place');
  }
};

// Update existing place
exports.updatePlace = async (req, res) => {
    try {
        const { id, name, category, status, rating } = req.body;
        const updatedData = { name, category, status, rating };

        if (req.file) {
            // You might want to delete the old image from the file system here
            updatedData.image = `/uploads/places/${req.file.filename}`;
        }

        await Place.findByIdAndUpdate(id, updatedData);
        res.redirect('/admin/contentmanagement');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating place');
    }
};

// GET place by ID (for editing purposes, typically fetched via AJAX)
exports.getPlaceById = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }
    res.json(place);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// --- Place Availability ---

// GET blocked dates for a place
exports.getBlockedDates = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id).select('blockedDates');
    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }
    res.json((place.blockedDates || []).map(d => d.toISOString().split('T')[0]));
  } catch (err) {
    console.error('Error fetching blocked dates:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST to toggle a blocked date for a place
exports.toggleBlockedDate = async (req, res) => {
  try {
    const { date } = req.body;
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    // Ensure blockedDates is an array
    if (!place.blockedDates) {
      place.blockedDates = [];
    }

    const dateObj = new Date(date);
    const dateString = dateObj.toISOString();
    const dateIndex = place.blockedDates.findIndex(d => d.toISOString() === dateString);

    if (dateIndex > -1) {
      place.blockedDates.splice(dateIndex, 1); // Unblock date
    } else {
      place.blockedDates.push(dateObj); // Block date
    }

    await place.save();
    res.json({ success: true, blockedDates: place.blockedDates.map(d => d.toISOString().split('T')[0]) });
  } catch (err) {
    console.error('Error toggling blocked date:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Admin Profile Page ---
exports.profilePage = async (req, res) => {
  try {
    // ✅ Render with latest profile data
    // The admin data is already loaded by the `loadAdminData` middleware
    res.render('admin/profile', {
      title: 'Admin Profile',
      activePage: 'profile'
    });

  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).send('Server Error');
  }
};



  exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const profilePath = path.join(__dirname, '../data/adminProfile.json');
    const adminEmail = process.env.ADMIN_EMAIL || 'traveezy@gmail.com';

    let adminData = { email: adminEmail };

    // ✅ Load existing data
    if (fs.existsSync(profilePath)) {
      adminData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    }

    // ✅ Update fields
    adminData.name = name || adminData.name;
    adminData.email = email || adminData.email;
    if (req.file) {
      adminData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // ✅ Save back to file
    fs.writeFileSync(profilePath, JSON.stringify(adminData, null, 2), 'utf8');

    res.redirect('/admin/profile');
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).send('Server Error');
  }
};


exports.renderAnalytics = async (req, res) => {
  try {
    // --- Fetch Real Data for Analytics ---
    const totalUsers = await User.countDocuments();
    const totalPlaces = await Place.countDocuments();

    // Data for a chart (e.g., new users in the last 7 days)
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    const newUsersLast7Days = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Example data structure for charts
    const analyticsData = {
      userCount: totalUsers,
      placeCount: totalPlaces,
      newUsers: newUsersLast7Days,
      revenue: 12500, // Placeholder
      bookings: 85,   // Placeholder
    };

    res.render('admin/analytics', {
      title: 'Analytics Dashboard',
      activePage: 'analytics', // ✅ Pass activePage to the template
      data: analyticsData,     // ✅ Pass real data to the template
    });
  } catch (error) {
    console.error('Error rendering analytics page:', error);
    res.status(500).send('Internal Server Error');
  }
};
