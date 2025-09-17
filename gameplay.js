const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerImage = new Image();
playerImage.src = 'hand-default.png';
const playerFlickImage = new Image();
playerFlickImage.src = 'hand-flick.png';
const netImage = new Image();
netImage.src = 'net.png';

let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;
let keys = {};

const player = {
    x: 30,
    y: canvas.height / 2 - 25,
    width: 100,
    height: 100,
    speed: 5,
    bullets: [],
    shootCooldown: 15,
    shootTimer: 0,
    shootingAnimationTimer: 0,
};

let enemy = {};

function drawPlayer() {
    if (lives <= 0) return;
    if (player.shootingAnimationTimer > 0) {
        ctx.drawImage(playerFlickImage, player.x, player.y, player.width, player.height);
    } else {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    }
}

function drawPlayerBullets() {
    for (const bullet of player.bullets) {
        ctx.drawImage(netImage, bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

function spawnEnemy() {
    enemy = {
        x: canvas.width - 100,
        y: canvas.height / 2 - 25, 
        width: 50, 
        height: 70,
        speed: 3,
        direction: 1,
        alive: true,
        bullets: [],
        shootCooldown: 75,
        shootTimer: Math.random() * 10
    };

}

function drawEnemy() {
    if (enemy.alive) {
        ctx.fillStyle = '#f00';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
}

function drawEnemyBullets() {
    for (const bullet of enemy.bullets) {
        ctx.fillStyle = '#f0f';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && !gameStarted) {
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function updatePlayer() {
    if (lives <= 0) return;

    if ((keys['KeyA'] || keys['ArrowLeft']) && player.x > 0) {
        player.x -= player.speed;
    }
    if ((keys['KeyD'] || keys['ArrowRight']) && player.x < (canvas.width/2) - player.width) {
        player.x += player.speed;
    }
    if ((keys['KeyW'] || keys['ArrowUp']) && player.y > 0) {
        player.y -= player.speed;
    }
    if ((keys['KeyS'] || keys['ArrowDown']) && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }

    if (keys['Space'] && player.shootTimer <= 0) {
        player.bullets.push({
            x: player.x + player.width -10,
            y: player.y + 10,
            width: 100,
            height: 80,
            speed: 8
        });
        player.shootTimer = player.shootCooldown;
        player.shootingAnimationTimer = 15;
    }

    if (player.shootTimer > 0) {
        player.shootTimer--;
    }

    if (player.shootingAnimationTimer > 0) {
        player.shootingAnimationTimer--;
    }

    player.bullets.forEach((bullet, index) => {
        bullet.x += bullet.speed;
        if (bullet.x < 0) {
            player.bullets.splice(index, 1);
        }
    });
}

function updateEnemy() {
    if (!enemy.alive) return;

    enemy.y += enemy.speed * enemy.direction;
    if (enemy.y <= 0 || enemy.y + enemy.height >= canvas.height) { 
        enemy.direction *= -1;
    }

    if (enemy.shootTimer <= 0) {
        enemy.bullets.push({
            x: enemy.x,
            y: enemy.y + enemy.height / 2 - 5,
            width: 10,
            height: 10,
            speed: 4    
        });
        enemy.shootTimer = enemy.shootCooldown;
    } else {
        enemy.shootTimer--;
    }

    // Update enemy bullet positions
    enemy.bullets.forEach((bullet, index) => {
        bullet.x -= bullet.speed;
        if (bullet.x < 0) {
            enemy.bullets.splice(index, 1);
        }
    });
}

function checkCollisions() {

    player.bullets.forEach((playerBullet, pIndex) => {
        enemy.bullets.forEach((enemyBullet, eIndex) => {
            if (
                playerBullet.x < enemyBullet.x + enemyBullet.width &&
                playerBullet.x + playerBullet.width > enemyBullet.x &&
                playerBullet.y < enemyBullet.y + enemyBullet.height &&
                playerBullet.y + playerBullet.height > enemyBullet.y
            ) {
                player.bullets.splice(pIndex, 1);
                enemy.bullets.splice(eIndex, 1);
            }
        });
    });

    player.bullets.forEach((bullet, bIndex) => {
        if (
            enemy.alive &&
            bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y
        ) {
            enemy.alive = false;
            player.bullets.splice(bIndex, 1);
            score += 500;
        }
    });

    enemy.bullets.forEach((bullet, bIndex) => {
        if (
            (player.x + 20) < bullet.x + bullet.width &&
            (player.x + 20) + (player.width - 50) > bullet.x &&
            player.y < bullet.y + bullet.height &&
            player.y + player.height > bullet.y
        ) {
            enemy.bullets.splice(bIndex, 1);
            playerHit();
        }
    });

    if (enemy.alive) {
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
           playerHit();
        }
    }
}

function playerHit() {
    lives--;
    if (lives <= 0) {
        gameOver = true;
    } else {
        player.x = 30;
        player.y = canvas.height / 2 - 25 ;
    }
}

function drawUI() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Courier New"';
    ctx.fillText(`Score: ${score}`, 10, 25);
    ctx.fillText(`Lives: ${lives}`, canvas.width - 100, 25);
}

function drawMessages() {
    ctx.textAlign = 'center';
    if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '50px "Courier New"';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    } else if (!gameStarted) {
        ctx.fillStyle = 'white';
        ctx.font = '30px "Courier New"';
        ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2);
    }
    ctx.textAlign = 'left';
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gameStarted || gameOver) {
        drawMessages();
        gameStarted = false;
    } else {
        drawPlayer();
        drawPlayerBullets();
        drawEnemy();
        drawEnemyBullets();
        drawUI();

        updatePlayer();
        updateEnemy();
        checkCollisions();

        if (!enemy.alive) {
            setTimeout(spawnEnemy, 2000); 
        }
    }
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    gameStarted = true;
    player.bullets = [];
    spawnEnemy();
}

// Start the game loop
gameLoop();
