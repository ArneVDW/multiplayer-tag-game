// game.js - FIXED VERSION THAT MATCHES YOUR server.js

const socket = io();

// =============================
// Canvas setup
// =============================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// =============================
// Game state
// =============================
let myId = null;
let state = null;

let mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

// =============================
// Track mouse
// =============================
canvas.addEventListener("mousemove", (e) => {

    const rect = canvas.getBoundingClientRect();

    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    // send movement to server
    socket.emit("playerMove", {
        mouseX: mouse.x,
        mouseY: mouse.y
    });

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
// Receive game state (THIS MATCHES server.js)
// =============================
socket.on("gameState", (roomState) => {

    state = roomState;
    myId = socket.id;

});

// =============================
// Draw everything
// =============================
function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!state) {
        requestAnimationFrame(draw);
        return;
    }

    // Obstacles
    ctx.fillStyle = "#444";

    for (let obs of state.obstacles) {

        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

    }

    // Bullets
    ctx.fillStyle = "yellow";

    for (let bullet of state.bullets) {

        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();

    }

    // Players
    for (let id in state.players) {

        const p = state.players[id];

        if (p.dead) continue;

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
        ctx.lineTo(
            p.x + Math.cos(p.angle) * 30,
            p.y + Math.sin(p.angle) * 30
        );
        ctx.stroke();

        // name
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p.name, p.x, p.y - 25);

    }

    // Reload bar
    if (state.players[myId]) {

        const reload = state.players[myId].reload || 0;

        ctx.fillStyle = "black";
        ctx.fillRect(300, 560, 200, 20);

        ctx.fillStyle = "lime";
        ctx.fillRect(300, 560, reload * 200, 20);

        ctx.strokeStyle = "white";
        ctx.strokeRect(300, 560, 200, 20);

    }

    requestAnimationFrame(draw);

}

draw();
