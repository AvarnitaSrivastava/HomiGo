const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/isloggedin");
const { getMatches } = require("../controller/match.controller");

// Debug middleware
router.use((req, res, next) => {
    console.log("🛣️ Matches route hit:", req.method, req.path);
    next();
});

// Simple test route without authentication
router.get("/test", (req, res) => {
    console.log("📥 GET /matches/test endpoint hit");
    return res.status(200).send("Test route is working");
});

// Another test route
router.get("/ping", (req, res) => {
    console.log("🏓 GET /matches/ping endpoint hit");
    return res.status(200).send("pong");
});

// All routes require authentication
router.use(isLoggedIn);

// Get potential matches
router.get("/", (req, res, next) => {
    console.log("📥 GET /matches endpoint hit");
    next();
}, getMatches);

module.exports = router;