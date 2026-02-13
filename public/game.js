const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let room;
let myId;
let players = {};
let bullets = [];
let obstacles = [];
let mouseX = 0;
let mouseY = 0;

let reloadTime = 1000; // 1 seconde
let lastShot = 0;

function join() {
    const name = document.getElementById("name").value;
    room = document.getElementById("room").value;

    socket.emit("joinRoom", { room, name });

    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
}

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") shoot();
});

function shoot() {
    const now = Date.now();
    if (now - lastShot < reloadTime) return;

    lastShot = now;
    socket.emit("shoot", { room });
}

socket.on("gameState", (state) => {
    players = state.players;
    bullets = state.bullets;
    obstacles = state.obstacles;
    myId = socket.id;
});

function update() {
    if (players[myId] && !players[myId].dead) {
        const p = players[myId];

        const angle = Math.atan2(mouseY - p.y, mouseX - p.x);
        const speed = 3;

        const newX = p.x + Math.cos(angle) * speed;
        const newY = p.y + Math.sin(angle) * speed;

        socket.emit("move", { room, x: newX, y: newY });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Obstakels
    ctx.fillStyle = "gray";
    obstacles.forEach(o => {
        ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Bullets
    ctx.fillStyle = "yellow";
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Players
    for (let id in players) {
        const p = players[id];

        if (p.dead) {
            ctx.fillStyle = "darkred";
        } else {
            ctx.fillStyle = id === myId ? "lime" : "white";
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Gun direction
        if (!p.dead) {
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(
                p.x + Math.cos(p.angle) * 25,
                p.y + Math.sin(p.angle) * 25
            );
            ctx.stroke();
        }
    }

    drawReloadBar();
}

function drawReloadBar() {
    const now = Date.now();
    const progress = Math.min((now - lastShot) / reloadTime, 1);

    ctx.fillStyle = "black";
    ctx.fillRect(20, canvas.height - 30, 200, 15);

    ctx.fillStyle = "lime";
    ctx.fillRect(20, canvas.height - 30, 200 * progress, 15);

    ctx.strokeStyle = "white";
    ctx.strokeRect(20, canvas.height - 30, 200, 15);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
