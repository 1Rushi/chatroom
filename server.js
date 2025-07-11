const path = require('path');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());

// Change your MySQL credentials and DB name if needed
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // 👈 your MySQL username
  password: 'Rashti@123',          // 👈 your MySQL password (keep empty if no password)
  database: 'chat_app'   // 👈 make sure this matches your DB
});

db.connect(err => {
  if (err) throw err;
  console.log('✅ MySQL Connected...');
});

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error' });

    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
      if (err) return res.status(500).json({ message: 'Insert error' });

      res.json({ message: 'User registered successfully' });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error' });

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ token: 'dummy-token', username });
  });
});

app.listen(3000, () => {
  console.log('🚀 Server started on http://localhost:3000');
});


// Save a new message
app.post('/api/messages', (req, res) => {
  const { sender, room, content } = req.body;

  db.query(
    'INSERT INTO messages (sender, room, content) VALUES (?, ?, ?)',
    [sender, room, content],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error saving message' });
      res.json({ message: 'Message saved' });
    }
  );
});

// Get all messages for a room
app.get('/api/messages/:room', (req, res) => {
  const room = req.params.room;

  db.query(
    'SELECT * FROM messages WHERE room = ? ORDER BY timestamp ASC',
    [room],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Error fetching messages' });
      res.json(results);
    }
  );
});

