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

function resetRoom(room) {
    const r = rooms[room];
    r.started = false;
    r.bullets = [];
    r.obstacles = createObstacles();

    for (let id in r.players) {
        r.players[id].dead = false;
        r.players[id].x = 100 + Math.random() * 600;
        r.players[id].y = 100 + Math.random() * 400;
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
            dead: false
        };

        io.to(room).emit("gameState", rooms[room]);
    });

    socket.on("startGame", (room) => {
        if (rooms[room] && socket.id === rooms[room].host) {
            rooms[room].started = true;
            resetRoom(room);
        }
    });

    socket.on("move", ({ room, x, y }) => {
        const r = rooms[room];
        if (!r || !r.started) return;

        const p = r.players[socket.id];
        if (!p || p.dead) return;

        p.angle = Math.atan2(y - p.y, x - p.x);
        p.x = x;
        p.y = y;
    });

    socket.on("shoot", ({ room }) => {
        const r = rooms[room];
        if (!r || !r.started) return;

        const p = r.players[socket.id];
        if (!p || p.dead) return;

        r.bullets.push({
            x: p.x,
            y: p.y,
            angle: p.angle,
            owner: socket.id
        });
    });

    socket.on("disconnect", () => {
        for (let room in rooms) {
            delete rooms[room].players[socket.id];
        }
    });
});

setInterval(() => {

    for (let room in rooms) {
        const r = rooms[room];
        if (!r.started) continue;

        // Update bullets
        r.bullets.forEach(b => {
            b.x += Math.cos(b.angle) * 6;
            b.y += Math.sin(b.angle) * 6;
        });

        // Bullet collision
        r.bullets = r.bullets.filter(b => {

            // Buiten arena
            if (b.x < 0 || b.x > 800 || b.y < 0 || b.y > 600) return false;

            // Obstacle hit
            for (let o of r.obstacles) {
                if (
                    b.x > o.x &&
                    b.x < o.x + o.w &&
                    b.y > o.y &&
                    b.y < o.y + o.h
                ) return false;
            }

            // Player hit
            for (let id in r.players) {
                const p = r.players[id];
                if (id !== b.owner && !p.dead) {
                    const dist = Math.hypot(p.x - b.x, p.y - b.y);
                    if (dist < 15) {
                        p.dead = true;
                        return false;
                    }
                }
            }

            return true;
        });

        // Check win
        const alive = Object.values(r.players).filter(p => !p.dead);
        if (alive.length === 1) {
            r.started = false;

            setTimeout(() => {
                resetRoom(room);
            }, 3000);
        }

        io.to(room).emit("gameState", r);
    }

}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running"));
