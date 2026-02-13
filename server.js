const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {};

// Interval voor score update
setInterval(() => {
    for (let room in rooms) {
        const r = rooms[room];
        if (r.started && r.it && r.players[r.it]) {
            r.players[r.it].score += 1; // +1 seconde IT
        }
        io.to(room).emit("updatePlayers", r);
    }
}, 1000);

io.on("connection", (socket) => {

    socket.on("joinRoom", ({ room, name }) => {

    socket.join(room);

    if (!rooms[room]) {
        rooms[room] = {
            players: {},
            bullets: [],
            obstacles: createObstacles(),
            started: false,
            host: socket.id
        };
    }

    rooms[room].players[socket.id] = {
        id: socket.id,
        name,
        x: 200,
        y: 200,
        angle: 0,
        dead: false
    };

    io.to(room).emit("gameState", rooms[room]);
});


    socket.on("startGame", (room) => {
    if (rooms[room] && socket.id === rooms[room].host) {
        rooms[room].started = true;
        resetRoom(room);

        // 🔥 STUUR DIRECT NIEUWE STATE
        io.to(room).emit("gameState", rooms[room]);
    }
});

    socket.on("move", ({ room, x, y }) => {
        if (!rooms[room] || !rooms[room].started) return;

        let r = rooms[room];
        let player = r.players[socket.id];
        if (!player) return;

        player.x = x;
        player.y = y;

        if (r.it === socket.id) {
            for (let id in r.players) {
                if (id !== socket.id) {
                    let p2 = r.players[id];
                    let dist = Math.hypot(player.x - p2.x, player.y - p2.y);
                    if (dist < 30) {
                        r.it = id;
                    }
                }
            }
        }

        io.to(room).emit("updatePlayers", r);
    });

    socket.on("disconnect", () => {
        for (let room in rooms) {
            if (rooms[room].players[socket.id]) {
                delete rooms[room].players[socket.id];
                io.to(room).emit("updatePlayers", rooms[room]);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
