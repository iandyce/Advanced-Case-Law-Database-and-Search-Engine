const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure .env variables are loaded

// ✅ Middleware to authenticate users
const authenticateUser = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error("❌ No token found or format incorrect");
        return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Extract token after "Bearer"

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("Missing JWT Secret in .env");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Decoded Token:", decoded); // Debug log

        req.user = decoded; // Store user info in request
        next(); // Proceed to the next middleware
    } catch (error) {
        console.error("❌ JWT Verification Error:", error.message); // Log error
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

// ✅ Middleware for role-based authorization (Explicitly allow admins for admin routes)
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ error: 'Access denied. No user information found.' });
        }

        // ✅ Allow access if:
        // 1. User role matches the allowed roles
        // 2. OR User is an admin (even if admin role isn’t explicitly in allowedRoles)
        if (allowedRoles.includes(req.user.role) || req.user.role === 'admin') {
            return next(); // Proceed if authorized
        }

        return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    };
};

// ✅ Export middleware functions
module.exports = { authenticateUser, authorizeRoles };
