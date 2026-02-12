const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let room;
let players = {};
let myId;
let x = 100;
let y = 100;

// Voor smooth movement
let lerpX = {};
let lerpY = {};

// Join functie
function join() {
    const name = document.getElementById("name").value;
    room = document.getElementById("room").value;

    socket.emit("joinRoom", { room, name });

    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
}

// Update spelers en drawen
socket.on("updatePlayers", (data) => {
    players = data.players;
    myId = socket.id;

    updateScoreboard(players);
    draw(data.it);
});

// Scoreboard
function updateScoreboard(players) {
    const sb = document.getElementById("scoreboard");
    sb.innerHTML = "<h3>Scoreboard (Time as IT)</h3>";

    for (let id in players) {
        sb.innerHTML += `${players[id].name}: ${players[id].score}s<br>`;
    }
}

// Keyboard controls
document.addEventListener("keydown", (e) => {
    if (e.key === "w") move("up");
    if (e.key === "s") move("down");
    if (e.key === "a") move("left");
    if (e.key === "d") move("right");
});

// Touch controls
function moveDir(dir) {
    move(dir);
}

// Beweging + arena boundaries
function move(dir) {
    if (dir === "up") y -= 5;
    if (dir === "down") y += 5;
    if (dir === "left") x -= 5;
    if (dir === "right") x += 5;

    // Arena boundaries (houd binnen canvas)
    x = Math.max(15, Math.min(canvas.width - 15, x));
    y = Math.max(15, Math.min(canvas.height - 15, y));

    socket.emit("move", { room, x, y });
}

// Draw alles
function draw(itPlayer) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Teken arena muren
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    for (let id in players) {
        let p = players[id];

        // Init lerp
        if (!lerpX[id]) lerpX[id] = p.x;
        if (!lerpY[id]) lerpY[id] = p.y;

        // Smooth movement
        lerpX[id] += (p.x - lerpX[id]) * 0.2;
        lerpY[id] += (p.y - lerpY[id]) * 0.2;

        ctx.fillStyle = id === itPlayer ? "red" : "white";
        ctx.beginPath();
        ctx.arc(lerpX[id], lerpY[id], 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillText(p.name, lerpX[id] - 15, lerpY[id] - 20);
    }

    requestAnimationFrame(() => draw(itPlayer));
}
