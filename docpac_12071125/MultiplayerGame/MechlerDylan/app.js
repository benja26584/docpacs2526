const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const session = require('express-session')
const { createServer } = require('node:http')
const { join } = require("node:path")
const { Server } = require("socket.io")
//add encryption if necessary
const app = express();
const AUTH_URL = 'https://formbeta.yorktechapps.com'
const THIS_URL = 'http://localhost:3000/login'
const server = createServer(app);
const io = new Server(server);
var Player = { Player1: null, Player2: null }
var spellList = [
    { Name: 'Fire', Damage: 5, Weakness: 'Water' },
    { Name: "Water", Damage: 5, Weakness: 'Lightning' },
    { Name: "Lightning", Damage: 5, Weakness: 'Earth' },
    { Name: "Earth", Damage: 5, Weakness: 'Air' },
    { Name: "Air", Damage: 5, Weakness: 'Fire' }
]
var Rooms = []  //Change player stats to be in here and join/create rooms based on index
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database('./data/templatedatabase.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});

app.set('view engine', 'ejs');

const middleWare = session({
    secret: 'secretString',
    resave: false,
    saveUninitialized: false
})

app.use(middleWare);

io.use((socket, next) => {
    middleWare(socket.request, {}, next)
})

function isAuthenticated(req, res, next) {
    if (req.session.user) next()
    else res.redirect(`/login?redirectURL=${THIS_URL}`);
};

function findRoom(user) {
    var roomAndUser = 0
    var roomMade = false
    for (let i = 0; (i <= Rooms.length) && (!roomMade); i++) {
        if (i < Rooms.length) {
            if (Rooms[i].Player1 == null) {
                Rooms[i].Player1 = user
                roomAndUser = (1 + 0.1)
                console.log("1: " + roomAndUser)
                roomMade = true
            } else if (Rooms[i].Player2 == null) {
                Rooms[i].Player2 = user
                roomAndUser = (1 + 0.2)
                console.log("2: " + roomAndUser)
                roomMade = true
            }
        } else if (i == Rooms.length) {
            createRoom(i)
            roomMade = true
            Rooms[i].Player1 = user
            startGame(i)
            roomAndUser = (1 + 0.1)
            console.log("3: " + roomAndUser)
            console.log(i)
        }
    };
    console.log("4: " + roomAndUser)
    return roomAndUser
};

function createRoom(room) {
    Rooms.push({
        Player1: null,
        Player2: null,
        roomNum: room.toString(),
        Player1Health: 100,
        Player2Health: 100,
        turn: 1,
        Player1Spell: null,
        Player2Spell: null,
        roundState: "going"
    })
}

function startGame(room) {
    Rooms[room].Player1Health = 100
    Rooms[room].Player2Health = 100
    Rooms[room].turn = 1
    Rooms[room].Player1Spell = null
    Rooms[room].Player2Spell = null
    Rooms[room].roundState = "going"
};

function spellCast(spell) {
    if (Player.turn == 1) {
        Player.Player1Spell = spell
        console.log(Player.Player1Spell)
        console.log(spellList[Player.Player1Spell])
        Player.turn += 1
        console.log('Turn', Player.turn)
    } else if (Player.turn == 2) {
        Player.Player2Spell = spell
        console.log(Player.Player2Spell)
        console.log(spellList[Player.Player2Spell])
        if (spellList[Player.Player1Spell].Weakness == spellList[Player.Player2Spell].Name) {
            Player.Player1Health -= ((spellList[Player.Player2Spell].Damage) * 2)
        } else if (spellList[Player.Player2Spell].Weakness == spellList[Player.Player1Spell].Name) {
            Player.Player2Health -= ((spellList[Player.Player1Spell].Damage) * 2)
        } else {
            Player.Player1Health -= (spellList[Player.Player2Spell].Damage)
            Player.Player2Health -= (spellList[Player.Player1Spell].Damage)
        }
        Player.turn -= 1
        Player.roundState = "over"
    }
    console.log(Player.Player1Health)
    console.log(Player.Player2Health)
    if (Player.Player1Spell == null) {
        console.log("P1 Spell is null")
    } else {
        Player.Player1Spell = spellList[Player.Player1Spell].Name
    }
    if (Player.Player2Spell == null) {
        console.log("p2 Spell is null")
    } else {
        Player.Player2Spell = spellList[Player.Player2Spell].Name
    }
};

function spellToIndex() {
    if (Player.Player1Spell == "Fire") {
        Player.Player1Spell = 0
    } else if (Player.Player1Spell == "Water") {
        Player.Player1Spell = 1
    } else if (Player.Player1Spell == "Lightning") {
        Player.Player1Spell = 2
    } else if (Player.Player1Spell == "Earth") {
        Player.Player1Spell = 3
    } else if (Player.Player1Spell == "Air") {
        Player.Player1Spell = 4
    }
    if (Player.Player2Spell == "Fire") {
        Player.Player2Spell = 0
    } else if (Player.Player2Spell == "Water") {
        Player.Player2Spell = 1
    } else if (Player.Player2Spell == "Lightning") {
        Player.Player2Spell = 2
    } else if (Player.Player2Spell == "Earth") {
        Player.Player2Spell = 3
    } else if (Player.Player2Spell == "Air") {
        Player.Player2Spell = 4
    }
};

app.get('/', isAuthenticated, (req, res) => {
    res.render('index', { user: req.session.user });
});

app.get('/game', (req, res) => {
    res.render('game.ejs')
});

app.get('/login', (req, res) => {
    if (req.query.token) {
        let tokenData = jwt.decode(req.query.token)
        req.session.token = tokenData
        req.session.user = tokenData.displayName
        res.redirect('/')
    } else {
        res.redirect(`${AUTH_URL}/oauth?redirectURL=${THIS_URL}`)
    }
});

io.on('connection', (socket) => {
    var data = socket.request.session;
    const user = data.user
    const id = socket.id
    console.log("User Connected: ", user);
    var findRoomData = findRoom(id);
    console.log("Room Data: " + findRoomData)
    var room = Math.floor(findRoomData)
    console.log("Room: " + room)
    var userNum = (Math.round((findRoomData - room)*10))
    console.log("User: " + userNum)
    console.log("Makes No Sense 1: " + ((1.1-1)*10))
    console.log("Makes No Sense 2: " + ((1.2-1)*10))
    room = room.toString()
    console.log("Room: " + room)
    socket.join("room");
    io.emit('connected', userNum, room);
    io.to("room").emit('playerJoined', Player);
    socket.on('playState', (playState) => {
        console.log(playState)
        if (playState) {
            io.emit('playable')
        }
    });
    socket.on('spell', (spell) => {
        console.log(user)
        spellCast(spell)
        io.emit('gameUpdate', Player)
        spellToIndex();
        if (Player.roundState == "over") {
            Player.roundState = "going"
        }

    });
    socket.on('disconnect', () => {
        console.log("User Disconnected: ", user)
        startGame();
        io.emit('opponent left')
    });

    socket.on('reload', () => {
        socket.leave("room");
        Player.Player1 = null
        Player.Player2 = null
        socket.emit('redirect', '/');
        console.log(Player)
    });
});



server.listen(3000, () => {
    console.log("Started HTTP Server on port 3000");
});