const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { validatePhone, countValidNumbers } = require('./validation');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
let db;

/* Database connection with retry logic*/
async function connectDB(retries = 10, delay = 3000) {
    while (retries > 0) {
        try {
            db = await mysql.createConnection({
                host: process.env.DB_HOST || 'db',
                user: process.env.DB_USER || 'user',
                password: process.env.DB_PASSWORD || 'pass123',
                database: process.env.DB_NAME || 'phone_db',
                port: 3306
            });

            console.log('Database connected');
            return;
        } catch (err) {
            retries--;
            console.log(`⏳ Waiting for database... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Could not connect to database');
}

/* POST /api/phone/validate*/
app.post('/api/phone/validate', (req, res) => {
    const { number } = req.body;

    if (!number) {
        return res.status(400).json({ error: 'Number is required' });
    }

    res.json(validatePhone(number));
});

/* POST /api/registration*/
app.post('/api/registration', async (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({
            status: 'denied',
            message: 'Name, email and phone are required'
        });
    }

    const result = validatePhone(phone);
    if (!result.isValid) {
        return res.status(422).json({
            status: 'denied',
            message: 'Invalid phone number'
        });
    }

    try {
        await db.execute(
            'INSERT INTO registrations (name, email, phone) VALUES (?, ?, ?)',
            [name, email, phone]
        );

        res.status(201).json({
            status: 'accepted',
            message: 'Registration successful'
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                status: 'denied',
                message: 'Phone already registered'
            });
        }

        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

/* GET /api/registrations*/
app.get('/api/registrations', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT name, email, phone, created_at FROM registrations ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

/* GET /api/phone/count*/
app.get('/api/phone/count', async (req, res) => {
    try {
        const total = countValidNumbers();
        const [rows] = await db.execute(
            'SELECT COUNT(DISTINCT phone) AS count FROM registrations'
        );

        res.json({
            totalPossibleValidNumbers: total,
            registeredValidNumbers: rows[0].count
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

/*Health check*/
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

/*Start server*/
(async () => {
    try {
        await connectDB();
        app.listen(PORT, () =>
            console.log(`API running on port ${PORT}`)
        );
    } catch (err) {
        console.error('Failed to start API:', err.message);
        process.exit(1);
    }
})();
