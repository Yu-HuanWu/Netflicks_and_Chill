const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerImage = new Image();
playerImage.src = 'hand-default.png';
const playerFlickImage = new Image();
playerFlickImage.src = 'hand-flick.png';
const netImage = new Image();
netImage.src = 'net.png';
const fridgeImage = new Image();
fridgeImage.src = 'fridge-default.png';
const fridgeOpenImage = new Image();
fridgeOpenImage.src = 'fridge-open.png';
const icicleImage = new Image();
icicleImage.src = 'icicle.png';
const icecubeImage = new Image();
icecubeImage.src = 'icecube.png';
const waterdropImage = new Image();
waterdropImage.src = 'waterdrop.png'
const puddleImage = new Image();
puddleImage.src = 'puddle.png'

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
    speed: 3,
    bullets: [],
    shootCooldown: 35,
    shootTimer: 0,
    shootingAnimationTimer: 0,
};

let enemy = {};
let activateEnemySpecialAttack = false;

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
        width: 100, 
        height: 120,
        speed: 3,
        direction: 1,
        alive: true,
        bullets: [],
        shootCooldown: 75,
        shootTimer: Math.random() * 10,
        shootingAnimationTimer: 0,
        health: 5,
        maxHealth: 5,
        specialAttackCooldown: 360,
        specialAttackTimer: 180 
    };

}

function drawEnemy() {
    if (enemy.alive) {
        const healthBarWidth = enemy.width;
        const healthBarHeight = 8;
        const healthBarX = enemy.x;
        const healthBarY = enemy.y - 15;
        ctx.fillStyle = '#555';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        const currentHealthWidth = healthBarWidth * (enemy.health / enemy.maxHealth);
        if ((enemy.health / enemy.maxHealth) < 0.25) {
            ctx.fillStyle = '#c71100';
        } else if ((enemy.health / enemy.maxHealth) < 0.5) {
            ctx.fillStyle = '#f7eb05';
        } else {
            ctx.fillStyle = '#00ff00';
        }
        ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);    

        if (enemy.shootingAnimationTimer > 0) {
            ctx.drawImage(fridgeOpenImage, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            ctx.drawImage(fridgeImage, enemy.x, enemy.y, enemy.width, enemy.height);
        }
    }
}

function drawEnemyBullets() {
    enemy.bullets.forEach(bullet => {
        if (bullet.type === 'special') {
            if (bullet.state === 'activating' || bullet.state === 'active') {
                const hazardX = bullet.x - (bullet.width / 2);
                const hazardTopY = (bullet.state === 'activating') ? canvas.height - bullet.hazardHeight : 0;
                const hazardBottomY = canvas.height;
                const tileHeight = 32; 
                for (let y = hazardBottomY; y > hazardTopY; y -= tileHeight) {
                    const drawHeight = Math.min(tileHeight, y - hazardTopY);
                    
                    ctx.drawImage(
                        icecubeImage,
                        0,
                        0,
                        icecubeImage.width,
                        drawHeight, 
                        hazardX, 
                        y - tileHeight,
                        bullet.width,
                        drawHeight
                    );
                }
            } else if (bullet.state === 'dropping') {
                ctx.drawImage(waterdropImage, bullet.x - (bullet.projectileWidth / 2), bullet.y, bullet.projectileWidth, bullet.projectileHeight) 
            } else if (bullet.state === 'sliding' || bullet.state === 'charging') {
                ctx.drawImage(puddleImage, bullet.x- (bullet.projectileWidth * 2), bullet.y, bullet.projectileWidth * 4, bullet.projectileHeight * 2) 
            }
        } else {
            ctx.drawImage(icicleImage, bullet.x, bullet.y, bullet.width, bullet.height);
        }
    });
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

// --- MOBILE CONTROLS EVENT LISTENERS ---
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnAction = document.getElementById('action-btn');

function handleControlPress(e, key, isPressed) {
    e.preventDefault();
    keys[key] = isPressed;
    if (key === 'Space' && isPressed && !gameStarted) {
        startGame();
    }
}

// Map buttons to keyboard event codes
btnUp.addEventListener('mousedown', (e) => handleControlPress(e, 'ArrowUp', true));
btnUp.addEventListener('mouseup', (e) => handleControlPress(e, 'ArrowUp', false));
btnUp.addEventListener('touchstart', (e) => handleControlPress(e, 'ArrowUp', true), { passive: false });
btnUp.addEventListener('touchend', (e) => handleControlPress(e, 'ArrowUp', false));

btnDown.addEventListener('mousedown', (e) => handleControlPress(e, 'ArrowDown', true));
btnDown.addEventListener('mouseup', (e) => handleControlPress(e, 'ArrowDown', false));
btnDown.addEventListener('touchstart', (e) => handleControlPress(e, 'ArrowDown', true), { passive: false });
btnDown.addEventListener('touchend', (e) => handleControlPress(e, 'ArrowDown', false));

btnLeft.addEventListener('mousedown', (e) => handleControlPress(e, 'ArrowLeft', true));
btnLeft.addEventListener('mouseup', (e) => handleControlPress(e, 'ArrowLeft', false));
btnLeft.addEventListener('touchstart', (e) => handleControlPress(e, 'ArrowLeft', true), { passive: false });
btnLeft.addEventListener('touchend', (e) => handleControlPress(e, 'ArrowLeft', false));

btnRight.addEventListener('mousedown', (e) => handleControlPress(e, 'ArrowRight', true));
btnRight.addEventListener('mouseup', (e) => handleControlPress(e, 'ArrowRight', false));
btnRight.addEventListener('touchstart', (e) => handleControlPress(e, 'ArrowRight', true), { passive: false });
btnRight.addEventListener('touchend', (e) => handleControlPress(e, 'ArrowRight', false));

btnAction.addEventListener('mousedown', (e) => handleControlPress(e, 'Space', true));
btnAction.addEventListener('mouseup', (e) => handleControlPress(e, 'Space', false));
btnAction.addEventListener('touchstart', (e) => handleControlPress(e, 'Space', true), { passive: false });
btnAction.addEventListener('touchend', (e) => handleControlPress(e, 'Space', false));

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
            speed: 5
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
            type: 'normal',
            x: enemy.x,
            y: enemy.y + enemy.height / 2 - 5,
            width: 60,
            height: 60,
            speed: 4    
        });
        enemy.shootTimer = enemy.shootCooldown;
        enemy.shootingAnimationTimer = 45;
    } else {
        enemy.shootTimer--;
    }

    if (enemy.specialAttackTimer <= 0 && activateEnemySpecialAttack) {
        enemy.bullets.push({
            type: 'special',
            state: 'dropping',
            x: enemy.x,
            y: enemy.y + enemy.height,
            speed: 4,
            targetX: player.x + (player.width / 2), 
            width: 40,
            projectileWidth: 15, 
            projectileHeight: 15,
            chargeTimer: 120,
            duration: 120,
            hazardHeight: 0, 
            hazardSpeed: 5
        });
        enemy.specialAttackTimer = enemy.specialAttackCooldown;
    } else {
        enemy.specialAttackTimer--;
    }

    if (enemy.shootingAnimationTimer > 0) {
        enemy.shootingAnimationTimer--;
    }

    enemy.bullets.forEach((bullet, index) => {
        if (bullet.type === 'special') {
            switch (bullet.state) {
                case 'dropping':
                    bullet.y += bullet.speed;
                    if (bullet.y >= canvas.height - bullet.projectileHeight) {
                        bullet.y = canvas.height - bullet.projectileHeight;
                        bullet.state = 'sliding';
                    }
                    break;
                case 'sliding':
                    if (bullet.x < bullet.targetX) {
                        bullet.x += bullet.speed;
                        if (bullet.x >= bullet.targetX) bullet.state = 'charging';
                    } else {
                        bullet.x -= bullet.speed;
                        if (bullet.x <= bullet.targetX) bullet.state = 'charging';
                    }
                    break;
                case 'charging':
                    bullet.chargeTimer--;
                    if (bullet.chargeTimer <= 0) {
                        bullet.state = 'activating';
                    }
                    break;
                case 'activating':
                    bullet.hazardHeight += bullet.hazardSpeed;
                    if (bullet.hazardHeight >= canvas.height) {
                        bullet.hazardHeight = canvas.height;
                        bullet.state = 'active';
                    }
                    break;
                case 'active':
                    bullet.duration--;
                    if (bullet.duration <= 0) {
                        enemy.bullets.splice(index, 1);
                    }
                    break;
            }
        } else {
            bullet.x -= bullet.speed;
            if (bullet.x < 0) enemy.bullets.splice(index, 1);
        }
    });
}

function checkCollisions() {

    player.bullets.forEach((playerBullet, pIndex) => {
        enemy.bullets.forEach((enemyBullet, eIndex) => {
            if (
                playerBullet.x < enemyBullet.x + enemyBullet.width &&
                playerBullet.x - 40 + playerBullet.width > enemyBullet.x &&
                playerBullet.y < enemyBullet.y + enemyBullet.height - 30 &&
                playerBullet.y + playerBullet.height - 30 > enemyBullet.y
            ) {
                player.bullets.splice(pIndex, 1);
                enemy.bullets.splice(eIndex, 1);
                score += 100;
            }
        });
    });

    player.bullets.forEach((bullet, bIndex) => {
        if (
            enemy.alive &&
            bullet.x < enemy.x - 40 + enemy.width &&
            bullet.x + bullet.width > enemy.x + 40 &&
            bullet.y < enemy.y - 30 + enemy.height &&
            bullet.y + bullet.height > enemy.y + 30
        ) {
            player.bullets.splice(bIndex, 1);
            enemy.health--;
            score += 100;

            if (enemy.health <= 0) {
                enemy.alive = false;
                score += 500;
                activateEnemySpecialAttack = true;
            }
        }
    });

    enemy.bullets.forEach((bullet, bIndex) => {
        let hit = false;
        if (bullet.type === 'special') {
            if (bullet.state === 'activating' || bullet.state === 'active') {
                const hazardX = bullet.x - (bullet.width / 2);
                const hazardY = (bullet.state === 'activating') ? canvas.height - bullet.hazardHeight : 0;
                const hazardWidth = bullet.width;
                const hazardHeight = bullet.hazardHeight;

                if (
                    (player.x + 10)< hazardX + hazardWidth &&
                    (player.x + 20) + (player.width - 60) > hazardX &&
                    player.y < hazardY + hazardHeight - 40 && 
                    player.y + player.height -30 > hazardY) {
                    hit = true;
                }
            }
        } else {
            if (
                (player.x + 20) < bullet.x + bullet.width &&
                (player.x + 20) + (player.width - 60) > bullet.x &&
                player.y < bullet.y + bullet.height - 30 &&
                player.y + player.height - 30 > bullet.y
            ) {
                enemy.bullets.splice(bIndex, 1);
                hit = true;
            }
        }

        if (hit) {
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

function isMobile() {
    return window.innerWidth <= 768;
}

const controlsDiv = document.getElementById('controls');
const instructionsDiv = document.getElementById('instructions');

if (!isMobile()) {
    controlsDiv.classList.add('hidden');
    instructionsDiv.innerText = "Move: [WASD] or [←↑→↓] | Shoot: [Spacebar]";
}

// Start the game loop
gameLoop();
