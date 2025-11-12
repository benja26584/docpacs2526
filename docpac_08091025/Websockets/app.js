const express = require('express');
const path = require('path');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const ejs = require('ejs');


const app = express();
const port = process.env.PORT || 3000;

const AUTH_URL = process.env.FORMBAR_URL || 'https://formbeta.yorktechapps.com';
const THIS_URL = process.env.THIS_URL || `http://localhost:${port}/login`;
const API_KEY = process.env.FORMBAR_API_KEY || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace_this_with_env_secret';

const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);

const onlineUsers = new Map();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

const db = new sqlite3.Database(path.join(__dirname, 'formbar.db'), (err) => {
  if (err) return console.error('DB open error:', err);
  console.log('Connected to SQLite DB');
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    fb_name TEXT,
    fb_id TEXT UNIQUE
  )
`, (err) => {
  if (err) console.error('Error creating users table:', err);
});

function extractNameAndIdFromToken(tokenData) {
  const name = tokenData.displayName || tokenData.name || tokenData.username || tokenData.fb_name || '';
  const id = tokenData.id || tokenData.sub || tokenData.userId || tokenData.fb_id || '';
  return { name, id };
}

function isAuthenticated(req, res, next) {
  if (req.session.user && req.session.user.fb_id) {
    next();
  } else {
    res.redirect(`/login`);
  }
}


app.get('/', isAuthenticated, (req, res) => {
  const apiUrl = `${AUTH_URL}/api/me`;

  if (API_KEY) {
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'API': API_KEY,
        'Content-Type': 'application/json'
      }
    })
    .then(r => r.json())
    .then(remoteUser => {
      res.render('chat', { user: req.session.user, remoteUser });
    })
    .catch(err => {
      console.warn('Failed to fetch /api/me:', err);
      res.render('chat', { user: req.session.user, remoteUser: null });
    });
  } else {
    res.render('chat', { user: req.session.user, remoteUser: null });
  }
});

app.get('/login', (req, res) => {
  if (req.query.token) {
    try {
      const tokenData = jwt.decode(req.query.token) || {};
      const { name, id } = extractNameAndIdFromToken(tokenData);

      if (!id) {
        return res.status(400).send('Token did not include a usable user id.');
      }

      req.session.token = tokenData;
      req.session.user = { fb_name: name, fb_id: id };

      db.get('SELECT * FROM users WHERE fb_id = ?', [id], (err, row) => {
        if (err) {
          console.error('DB select error:', err);
          return res.redirect('/');
        }
        if (!row) {
          db.run('INSERT INTO users (fb_name, fb_id) VALUES (?, ?)', [name, id], (err2) => {
            if (err2) console.error('DB insert error:', err2);
            return res.redirect('/chat');
          });
        } else {
          return res.redirect('/chat');
        }
      });
    } catch (err) {
      console.error('Error decoding token', err);
      return res.status(400).send('Invalid token');
    }
  } else {
    const redirect = `${AUTH_URL}/oauth?redirectURL=${encodeURIComponent(THIS_URL)}`;
    return res.redirect(redirect);
  }
});

app.get('/chat', isAuthenticated, (req, res) => {
  const { fb_name, fb_id } = req.session.user;
  res.render('chat', {
    fb_name: req.session.user.fb_name,
    fb_id: req.session.user.fb_id
    });
});



http.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});

io.on('connection', (socket) => {

    socket.on('user_online', (user) => {
        if (user && user.fb_id) {
            onlineUsers.set(user.fb_id, { socketId: socket.id, fb_name: user.fb_name });
            io.emit('online_users', Array.from(onlineUsers.values()));
            console.log(`User ${user.fb_name} (${user.fb_id}) is online`);
        }
    });

    socket.on('disconnect', () => {
        for (let [fb_id, info] of onlineUsers.entries()) {
            if (info.socketId === socket.id) {
                onlineUsers.delete(fb_id);
                io.emit('online_users', Array.from(onlineUsers.values()));
                console.log(`User ${info.fb_name} (${fb_id}) disconnected`);
                break;
            }
        }
        io.emit('online_users', Array.from(onlineUsers.values()));
    });
    socket.on('chatMessage', (msg) => {
      console.log('message: ' + msg);
        io.emit('chatMessage', msg);
    });

});