require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL Database');
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = decoded; // { userId, email, role }
        next();
    });
};

// Import and Use Routes
const authRoutes = require('./authRoutes');
app.use('/auth', authRoutes);

// Add About Routes with Debugging
let aboutRoutes;
try {
    aboutRoutes = require('./aboutRoutes');
    console.log('✅ Successfully loaded aboutRoutes');
} catch (error) {
    console.error('❌ Failed to load aboutRoutes:', error);
}
if (aboutRoutes) {
    app.use('/api/about', aboutRoutes);
    console.log('✅ Mounted aboutRoutes at /api/about');
} else {
    console.error('❌ aboutRoutes not mounted due to loading error');
}

// Test Route for /api/about
app.get('/api/about/test', (req, res) => {
    res.send('Test route for /api/about is working');
});

// Fetch Team Members from Database
app.get('/api/about/team-members', (req, res) => {
    const query = 'SELECT name, role, bio, image FROM team_members';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching team members:', err);
            console.error('SQL Message:', err.sqlMessage);
            return res.status(500).json({ 
                error: 'Internal Server Error',
                details: err.message,
                sqlMessage: err.sqlMessage
            });
        }
        console.log('✅ Successfully fetched team members:', results.length);
        res.json(results);
    });
});

// Test Route
app.get('/', (req, res) => {
    res.send('Case Law Backend is Running...');
});

// Get all case laws
app.get('/cases', (req, res) => {
    console.log('Received request for /cases');
    const query = 'SELECT id, title, case_number, county, court, judge, date_of_judgment, summary, full_text, region, description, date_filed FROM cases';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching cases:', err);
            console.error('Error code:', err.code);
            console.error('SQL Message:', err.sqlMessage);
            return res.status(500).json({ 
                error: 'Internal Server Error',
                details: err.message,
                sqlMessage: err.sqlMessage
            });
        }
        console.log('Successfully fetched cases:', results.length);
        res.json(results);
    });
});

// Get case laws by county
app.get('/cases/county/:county', (req, res) => {
    const county = req.params.county;
    const query = 'SELECT * FROM cases WHERE county = ?';
    db.query(query, [county], (err, results) => {
        if (err) {
            console.error('❌ Error fetching cases by county:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
});

// Full-text search with optional region and county filtering
app.get('/cases/search', (req, res) => {
    const { query, caseTitle, judge, date, keywords, region, county } = req.query;
    let sqlQuery = 'SELECT id, title, case_number, county, court, judge, date_of_judgment, summary, full_text, region, description, date_filed FROM cases WHERE 1=1';
    const params = [];

    if (query) {
        sqlQuery += ' AND (title LIKE ? OR summary LIKE ? OR full_text LIKE ? OR description LIKE ?)';
        params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }
    if (caseTitle) {
        sqlQuery += ' AND title LIKE ?';
        params.push(`%${caseTitle}%`);
    }
    if (judge) {
        sqlQuery += ' AND judge LIKE ?';
        params.push(`%${judge}%`);
    }
    if (date) {
        sqlQuery += ' AND (date_filed = ? OR date_of_judgment = ?)';
        params.push(date, date);
    }
    if (keywords) {
        sqlQuery += ' AND (summary LIKE ? OR full_text LIKE ? OR description LIKE ?)';
        params.push(`%${keywords}%`, `%${keywords}%`, `%${keywords}%`);
    }
    if (region) {
        sqlQuery += ' AND region = ?';
        params.push(region);
    }
    if (county) {
        sqlQuery += ' AND county = ?';
        params.push(county);
    }

    console.log("🔎 Final Query:", sqlQuery);
    console.log("🔎 Query Parameters:", params);

    db.query(sqlQuery, params, (err, results) => {
        if (err) {
            console.error('❌ Error performing search:', err);
            console.error('SQL Message:', err.sqlMessage);
            return res.status(500).json({ 
                error: 'Internal Server Error',
                details: err.message,
                sqlMessage: err.sqlMessage
            });
        }
        console.log("✅ Search Results:", results.length);
        res.json(results);
    });
});

// Get a single case by case_id
app.get('/cases/:id', (req, res) => {
    const caseId = req.params.id;
    const query = 'SELECT * FROM cases WHERE case_id = ?';
    console.log("Executing query:", query, "with case_id:", caseId);
    db.query(query, [caseId], (err, results) => {
        if (err) {
            console.error('❌ Error fetching case by ID:', err);
            return res.status(500).json({ error: 'Internal Server Error', details: err.sqlMessage });
        } else if (results.length === 0) {
            return res.status(404).json({ error: 'Case not found' });
        }
        res.json(results[0]);
    });
});

app.get("/api/cases/count", (req, res) => {
    const county = req.query.county;
    if (!county) return res.status(400).json({ error: "County is required" });
    const sql = "SELECT COUNT(*) AS count FROM cases WHERE region = ?";
    db.query(sql, [county], (err, result) => {
        if (err) {
            console.error("Error fetching case count:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ count: result[0].count });
    });
});

// New Profile Endpoints
app.get('/profile', verifyToken, (req, res) => {
    const query = 'SELECT name, email, role, created_at FROM users WHERE id = ?';
    db.query(query, [req.user.userId], (err, results) => {
        if (err) {
            console.error('❌ Error fetching profile:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (results.length === 0) {
            console.log('⚠️ No user found for ID:', req.user.userId);
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('✅ Profile fetched for user:', req.user.userId, results[0]);
        res.json(results[0]); // Returns { name, email, role, created_at }
    });
});

app.put('/profile', verifyToken, (req, res) => {
    const { username, password } = req.body; // Frontend sends 'username', map to 'name'
    let query = 'UPDATE users SET ';
    const params = [];
    if (username) { // Map 'username' to 'name'
        query += 'name = ?, ';
        params.push(username);
    }
    if (password) {
        query += 'password_hash = ?, '; // Plain text for now; use bcrypt in production
        params.push(password);
    }
    if (params.length === 0) return res.status(400).json({ error: 'No updates provided' });
    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(req.user.userId);

    db.query(query, params, (err, result) => {
        if (err) {
            console.error('❌ Error updating profile:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        console.log('✅ Profile updated for user:', req.user.userId);
        res.json({ message: 'Profile updated successfully' });
    });
});

// New History Endpoints
app.post('/history', verifyToken, (req, res) => {
    const { caseId } = req.body;
    if (!caseId) return res.status(400).json({ error: 'caseId is required' });
    const query = 'INSERT INTO user_history (user_id, case_id, viewed_at) VALUES (?, ?, NOW())';
    db.query(query, [req.user.userId, caseId], (err, result) => {
        if (err) {
            console.error('❌ Error logging case view:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        console.log('✅ Case view logged for user:', req.user.userId);
        res.json({ message: 'Case view logged' });
    });
});

app.get('/history', verifyToken, (req, res) => {
    const query = `
        SELECT c.id, c.title, c.case_number, c.county, h.viewed_at 
        FROM user_history h 
        JOIN cases c ON h.case_id = c.id 
        WHERE h.user_id = ? 
        ORDER BY h.viewed_at DESC 
        LIMIT 10`;
    db.query(query, [req.user.userId], (err, results) => {
        if (err) {
            console.error('❌ Error fetching case history:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        console.log('✅ Case history fetched for user:', req.user.userId);
        res.json(results);
    });
});

// Enhanced Constitution Endpoint
app.get('/constitution', (req, res) => {
    const query = 'SELECT id, title, article_number, chapter, part, text FROM constitution';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching constitution:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        console.log('✅ Fetched constitution sections:', results.length);
        res.json(results);
    });
});

// Constitution Detail Endpoint
app.get('/constitution/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT id, title, article_number, chapter, part, text, details FROM constitution WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('❌ Error fetching constitution details:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (results.length === 0) return res.status(404).json({ error: 'Article not found' });
        console.log('✅ Fetched constitution detail for id:', id);
        res.json(results[0]);
    });
});

// Contact Form Submission Endpoint
app.post('/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    console.log('📩 Contact Form Submission:', { name, email, subject, message });
    // Optionally save to database (example below)
    const query = 'INSERT INTO contact_messages (name, email, subject, message, submitted_at) VALUES (?, ?, ?, ?, NOW())';
    db.query(query, [name, email, subject, message], (err, result) => {
        if (err) {
            console.error('❌ Error saving contact message:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        console.log('✅ Contact message saved, ID:', result.insertId);
        res.status(200).json({ message: 'Message received successfully' });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});