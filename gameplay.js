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
const fridgeGlitch1Image = new Image();
fridgeGlitch1Image.src = 'fridge-glitch1.png';
const icicleImage = new Image();
icicleImage.src = 'icicle.png';
const icecubeImage = new Image();
icecubeImage.src = 'icecube.png';
const waterdropImage = new Image();
waterdropImage.src = 'waterdrop.png'
const puddleImage = new Image();
puddleImage.src = 'puddle.png'

let exp = 0;
let playerLevel = 1;
let lives = 3;
let gameOver = false;
let gameStarted = false;
let keys = {};
let gameState = 'playing'; // 'playing', 'levelingUp', 'gameOver'
let perkOptions = [];
let selectedPerkIndex = 0;
let selectPerkReady = false;
let perkShieldTimer = 0;

const player = {
    x: 30,
    y: canvas.height / 2 - 25,
    width: 100,
    height: 100,
    speed: 3,
    bullets: [],
    bulletHeight: 80,
    shootCooldown: 70,
    shootTimer: 0,
    shootingAnimationTimer: 0,
    shieldTimer: 0,
    shotCounter: 0,
    ropeBurnCooldown: 20,
};

const allPerks = [
    {
        title: "Speed Boost",
        description: "Increase movement speed by 25%.",
        apply: (p) => { p.speed += (p.speed/4); }
    },
    {
        title: "Rapid Flick",
        description: "Decrease time between net flicking.",
        apply: (p) => { p.shootCooldown = Math.max(20, p.shootCooldown - 20); }
    },
    {
        title: "Cast a Wider Net",
        description: "Your nets are 30% wider.",
        apply: (p) => { p.bulletHeight = Math.min(canvas.height/3, p.bulletHeight * 1.3); }
    },
    {
        title: "Extra Members",
        description: "Gain one extra life.",
        apply: (p) => { lives++; }
    },
    {
        title: "Firewall",
        description: "Increase shield time after regeneration.",
        apply: (p) => { perkShieldTimer += 100; }
    },
    {
        title: "Rope Burn",
        description: "Activate special attack every 15 flicks.",
        apply: (p) => { p.ropeBurnCooldown -= 5; }
    },
];

let enemy = {};
let activateEnemySpecialAttack = false;
let enemyDefeatCount = 0

function drawPlayer() {
    if (lives <= 0) return;
    if (player.shootingAnimationTimer > 0) {
        ctx.drawImage(playerFlickImage, player.x, player.y, player.width, player.height);
    } else {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    }
}

function drawProtectionOrb() {
    if (player.shieldTimer <= 0) return;

    const orbX = player.x + player.width / 2;
    const orbY = player.y + player.height / 2;
    const orbRadius = player.width / 2 + 10;

    ctx.shadowColor = 'rgba(124, 199, 129, 0.9)';
    ctx.shadowBlur = 30;

    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2); 
    ctx.fillStyle = 'rgba(162, 244, 168, 0.2)'; 
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
}

function drawPlayerBullets() {
    for (const bullet of player.bullets) {
        if (bullet.type === 'special') {
            console.log('hi')
            ctx.fillStyle = '#C41E3A';
            ctx.shadowColor = '#EE4B2B';
            ctx.shadowBlur = 10;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            ctx.shadowBlur = 0;
        } else {
            ctx.drawImage(netImage, bullet.x, bullet.y, bullet.width, bullet.height);
        }
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
        shootCooldown: Math.max(40, 75 - (enemyDefeatCount*2)),
        shootTimer: Math.random() * 10,
        shootingAnimationTimer: 0,
        health: 3 + enemyDefeatCount,
        maxHealth: 3 + enemyDefeatCount,
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

function checkScoreForLevelUp() {
    const requiredExp = 1000 + ((playerLevel - 1) * 500)
    if (exp >= requiredExp) {
        gameState = 'levelingUp';
        playerLevel++
        exp = exp - requiredExp
        generatePerkOptions();
    }
}

function generatePerkOptions() {
    perkOptions = [];
    selectedPerkIndex = -1;
    const availablePerks = [...allPerks].filter(perk => {
        if (perk.title === "Rapid Flick" && player.shootCooldown === 20) {
            return false;
        }
        if (perk.title === "Cast a Wider Net" && player.bulletHeight === (canvas.height/3)) {
            return false;
        }
        if (perk.title === "Firewall" && perkShieldTimer > 700) {
            return false;
        }
        if (perk.title === "Rope Burn") {
            if (player.ropeBurnCooldown === 5) {
                return false
            } else {
                perk.description = `Activate special attack every ${player.ropeBurnCooldown - 5} flicks.`
            }
        }
        return true;
    });
    for (let i = 0; i < 3; i++) {
        if (availablePerks.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availablePerks.length);
        perkOptions.push(availablePerks.splice(randomIndex, 1)[0]);
    }
}

function drawLevelUpScreen() {
    // Dim the background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '30px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL UP! CHOOSE A PERK', canvas.width / 2, 80);

    // Draw the perk option boxes
    const boxWidth = canvas.width * 0.6;
    const boxHeight = 80;
    const startY = 140;
    const spacing = 20;

    perkOptions.forEach((perk, index) => {
        const boxY = startY + index * (boxHeight + spacing);
        const boxX = (canvas.width - boxWidth) / 2;
        
        // Store the clickable area on the perk object itself for easy access
        perk.hitbox = { x: boxX, y: boxY, width: boxWidth, height: boxHeight };

        const isSelected = index === selectedPerkIndex;

        if (isSelected) {
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = '#fff';
        } else {
            ctx.strokeStyle = '#0ff';
        }

        ctx.lineWidth = 2;
        ctx.strokeRect(perk.hitbox.x, perk.hitbox.y, perk.hitbox.width, perk.hitbox.height);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        ctx.font = '20px "Courier New"';
        ctx.fillText(perk.title, canvas.width / 2, boxY + 30);
        
        ctx.font = '16px "Courier New"';
        ctx.fillStyle = '#ccc';
        ctx.fillText(perk.description, canvas.width / 2, boxY + 55);
        ctx.fillStyle = 'white';
    });
    ctx.textAlign = 'left';
}

document.addEventListener('keydown', (e) => {
    keys[e.code] = true
    if (gameState === 'levelingUp') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
            selectedPerkIndex === -1 && (selectedPerkIndex = 0);
            selectedPerkIndex = (selectedPerkIndex - 1 + perkOptions.length) % perkOptions.length;
            selectPerkReady = true;
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            selectedPerkIndex = (selectedPerkIndex + 1) % perkOptions.length;
            selectPerkReady = true;
        } else if ((e.code === 'Space' || e.code === 'Enter') && selectPerkReady) {
            if (perkOptions[selectedPerkIndex]) {
                perkOptions[selectedPerkIndex].apply(player);
                gameState = 'playing';
                perkOptions = [];
            }
            selectPerkReady = false;
        }
    } else {
        if (e.code === 'Space' && !gameStarted) {
            startGame();
        }
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
    if (gameState === 'levelingUp') {
        if (keys['ArrowUp']) {
            selectedPerkIndex === -1 && (selectedPerkIndex = 0);
            selectedPerkIndex = (selectedPerkIndex - 1 + perkOptions.length) % perkOptions.length;
            selectPerkReady = true;
        } else if (keys['ArrowDown']) {
            selectedPerkIndex = (selectedPerkIndex + 1) % perkOptions.length;
            selectPerkReady = true;
        } else if (keys['Space'] && selectPerkReady) {
            if (perkOptions[selectedPerkIndex]) {
                perkOptions[selectedPerkIndex].apply(player);
                gameState = 'playing';
                perkOptions = [];
            }
            selectPerkReady = false
        }
    } else {
        if (key === 'Space' && isPressed && !gameStarted) {
            startGame();
        }
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
        player.shotCounter++;
        if (player.ropeBurnCooldown < 20 && player.shotCounter % player.ropeBurnCooldown === 0) {
            player.bullets.push({ 
                type: "special", 
                x: player.x + player.width, 
                y: 0, 
                width: 10, 
                height: canvas.height, 
                speed: 5,
            });
        } else {
            player.bullets.push({
                type: "normal",
                x: player.x + player.width -10,
                y: player.y,
                width: 100,
                height: player.bulletHeight,
                speed: 5
            });
        }
        player.shootTimer = player.shootCooldown;
        player.shootingAnimationTimer = 15;
    }

    if (player.shootTimer > 0) {
        player.shootTimer--;
    }

    if (player.shootingAnimationTimer > 0) {
        player.shootingAnimationTimer--;
    }

    if (player.shieldTimer > 0) {
        player.shieldTimer--;
    }

    player.bullets.forEach((bullet, index) => {
        bullet.x += bullet.speed;
        if (bullet.x > canvas.width) {
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
                if (playerBullet.type === "normal") {
                    player.bullets.splice(pIndex, 1);
                }
                enemy.bullets.splice(eIndex, 1);
                exp += 100;
                checkScoreForLevelUp()
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
            if (bullet.type === "special") {
                enemy.health--;
            }
            exp += 100;
            checkScoreForLevelUp()
            if (enemy.health <= 0) {
                enemy.alive = false;
                exp += 500;
                enemyDefeatCount ++
                activateEnemySpecialAttack = true;
                checkScoreForLevelUp()
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

        if (hit && player.shieldTimer <= 0) {
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
        player.shieldTimer = 210 + perkShieldTimer;
    }
}

function drawUI() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Courier New"';
    ctx.fillText(`Exp: ${exp}`, 10, 25);
    ctx.fillText(`Level: ${playerLevel}`, canvas.width / 2 - 100, 25);
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
        if (isMobile()) {
            ctx.fillText('Press A to Start', canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2);
        }
    }
    ctx.textAlign = 'left';
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gameStarted || gameOver) {
        drawMessages();
        gameStarted = false;
    } else if (gameState === 'levelingUp') {
        drawPlayer();
        drawPlayerBullets();
        drawEnemy();
        drawEnemyBullets();
        drawUI();
        drawLevelUpScreen();
    } else if (gameState === 'playing') {
        drawProtectionOrb();
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
    exp = 0;
    playerLevel = 1;
    lives = 3;
    gameOver = false;
    gameStarted = true;
    gameState = 'playing';
    player.speed = 3;
    player.shootCooldown = 70;
    player.bulletHeight = 80;
    player.bullets = [];
    player.shotCounter = 0;
    player.ropeBurnCooldown = 20;
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
