const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let room;
let myId;
let players = {};
let bullets = [];
let obstacles = [];
let started = false;

function join() {
    const name = document.getElementById("name").value;
    room = document.getElementById("room").value;

    socket.emit("joinRoom", { room, name });

    document.getElementById("menu").style.display = "none";
    document.getElementById("lobby").style.display = "block";
}

function startGame() {
    socket.emit("startGame", room);
}

socket.on("gameState", (state) => {
    players = state.players;
    bullets = state.bullets;
    obstacles = state.obstacles;
    started = state.started;
    myId = socket.id;

    updateLobby();
});

function updateLobby() {
    const list = document.getElementById("playersList");
    list.innerHTML = "";

    for (let id in players) {
        list.innerHTML += players[id].name + "<br>";
    }

    if (players[myId] && !started) {
        document.getElementById("startBtn").style.display = "block";
    }

    if (started) {
        document.getElementById("lobby").style.display = "none";
        canvas.style.display = "block";
    }
}

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    socket.emit("move", { room, x, y });
});

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        socket.emit("shoot", { room });
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Obstacles
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

        ctx.fillStyle = p.dead ? "darkred" :
                        id === myId ? "lime" : "white";

        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    requestAnimationFrame(draw);
}

draw();
