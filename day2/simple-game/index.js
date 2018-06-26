var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));

const GLOBAL_WIDTH = 2000;
const GLOBAL_HEIGHT = 1000;

const state = {
    players: [],
    enemies: [],
    coins: []
};

function reset() {
    const { players, enemies, coins } = state;

    players.forEach(player => {
        player.x = Math.random() * GLOBAL_WIDTH
        player.y = Math.random() * GLOBAL_HEIGHT
        player.score = 0
        player.dead = false;
    })

    for (let i = 0; i < 10; ++i) {
        enemies.push({
            x: Math.random() * GLOBAL_WIDTH,
            y: Math.random() * GLOBAL_HEIGHT,
            vx: Math.random() * 15 * (Math.random() > 0.5 ? 1 : -1),
            vy: Math.random() * 15 * (Math.random() > 0.5 ? 1 : -1),
            size: Math.random() * 50 + 50
        });
    }

    for (let i = 0; i < 10; ++i) {
        coins.push({
            x: Math.random() * GLOBAL_WIDTH,
            y: Math.random() * GLOBAL_HEIGHT,
            vx: Math.random() * 15 * (Math.random() > 0.5 ? 1 : -1),
            vy: Math.random() * 15 * (Math.random() > 0.5 ? 1 : -1),
            size: 50
        });
    }
}

reset();

function logic() {
    setTimeout(logic, 20);

    const { players, enemies, coins } = state;

    enemies.forEach(enemy => {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        if (enemy.x > GLOBAL_WIDTH || enemy.x < 0) enemy.vx *= -1;
        if (enemy.y > GLOBAL_HEIGHT || enemy.y < 0) enemy.vy *= -1;
    });

    const speed = 10;

    players.forEach(player => {
        if (player.dead) return

        const { keyboard } = player
        if (keyboard.left) player.x -= speed;
        if (keyboard.right) player.x += speed;
        if (keyboard.up) player.y -= speed;
        if (keyboard.down) player.y += speed;

        enemies.forEach(enemy => {
            if (intersect(player, enemy)) player.dead = true;
        });

        if(!players.find(player => !player.dead)) reset();

        coins.forEach((coin, index, array) => {
            if (intersect(player, coin)) {
                player.score += 10;
                array.splice(index, 1);
                array.push({
                    x: Math.random() * GLOBAL_WIDTH,
                    y: Math.random() * GLOBAL_HEIGHT,
                    size: 50
                });
            }
        });

    });

    io.sockets.emit('state', state)
}

logic();

function intersect(player, enemy) {
    return (Math.abs(player.x - enemy.x) * 2 < (player.size / 2 + enemy.size / 2)) &&
        (Math.abs(player.y - enemy.y) * 2 < (player.size / 2 + enemy.size / 2));
}

io.on('connection', socket => {
    const player = {
        x: Math.random() * GLOBAL_WIDTH,
        y: Math.random() * GLOBAL_HEIGHT,
        size: 20,
        score: 0,
        keyboard: {},
        id: socket.id
    };
    state.players.push(player);
    socket.on('input', function (keyboard) {
        player.keyboard = keyboard;
    });
});