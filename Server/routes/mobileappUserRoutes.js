const express = require("express");
const router = express.Router();
// All favorites (beauticians & services)
router.get("/favorites/all", require("../controllers/mobileappUserController").getAllFavorites);
const {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  getBookingHistory,
  getBookingById,
  getFavoriteStylists,
  addFavoriteStylist,
  removeFavoriteStylist,
  getFavoriteServices,
  addFavoriteService,
  removeFavoriteService,
} = require("../controllers/mobileappUserController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// All routes require authentication and Customer role
router.use(protect, authorizeRoles("Customer"));

// Profile
router.get("/profile", getProfile);
router.put("/profile", upload.single("profileImage"), updateProfile);
router.put("/change-password", changePassword);

// Addresses
router.post("/add-address", addAddress);
router.get("/addresses", getAddresses);
router.put("/address/:id", updateAddress);
router.delete("/address/:id", deleteAddress);

// Favorite stylists
router.get("/favorites", getFavoriteStylists);
router.post("/favorites", addFavoriteStylist);
router.delete("/favorites/:beauticianId", removeFavoriteStylist);

// Favorite services
router.get("/favorite-services", getFavoriteServices);
router.post("/favorite-services", addFavoriteService);
router.delete("/favorite-services/:serviceId", removeFavoriteService);

// Booking history
router.get("/booking-history", getBookingHistory);
router.get("/booking/:id", getBookingById);

module.exports = router;
