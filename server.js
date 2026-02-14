const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {};

function createObstacles() {
    return [
        { x: 300, y: 150, w: 200, h: 30 },
        { x: 150, y: 350, w: 300, h: 30 },
        { x: 600, y: 250, w: 30, h: 200 }
    ];
}

function getPlayerRoom(socket) {
    for (let room in rooms) {
        if (rooms[room].players[socket.id]) {
            return rooms[room];
        }
    }
    return null;
}

function resetRoom(roomName) {
    const r = rooms[roomName];
    if (!r) return;

    r.bullets = [];
    r.obstacles = createObstacles();
    r.started = true;

    for (let id in r.players) {
        r.players[id].dead = false;
        r.players[id].reload = 1;
        r.players[id].x = 100 + Math.random() * 600;
        r.players[id].y = 100 + Math.random() * 400;
        r.players[id].angle = 0;
    }
}

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
            dead: false,
            reload: 1
        };

        io.to(room).emit("gameState", rooms[room]);
    });

    socket.on("startGame", (room) => {

        if (rooms[room] && socket.id === rooms[room].host) {

            resetRoom(room);

            io.to(room).emit("gameState", rooms[room]);
        }

    });

    socket.on("playerMove", ({ mouseX, mouseY }) => {

        const room = getPlayerRoom(socket);
        if (!room) return;

        const player = room.players[socket.id];
        if (!player || player.dead) return;

        const dx = mouseX - player.x;
        const dy = mouseY - player.y;

        const angle = Math.atan2(dy, dx);

        player.angle = angle;

        const speed = 3;

        player.x += Math.cos(angle) * speed;
        player.y += Math.sin(angle) * speed;

    });

    socket.on("shoot", ({ mouseX, mouseY }) => {

        const room = getPlayerRoom(socket);
        if (!room) return;

        const player = room.players[socket.id];
        if (!player || player.dead) return;

        if (player.reload < 1) return;

        player.reload = 0;

        const angle = Math.atan2(mouseY - player.y, mouseX - player.x);

        room.bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 10,
            vy: Math.sin(angle) * 10,
            owner: socket.id
        });

    });

    socket.on("disconnect", () => {

        for (let room in rooms) {

            if (rooms[room].players[socket.id]) {

                delete rooms[room].players[socket.id];

                io.to(room).emit("gameState", rooms[room]);

            }

        }

    });

});


// GAME LOOP (60 FPS)
setInterval(() => {

    for (let roomName in rooms) {

        const room = rooms[roomName];

        if (!room.started) continue;

        // reload
        for (let id in room.players) {

            const p = room.players[id];

            if (p.reload < 1)
                p.reload += 0.02;

        }

        // bullets move
        for (let i = room.bullets.length - 1; i >= 0; i--) {

            const b = room.bullets[i];

            b.x += b.vx;
            b.y += b.vy;

            // collision with players
            for (let id in room.players) {

                if (id === b.owner) continue;

                const p = room.players[id];

                if (p.dead) continue;

                const dx = p.x - b.x;
                const dy = p.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 15) {

                    p.dead = true;

                    room.bullets.splice(i, 1);

                    break;
                }
            }

            // remove if outside map
            if (b.x < 0 || b.x > 800 || b.y < 0 || b.y > 600) {

                room.bullets.splice(i, 1);

            }

        }

        io.to(roomName).emit("gameState", room);

    }

}, 1000 / 60);


const PORT = process.env.PORT || 3000;

server.listen(PORT, () =>
    console.log("Server running on", PORT)
);
