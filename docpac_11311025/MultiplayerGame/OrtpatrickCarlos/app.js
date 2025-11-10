// Imports
require('dotenv').config();
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const SQLiteStore = require('connect-sqlite3')(session);
const http = require('http');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const server = http.createServer(app);
const io = new Server(server);
const path = require('path');
const TicTacToe = require('./scripts/ttt').TicTacToe;




//database setup
const db = new sqlite3.Database('./db/venture.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the database.');
    }
});

//Constants
const port = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'your_secret_key';
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:420/oauth';
const THIS_URL = process.env.THIS_URL || `http://localhost:${port}`;
const API_KEY = process.env.API_KEY || 'your_api_key';

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static(path.join(__dirname, 'shared')))

app.use(session({
    store: new SQLiteStore({db : 'sessions.db', dir: './db'}),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

function isAuthenticated(req, res, next) {
    if (req.session.user) next();
    else res.redirect('/login');
};

// Routes
app.get('/', isAuthenticated, (req, res) => {
    res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
    if (req.query.token) {
         let tokenData = jwt.decode(req.query.token);
         req.session.token = tokenData;
         req.session.user = tokenData.displayName;

        //save user to database if not exists
        db.run (`INSERT OR IGNORE INTO users (username) VALUES (?)`, [tokenData.displayName], function(err) {
            if (err) {
                return console.log(err.message);
            }
            console.log(`User ${tokenData.displayName} saved to database.`);
        });

         res.redirect('/');

    } else {
         res.redirect(`${AUTH_URL}/oauth?redirectURL=${THIS_URL}`);
    };
});

app.get('/ttt', isAuthenticated, (req, res) => {
    res.render('ttt', { user: req.session.user });
});



app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});


// Socket.io client setup
const socket = ioClient(AUTH_URL, {
    extraHeaders: {
        api: API_KEY
    }
});

let players = [];
let currentGame = new TicTacToe();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Assign player symbols (X or O)
    if (players.length < 2) {
        const symbol = players.length === 0 ? 'X' : 'O';
        players.push({ id: socket.id, symbol });
        socket.emit('assignSymbol', symbol);
    } else {
        socket.emit('gameFull');
    }

    // Handle move events
    socket.on('makeMove', (data) => {
        const player = players.find(p => p.id === socket.id);
        if (player && player.symbol === currentGame.currentPlayer) {
            currentGame.makeMove(data.row, data.col);
            io.emit('updateGame', {
                board: currentGame.board,
                currentPlayer: currentGame.currentPlayer,
                winner: currentGame.winner
            });
        }
    });

    // Handle reset game
    socket.on('resetGame', () => {
        currentGame.reset(); // Reset the game state
        io.emit('updateGame', {
            board: currentGame.board,
            currentPlayer: currentGame.currentPlayer,
            winner: null // No winner after reset
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        players = players.filter(p => p.id !== socket.id);
        if (players.length === 0) {
            currentGame.reset();
        }
    });
    // Handle game full notification
    socket.on('gameFull', () => {
        statusDiv.textContent = 'Game is full. Please wait for a player to leave.';
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});