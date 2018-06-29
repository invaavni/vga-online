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

const GLOBAL_WIDTH = 1500;
const GLOBAL_HEIGHT = 1000;
const sprites = ['att5.png', 'F5S2.png', 'smallorange.png', 'wship-4.png'];
const speed = 10;
let state = {
    players: [],
    observers: [],
    shoots: [],
    enemy: {},
    asteroids: []
};

function reset() {
    state.enemy = {
        sprite: 'topdownfighter.png',
        vy: 5,
        x: GLOBAL_WIDTH - 150,
        y: GLOBAL_HEIGHT / 2,
        sizeX: 300,
        sizeY: 150,
        cd: 0,
        cd_mov: 0,
        asteroid: 5000,
        dir: 1,
        life: 500
    }
}

reset();

function logic() {
    setTimeout(logic, 20);

    let { players, shoots, enemy, observers, asteroids } = state;

    if (!enemy.dead && enemy.cd_mov === 0) {
        enemy.cd_mov = 500;
        let enemyHeightPercentage = enemy.y / GLOBAL_HEIGHT;
        let random = Math.random();
        if (random >= enemyHeightPercentage && enemy.y > 0 && enemy.y < GLOBAL_HEIGHT) enemy.dir = 1;
        else if (enemy.y < GLOBAL_HEIGHT && enemy.y > 0) enemy.dir = 0;
    }

    if (!enemy.dead && enemy.cd === 0 && Math.random() > 0.80) {
        enemy.cd = 300;
        shoots.push({
            author: 'enemy',
            type: 1,
            vx: -20,
            damage: 20,
            x: enemy.x - 20,
            y: enemy.y,
            sizeX: 20,
            sizeY: 5,
            ts: Date.now()
        });
    }

    (!enemy.dead && enemy.dir === 1 && enemy.y > 0 && enemy.y < GLOBAL_HEIGHT) ? enemy.y += enemy.vy : enemy.y -= enemy.vy;
    if (enemy.cd_mov > 0) enemy.cd_mov -= 20;
    if (enemy.cd > 0) enemy.cd -= 20;
    if (enemy.asteroid > 0) enemy.asteroid -= 20;

    if (enemy.asteroid === 0) {
        asteroids.push({
            damage: 40,
            sizeX: 50,
            sizeY: 50,
            x: Math.random() * GLOBAL_WIDTH,
            y: Math.random() * GLOBAL_HEIGHT,
            sprite: '1346943991.png'
        });
        enemy.asteroid = 5000;
    }

    if (enemy.y <= 0) enemy.y = 1;
    if (enemy.y >= GLOBAL_HEIGHT) enemy.y = GLOBAL_HEIGHT;

    asteroids.forEach((aster, index, array) => {
        players.forEach((player, i, a) => {
            if (intersect(player, aster)) {
                player.life -= aster.damage;
                array.splice(index, 1);
                if (player.life <= 0) {
                    if (observers.length > 0) {
                        a[i] = {
                            id: observers[0].id,
                            life: 100,
                            score: 0,
                            x: GLOBAL_WIDTH / 10,
                            y: Math.random() * GLOBAL_HEIGHT,
                            sprite: player.sprite,
                            dead: false,
                            keyboard: {},
                            cd: 0,
                            sizeX: 150,
                            sizeY: 100
                        }
                        observers.splice(0, 1);
                        observers.push({
                            id: player.id
                        });
                    }
                    else {
                        a[i] = {
                            id: player.id,
                            life: 100,
                            score: 0,
                            x: GLOBAL_WIDTH / 10,
                            y: Math.random() * GLOBAL_HEIGHT,
                            sprite: player.sprite,
                            dead: false,
                            keyboard: {},
                            cd: 0,
                            sizeX: 150,
                            sizeY: 100
                        }
                    }
                }
            }
        });
    });

    shoots.forEach((shoot, index, array) => {
        shoot.x += shoot.vx;;
        if (shoot.x > GLOBAL_WIDTH || shoot.x < 0) array.splice(index, 1);
        if (!enemy.dead && shoot.author !== 'enemy' && intersect(shoot, enemy) && enemy.life > 0) {
            enemy.life += enemy.life >= shoot.damage ? -1 * shoot.damage : 0;
            array.splice(index, 1);

            if (enemy.life === 0) {
                enemy.dead = true;
                setTimeout(reset, 10000);
                return;
            }

        } else if (shoot.author === 'enemy') {
            players.forEach((player, i, a) => {
                if (intersect(player, shoot)) {
                    player.life -= shoot.damage;
                    array.splice(index, 1);
                    if (player.life === 0) {
                        if (observers.length > 0) {
                            a[i] = {
                                id: observers[0].id,
                                life: 100,
                                score: 0,
                                x: GLOBAL_WIDTH / 10,
                                y: Math.random() * GLOBAL_HEIGHT,
                                sprite: player.sprite,
                                dead: false,
                                keyboard: {},
                                cd: 0,
                                sizeX: 150,
                                sizeY: 100
                            }
                            observers.splice(0, 1);
                            observers.push({
                                id: player.id
                            });
                        }
                        else {
                            a[i] = {
                                id: player.id,
                                life: 100,
                                score: 0,
                                x: GLOBAL_WIDTH / 10,
                                y: Math.random() * GLOBAL_HEIGHT,
                                sprite: player.sprite,
                                dead: false,
                                keyboard: {},
                                cd: 0,
                                sizeX: 150,
                                sizeY: 100
                            }
                        }
                    }
                }
            });
        }
    });

    players.forEach(player => {
        if (player.keyboard.left && player.x > speed - 1) player.x -= speed;
        if (player.keyboard.right && player.x < GLOBAL_WIDTH - 200) player.x += speed;
        if (player.keyboard.up && player.y > speed - 1) player.y -= speed;
        if (player.keyboard.down && player.y < GLOBAL_HEIGHT - 100) player.y += speed;
        if (player.keyboard.shoot && player.cd === 0) {
            player.cd = 500;
            shoots.push({
                author: player.id,
                type: 0,
                vx: 20,
                damage: 10,
                x: player.x + 20,
                y: player.y,
                sizeX: 20,
                sizeY: 5,
                ts: Date.now(),
                keyboard: {}
            });
        }
        if (player.cd > 0) player.cd -= 20;
    });

    io.sockets.emit('state', state);

}

logic();

function intersect(player, enemy) {
    return (Math.abs(player.x - enemy.x) * 2 < (player.sizeX / 2 + enemy.sizeX / 2)) &&
        (Math.abs(player.y - enemy.y) * 2 < (player.sizeY / 2 + enemy.sizeY / 2));
}

io.on('connection', socket => {
    socket.emit('init', GLOBAL_WIDTH, GLOBAL_HEIGHT, state.players.length < 4, Date.now());

    if (state.players.length < 4) {
        state.players.push({
            id: socket.id,
            life: 100,
            score: 0,
            x: GLOBAL_WIDTH / 10,
            y: Math.random() * GLOBAL_HEIGHT,
            sprite: sprites[state.players.length],
            dead: false,
            keyboard: {},
            cd: 0,
            sizeX: 150,
            sizeY: 100
        });
    } else {
        state.observers.push({
            id: socket.id
        });
    }

    socket.on('input', function (keyboard) {
        state.players.forEach((player, index, array) => {
            if (player.id === socket.id) array[index].keyboard = keyboard;
        });
    });
});