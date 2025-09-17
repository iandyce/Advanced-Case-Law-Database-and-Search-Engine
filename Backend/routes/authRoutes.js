const { authenticateUser, authorizeRoles } = require('./authMiddleware');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('./db'); // Import database connection

const router = express.Router();

// ✅ User Registration Route
// In authRoutes.js, update register route for more logging (around line 20)
router.post('/register', [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
    console.log('Received registration request');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;
    console.log('Registration attempt for:', email);

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userRole = role || 'user';

        const query = `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`;
        db.query(query, [username, email, hashedPassword, userRole], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.error('❌ Error: Email already exists:', email);
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                console.error('❌ Error registering user:', err);
                console.error('SQL Message:', err.sqlMessage);
                return res.status(500).json({ 
                    error: 'Internal Server Error',
                    details: err.message,
                    sqlMessage: err.sqlMessage
                });
            }
            console.log('✅ User registered successfully:', email);
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (err) {
        console.error('❌ Registration Error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

// ✅ User Login Route
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const query = `SELECT id, name, email, password_hash, role FROM users WHERE email = ?`;
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('❌ Database error:', err);
                console.error('SQL Message:', err.sqlMessage);
                return res.status(500).json({ 
                    error: 'Internal Server Error',
                    details: err.message,
                    sqlMessage: err.sqlMessage
                });
            }
            if (results.length === 0) {
                console.log('❌ No user found for email:', email);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = results[0];

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                console.log("❌ Password mismatch");
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token with role included
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            console.log('✅ Login successful for user:', email);
            res.json({ message: 'Login successful', token });
        });
    } catch (err) {
        console.error('❌ Login Error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

// ✅ Add Case Route (Admin Only)
router.post('/cases', authenticateUser, authorizeRoles('admin'), [
    body('case_title').notEmpty().withMessage('Case title is required'),
    body('case_number').notEmpty().withMessage('Case number is required'),
    body('court_name').optional().isString().withMessage('Invalid court name'),
    body('date_filed').optional().isDate().withMessage('Invalid date filed'),
    body('date_decided').optional().isDate().withMessage('Invalid date decided'),
    body('judge_id').optional().isInt().withMessage('Invalid judge ID'),
    body('legal_topic_id').optional().isInt().withMessage('Invalid legal topic ID'),
    body('region').optional().isString().withMessage('Invalid region'),
    body('county').optional().isString().withMessage('Invalid county'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { case_title, case_number, court_name, date_filed, date_decided, judge_id, legal_topic_id, region, county } = req.body;

    try {
        const query = `INSERT INTO cases (case_title, case_number, court_name, date_filed, date_decided, judge_id, legal_topic_id, region, county) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(query, [case_title, case_number, court_name, date_filed, date_decided, judge_id, legal_topic_id, region, county], (err, result) => {
            if (err) {
                console.error('❌ Error adding case:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.status(201).json({ message: 'Case added successfully', caseId: result.insertId });
        });

    } catch (err) {
        console.error('❌ Error adding case:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ✅ Update Case Route (Admin Only)
router.put('/cases/:id', authenticateUser, authorizeRoles('admin'), [
    body('case_title').optional().notEmpty().withMessage('Case title is required'),
    body('case_number').optional().notEmpty().withMessage('Case number is required'),
    body('court_name').optional().isString().withMessage('Invalid court name'),
    body('date_filed').optional().isDate().withMessage('Invalid date filed'),
    body('date_decided').optional().isDate().withMessage('Invalid date decided'),
    body('judge_id').optional().isInt().withMessage('Invalid judge ID'),
    body('legal_topic_id').optional().isInt().withMessage('Invalid legal topic ID'),
    body('region').optional().isString().withMessage('Invalid region'),
    body('county').optional().isString().withMessage('Invalid county'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const caseId = req.params.id;
    const { case_title, case_number, court_name, date_filed, date_decided, judge_id, legal_topic_id, region, county } = req.body;

    try {
        const query = `UPDATE cases SET case_title = ?, case_number = ?, court_name = ?, date_filed = ?, date_decided = ?, judge_id = ?, legal_topic_id = ?, region = ?, county = ? WHERE case_id = ?`;
        db.query(query, [case_title, case_number, court_name, date_filed, date_decided, judge_id, legal_topic_id, region, county, caseId], (err, result) => {
            if (err) {
                console.error('❌ Error updating case:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Case not found' });
            }
            res.json({ message: 'Case updated successfully' });
        });

    } catch (err) {
        console.error('❌ Error updating case:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ✅ Delete Case Route (Admin Only)
router.delete('/cases/:id', authenticateUser, authorizeRoles('admin'), async (req, res) => {
    const caseId = req.params.id;

    try {
        const query = `DELETE FROM cases WHERE case_id = ?`;
        db.query(query, [caseId], (err, result) => {
            if (err) {
                console.error('❌ Error deleting case:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Case not found' });
            }
            res.json({ message: 'Case deleted successfully' });
        });

    } catch (err) {
        console.error('❌ Error deleting case:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ✅ Export the router
module.exports = router;
