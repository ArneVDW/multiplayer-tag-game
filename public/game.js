const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let room;
let players = {};
let myId;
let x = 100;
let y = 100;

function join() {
    const name = document.getElementById("name").value;
    room = document.getElementById("room").value;

    socket.emit("joinRoom", { room, name });

    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
}

socket.on("updatePlayers", (data) => {
    players = data.players;
    myId = socket.id;

    updateScoreboard(players);
    draw(data.it);
});

function updateScoreboard(players) {
    const sb = document.getElementById("scoreboard");
    sb.innerHTML = "<h3>Scoreboard (Time as IT)</h3>";

    for (let id in players) {
        sb.innerHTML += `${players[id].name}: ${players[id].score}s<br>`;
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key === "w") y -= 5;
    if (e.key === "s") y += 5;
    if (e.key === "a") x -= 5;
    if (e.key === "d") x += 5;

    socket.emit("move", { room, x, y });
});

function moveDir(dir) {
    if (dir === "up") y -= 5;
    if (dir === "down") y += 5;
    if (dir === "left") x -= 5;
    if (dir === "right") x += 5;

    socket.emit("move", { room, x, y });
}

function draw(itPlayer) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let id in players) {
        let p = players[id];

        ctx.fillStyle = id === itPlayer ? "red" : "white";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillText(p.name, p.x - 15, p.y - 20);
    }
}
