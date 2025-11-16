const User = require('../models/user');
const Place = require('../models/place');
const path = require('path');
const fs = require('fs');
const Booking = require('../models/booking');


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
// exports.dashboardPage = (req, res) => {
//   res.render('admin/admindashboard', {  
//     adminName: 'Muhammed Midlaj',
//     adminEmail: 'admin@traveezy.com',
//     totalUsers: 24567,
//     activeBookings: 1879,
//     totalRevenue: '32.2M',
//     newReviews: 450,


//     activities: [
//       { icon: 'fas fa-user-plus', text: 'New user registered: Jane Doe', time: '2 hours ago' },
//       { icon: 'fas fa-check', text: 'Booking confirmed for "Green Valley Resort"', time: '5 hours ago' },
//     ],
//     notifications: [
//       { type: 'critical', title: 'Payment gateway error affecting 5 bookings.', time: 'Just now' },
//       { type: 'info', title: 'New user Alice Wonderland registered.', time: '1 hour ago' },
//     ],
//     page: 'overview',
//     title: 'Admin Dashboard',
//     activePage:"dashboard"
//   });
// };


// --- Admin Dashboard (Dynamic) ---
exports.dashboardPage = async (req, res) => {
  try {
    // 🧩 Fetch real data from MongoDB
    const totalUsers = await User.countDocuments();
    const totalPlaces = await Place.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // 🧩 Count active bookings (status: Paid)
    const activeBookings = await Booking.countDocuments({ status: "Paid" });

    // 🧩 Calculate total revenue (sum of amounts where status is Paid)
    const paidBookings = await Booking.find({ status: "Paid" });
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.amount, 0);

    // 🧩 Count cancelled bookings
    const cancelledBookings = await Booking.countDocuments({ status: "Cancelled" });

    // 🧩 Get last 5 recent bookings (for dashboard activity section)
    const recentBookings = await Booking.find()
      .populate("user", "name")
      .populate("place", "name")
      .sort({ bookedAt: -1 })
      .limit(5)
      .lean();

    // Convert to friendly text
    const activities = recentBookings.map(b => ({
      icon: b.status === "Paid" ? "fas fa-check text-green-500" : "fas fa-times text-red-500",
      text: `${b.user?.name || "Unknown"} ${b.status === "Paid" ? "booked" : "cancelled"} "${b.place?.name || "a resort"}"`,
      time: new Date(b.bookedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
    }));

    // 🧩 Example notifications (can extend with logic later)
    const notifications = [
      { type: 'info', title: 'System running smoothly.', time: 'Just now' },
      { type: 'success', title: `${activeBookings} active bookings currently.`, time: '1 min ago' }
    ];


    // 🧩 Render page with all real data
    res.render("admin/admindashboard", {
      title: "Admin Dashboard",
      activePage: "dashboard",
      adminName: "Muhammed Midlaj",
      adminEmail: "admin@traveezy.com",

      // ✅ Real dynamic stats
      totalUsers,
      totalPlaces,
      totalBookings,
      activeBookings,
      cancelledBookings,
      totalRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
      newReviews: 0, // you can later replace with review model

      // ✅ Dynamic activities and notifications
      activities,
      notifications,

      page: "overview",
    });

  } catch (error) {
    console.error("❌ Error loading admin dashboard:", error);
    res.status(500).send("Server Error");
  }
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
    const { name, category, status, rating, location, price } = req.body;
    let imagePath = req.file ? `/uploads/places/${req.file.filename}` : null;

    const newPlace = new Place({
      name,
      category,
      status,
      rating,
      location,
      price,
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
        const { id, name, category, status, rating, location, price } = req.body;
        const updatedData = { name, category, status, rating, location, price };

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


// exports.renderAnalytics = async (req, res) => {
//   try {
//     // --- Fetch Real Data for Analytics ---
//     const totalUsers = await User.countDocuments();
//     const totalPlaces = await Place.countDocuments();

//     // Data for a chart (e.g., new users in the last 7 days)
//     const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
//     const newUsersLast7Days = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

//     // Example data structure for charts
//     const analyticsData = {
//       userCount: totalUsers,
//       placeCount: totalPlaces,
//       newUsers: newUsersLast7Days,
//       revenue: 12500, // Placeholder
//       bookings: 85,   // Placeholder
//     };

//     res.render('admin/analytics', {
//       title: 'Analytics Dashboard',
//       activePage: 'analytics', // ✅ Pass activePage to the template
//       data: analyticsData,     // ✅ Pass real data to the template
//     });
//   } catch (error) {
//     console.error('Error rendering analytics page:', error);
//     res.status(500).send('Internal Server Error');
//   }
// };


// exports.renderAnalytics = async (req, res) => {
//   try {
//     // --- Fetch core counts ---
//     const totalUsers = await User.countDocuments();
//     const totalPlaces = await Place.countDocuments();
//     const totalBookings = await Booking.countDocuments({ status: { $ne: 'Cancelled' } });

//     // --- Active users (logged in last 30 days) ---
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
//     const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

//     // --- New registrations in last 30 days ---
//     const newUsersLast30Days = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

//     // --- Revenue from Paid bookings ---
//     const paidBookings = await Booking.find({ status: "Paid" });
//     const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

//     // --- Retention rate (example proxy) ---
//     const retentionRate = ((activeUsers / totalUsers) * 100).toFixed(1);

//     // --- Monthly user growth chart (last 12 months) ---
//     const currentYear = new Date().getFullYear();
//     const userGrowth = await User.aggregate([
//       {
//         $match: {
//           createdAt: {
//             $gte: new Date(`${currentYear}-01-01`),
//             $lte: new Date(`${currentYear}-12-31`)
//           }
//         }
//       },
//       {
//         $group: {
//           _id: { $month: "$createdAt" },
//           count: { $sum: 1 }
//         }
//       },
//       { $sort: { "_id": 1 } }
//     ]);

//     const monthlyLabels = [
//       "Jan","Feb","Mar","Apr","May","Jun",
//       "Jul","Aug","Sep","Oct","Nov","Dec"
//     ];

//     const userGrowthData = monthlyLabels.map((_, idx) => {
//       const monthData = userGrowth.find(u => u._id === idx + 1);
//       return monthData ? monthData.count : 0;
//     });

//     // --- Combine all for view ---
//     const analyticsData = {
//       totalUsers,
//       totalPlaces,
//       totalBookings,
//       activeUsers,
//       newUsersLast30Days,
//       totalRevenue,
//       retentionRate,
//       monthlyLabels,
//       userGrowthData
//     };

//     res.render("admin/analytics", {
//       title: "Analytics Dashboard",
//       activePage: "analytics",
//       data: analyticsData
//     });

//   } catch (error) {
//     console.error("Error rendering analytics page:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };



exports.renderAnalytics = async (req, res) => {
  try {
    // --- Fetch core counts ---
    const totalUsers = await User.countDocuments();
    const totalPlaces = await Place.countDocuments();
    const totalBookings = await Booking.countDocuments({ status: { $ne: 'Cancelled' } });

    // --- Active users (logged in last 30 days) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

    // --- New registrations in last 30 days ---
    const newUsersLast30Days = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // --- Revenue from Paid bookings ---
    const paidBookings = await Booking.find({ status: "Paid" });
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // --- Retention rate (proxy metric) ---
    const retentionRate = totalUsers ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0;

    // --- Monthly user growth chart (last 12 months) ---
    const currentYear = new Date().getFullYear();
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const monthlyLabels = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const userGrowthData = monthlyLabels.map((_, idx) => {
      const monthData = userGrowth.find(u => u._id === idx + 1);
      return monthData ? monthData.count : 0;
    });

    // --- 🧩 Retention Data (Real) ---
    const retentionData = [];
    const monthNames = monthlyLabels.slice(0, new Date().getMonth() + 1);

    for (let i = 0; i < monthNames.length; i++) {
      const start = new Date(currentYear, i, 1);
      const end = new Date(currentYear, i + 1, 0);

      // Cohort: users who registered this month
      const cohort = await User.find({
        createdAt: { $gte: start, $lte: end }
      }).select("createdAt lastLogin");

      const cohortSize = cohort.length;
      if (cohortSize === 0) continue; // skip empty months

      // Helper: retention in X months after signup
      const calcRetention = (monthsAfter) => {
        const nextStart = new Date(start);
        nextStart.setMonth(nextStart.getMonth() + monthsAfter);
        const nextEnd = new Date(end);
        nextEnd.setMonth(nextEnd.getMonth() + monthsAfter);

        const returning = cohort.filter(u => 
          u.lastLogin && u.lastLogin >= nextStart && u.lastLogin <= nextEnd
        ).length;

        return ((returning / cohortSize) * 100).toFixed(0) + "%";
      };

      retentionData.push([
        monthNames[i] + " " + currentYear,
        cohortSize,
        calcRetention(1),
        calcRetention(2),
        calcRetention(3),
        calcRetention(6)
      ]);
    }

    // --- Combine all data ---
    const analyticsData = {
      totalUsers,
      totalPlaces,
      totalBookings,
      activeUsers,
      newUsersLast30Days,
      totalRevenue,
      retentionRate,
      monthlyLabels,
      userGrowthData,
      retentionData
    };

    // --- Render the analytics dashboard ---
    res.render("admin/analytics", {
      title: "Analytics Dashboard",
      activePage: "analytics",
      data: analyticsData
    });

  } catch (error) {
    console.error("❌ Error rendering analytics page:", error);
    res.status(500).send("Internal Server Error");
  }
};





exports.bookingManagementPage = async (req, res) => {
  try {
    // Fetch all bookings and populate user + resort data
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("place", "name price location")
      .sort({ bookedAt: -1 });

    // Compute stats
    const totalBookings = bookings.length;
    const confirmedCount = bookings.filter(b => b.status === "Paid").length;
    const cancelledCount = bookings.filter(b => b.status === "Cancelled").length; // optional
    const totalRevenue = bookings
      .filter(b => b.status === "Paid")
      .reduce((sum, b) => sum + b.amount, 0);

    // Format bookings for display
    const formattedBookings = bookings.map(b => ({
      id: b._id,
      user: b.user ? b.user.name : "Unknown User",
      email: b.user ? b.user.email : "N/A",
      resort: b.place ? b.place.name : "N/A",
      amount: b.amount,
      status: b.status === "Paid" ? "Confirmed" : "Cancelled",
      bookedAt: b.bookedAt.toLocaleDateString(),
    }));

    res.render("admin/bookingmanagement", {
      title: "Booking Management",
      activePage: "bookingmanagement",
      bookings: formattedBookings,
      totalBookings,
      confirmedCount,
      cancelledCount,
      totalRevenue,
    });
  } catch (err) {
    console.error("Error loading booking management page:", err);
    res.status(500).send("Server Error");
  }
};

exports.bookingManagementPage = async (req, res) => {
  try {
    // Fetch all bookings and populate user + place data
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("place", "name price location image") // include image!
      .sort({ bookedAt: -1 });

    // Compute stats
    const totalBookings = bookings.length;
    const confirmedCount = bookings.filter(b => b.status === "Paid").length;
    const cancelledCount = bookings.filter(b => b.status === "Cancelled").length;
    const totalRevenue = bookings
      .filter(b => b.status === "Paid")
      .reduce((sum, b) => sum + b.amount, 0);

    // Format bookings for display
    const formattedBookings = bookings.map(b => ({
      id: b._id,
      user: b.user ? b.user.name : "Unknown User",
      email: b.user ? b.user.email : "N/A",
      resort: b.place ? b.place.name : "N/A",
      placeImage: b.place?.image || "https://via.placeholder.com/120?text=No+Image",
      location: b.place?.location || "Unknown",
      paymentId: b.paymentId || "N/A",
      amount: b.amount,
      status: b.status === "Paid" ? "Confirmed" : "Cancelled",
      bookedAt: b.bookedAt.toLocaleString(),
    }));

    // Render EJS
    res.render("admin/bookingmanagement", {
      title: "Booking Management",
      activePage: "bookingmanagement",
      bookings: formattedBookings,
      totalBookings,
      confirmedCount,
      cancelledCount,
      totalRevenue,
    });
  } catch (err) {
    console.error("Error loading booking management page:", err);
    res.status(500).send("Server Error");
  }
};


exports.dashboardPage = async (req, res) => {
  try {
    // 🧩 Fetch real data from MongoDB
    const totalUsers = await User.countDocuments();
    const totalPlaces = await Place.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // 🧩 Count active (Paid) and cancelled bookings
    const activeBookings = await Booking.countDocuments({ status: "Paid" });
    const cancelledBookings = await Booking.countDocuments({ status: "Cancelled" });

    // 🧩 Calculate total revenue from Paid bookings
    const paidBookings = await Booking.find({ status: "Paid" });
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // 🧩 Get recent 5 bookings for activity section
    const recentBookings = await Booking.find()
      .populate("user", "name")
      .populate("place", "name")
      .sort({ bookedAt: -1 })
      .limit(5)
      .lean();

    const activities = recentBookings.map(b => ({
      icon: b.status === "Paid" ? "fas fa-check text-green-500" : "fas fa-times text-red-500",
      text: `${b.user?.name || "Unknown"} ${b.status === "Paid" ? "booked" : "cancelled"} "${b.place?.name || "a resort"}"`,
      time: new Date(b.bookedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
    }));

    // 🧩 Notifications (you can expand later)
    const notifications = [
      { type: "info", title: "System running smoothly.", time: "Just now" },
      { type: "success", title: `${activeBookings} active bookings currently.`, time: "1 min ago" }
    ];

    // 🧩 --- User Growth Chart (Last 7 days) ---
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - i)); // Reverse order: oldest → newest
      return date;
    });

    const userGrowthLabels = last7Days.map(d =>
      d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    );

    const userGrowthData = await Promise.all(
      last7Days.map(async (day) => {
        const start = new Date(day.setHours(0, 0, 0, 0));
        const end = new Date(day.setHours(23, 59, 59, 999));
        return await User.countDocuments({ createdAt: { $gte: start, $lt: end } });
      })
    );

    // 🧩 --- Booking Category Trend (based on Place categories) ---
    const categoryData = await Booking.aggregate([
      { $lookup: { from: "places", localField: "place", foreignField: "_id", as: "place" } },
      { $unwind: "$place" },
      { $group: { _id: "$place.category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const bookingCategories = categoryData.map(c => c._id || "Uncategorized");
    const bookingCounts = categoryData.map(c => c.count);

    // 🧩 Render page with real stats + chart data
    res.render("admin/admindashboard", {
      title: "Admin Dashboard",
      activePage: "dashboard",
      adminName: "Muhammed Midlaj",
      adminEmail: "admin@traveezy.com",

      // --- Dashboard stats
      totalUsers,
      totalPlaces,
      totalBookings,
      activeBookings,
      cancelledBookings,
      totalRevenue: `₹${totalRevenue.toLocaleString("en-IN")}`,
      newReviews: 0,

      // --- Activity and notifications
      activities,
      notifications,
      page: "overview",

      // --- Chart data
      userGrowthLabels,
      userGrowthData,
      bookingCategories,
      bookingCounts,
    });
  } catch (error) {
    console.error("❌ Error loading admin dashboard:", error);
    res.status(500).send("Server Error");
  }
};




exports.deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).send("Booking not found");
    }

    // Delete the booking
    await Booking.findByIdAndDelete(bookingId);

    // 🧩 Optional: update the corresponding place (resort)
    // Example: you may have "bookedByUser" field in Place
    // If so, we remove that user from the bookedByUser list
    await Place.updateOne(
      { _id: booking.place },
      { $unset: { bookedByUser: "" } } // clear the booked flag
    );

    console.log(`Booking ${bookingId} deleted successfully`);
    res.redirect("/admin/bookingmanagement");
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).send("Server Error");
  }
};