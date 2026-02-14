// game.js - COMPLETE VERSION WITH MOUSE FOLLOW + SHOOTING + BULLETS + RELOAD
// This file assumes you already included socket.io in index.html

const socket = io();

// =============================
// Canvas setup
// =============================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =============================
// Game state
// =============================
let myId = null;
let roomState = null;
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
let reloadProgress = 0;

// =============================
// Mouse tracking
// =============================
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

// =============================
// Shooting
// =============================
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        socket.emit("shoot", {
            mouseX: mouse.x,
            mouseY: mouse.y
        });
    }
});

// =============================
// Receive init
// =============================
socket.on("init", (data) => {
    myId = data.id;
});

// =============================
// Receive room state
// =============================
socket.on("roomState", (state) => {
    roomState = state;

    // send mouse position continuously
    if (myId && roomState.players[myId]) {
        socket.emit("playerMove", {
            mouseX: mouse.x,
            mouseY: mouse.y
        });

        reloadProgress = roomState.players[myId].reload || 0;
    }
});

// =============================
// Drawing
// =============================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!roomState) {
        requestAnimationFrame(draw);
        return;
    }

    // draw obstacles
    ctx.fillStyle = "#444";
    for (let obs of roomState.obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }

    // draw bullets
    ctx.fillStyle = "yellow";
    for (let bullet of roomState.bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // draw players
    for (let id in roomState.players) {
        const p = roomState.players[id];

        // body
        ctx.fillStyle = id === myId ? "cyan" : "red";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // gun
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(p.angle) * 30,
                   p.y + Math.sin(p.angle) * 30);
        ctx.stroke();

        // name
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p.name, p.x, p.y - 25);
    }

    // reload bar
    if (roomState.players[myId]) {
        const reload = roomState.players[myId].reload || 0;

        ctx.fillStyle = "black";
        ctx.fillRect(canvas.width/2 - 100, canvas.height - 40, 200, 20);

        ctx.fillStyle = "lime";
        ctx.fillRect(canvas.width/2 - 100, canvas.height - 40, reload * 200, 20);

        ctx.strokeStyle = "white";
        ctx.strokeRect(canvas.width/2 - 100, canvas.height - 40, 200, 20);
    }

    requestAnimationFrame(draw);
}

draw();
