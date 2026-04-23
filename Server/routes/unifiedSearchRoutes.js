const { unifiedSearch } = require("../controllers/unifiedSearchController");
const express = require("express");
const router = express.Router();

// ...existing imports and routes...

// Unified search endpoint
router.get("/all", unifiedSearch);

module.exports = router;
