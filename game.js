document.addEventListener('DOMContentLoaded', function() {
    // Game elements
    const player = document.querySelector('.player');
    const gameArea = document.querySelector('#game-area');
    const scoreDisplay = document.querySelector('#score');
    const livesDisplay = document.querySelector('#lives');
    const gameOver = document.querySelector('#game-over');
    const finalScore = document.querySelector('#final-score');
    const restartButton = document.querySelector('#restart');
    const startScreen = document.querySelector('#start-screen');
    const startButton = document.querySelector('#start-button');
    const goomba = document.querySelector('.goomba');
    const coin = document.querySelector('.coin');
    const questionBlock = document.querySelector('.question-block');
    const pipe = document.querySelector('.pipe');
    const mobileLeftBtn = document.querySelector('#mobile-left');
    const mobileRightBtn = document.querySelector('#mobile-right');
    const mobileJumpBtn = document.querySelector('#mobile-jump');
    
    // Game state
    let score = 0;
    let lives = 3;
    let playerPos = { x: 50, y: 100 };
    let playerVel = { x: 0, y: 0 };
    let gravity = 0.5;
    let isJumping = false;
    let gameRunning = false;
    let facingRight = true;
    let lastTimestamp = 0;
    let gameSpeed = 1;
    let goombaSpeed = 2;
    let goombaDirection = -1;
    let backgroundPos = 0; // New variable for background position
    
    // Key states
    const keys = {
        ArrowRight: false,
        ArrowLeft: false,
        Space: false,
        ArrowUp: false
    };
    
    // Platform data
    const platforms = [
        { x: 0, y: 100, width: 200, height: 20 },
        { x: 250, y: 150, width: 150, height: 20 },
        { x: 450, y: 200, width: 200, height: 20 },
        { x: 700, y: 170, width: 150, height: 20 },
        { x: 0, y: 400, width: 800, height: 100 } // Ground
    ];
    
    // Coins data
    const coins = [
        { x: 100, y: 350, collected: false },
        { x: 300, y: 250, collected: false },
        { x: 500, y: 300, collected: false },
        { x: 650, y: 230, collected: false }
    ];
    
    // Pipes data
    const pipes = [
        { x: 200, y: 340, height: 60 },
        { x: 600, y: 340, height: 60 }
    ];
    
    // Question blocks data
    const questionBlocks = [
        { x: 150, y: 300, hit: false },
        { x: 350, y: 250, hit: false },
        { x: 550, y: 270, hit: false }
    ];
    
    // Goomba data
    let goombaPos = { x: 700, y: 100 };
    
    // Power-up data
    const powerUps = [
        { x: 400, y: 300, collected: false, type: 'jumpBoost' }
    ];
    
    // Particles for effects
    let particles = [];
    
    // Function to handle power-up collection
    function checkPowerUpCollisions() {
        powerUps.forEach((powerUp, index) => {
            if (!powerUp.collected &&
                playerPos.x < powerUp.x + 24 &&
                playerPos.x + 40 > powerUp.x &&
                playerPos.y < powerUp.y + 24 &&
                playerPos.y + 60 > powerUp.y
            ) {
                powerUp.collected = true;
                document.querySelectorAll('.power-up')[index].style.display = 'none';
                if (powerUp.type === 'jumpBoost') {
                    player.hasJumpBoost = true;
                    setTimeout(() => player.hasJumpBoost = false, 10000); // Power-up lasts for 10 seconds
                }
            }
        });
    }
    
    // Update power-up position
    function updatePowerUps() {
        powerUps.forEach(powerUp => {
            powerUp.x -= gameSpeed * 2;
            if (powerUp.x + 24 < 0) {
                powerUp.x += 800; // Wrap around
            }
        });
    }
    
    // Reset power-ups
    function resetPowerUps() {
        const powerUpElements = document.querySelectorAll('.power-up');
        powerUps.forEach((powerUp, index) => {
            powerUp.collected = false;
            powerUpElements[index].style.display = 'block';
            powerUpElements[index].style.left = powerUp.x + 'px';
            powerUpElements[index].style.bottom = powerUp.y + 'px';
        });
    }
    
    // Start game
    startButton.addEventListener('click', startGame);
    
    // Restart game
    restartButton.addEventListener('click', restartGame);
    
    // Mobile controls
    if (mobileLeftBtn && mobileRightBtn && mobileJumpBtn) {
        mobileLeftBtn.addEventListener('touchstart', () => keys.ArrowLeft = true);
        mobileLeftBtn.addEventListener('touchend', () => keys.ArrowLeft = false);
        mobileRightBtn.addEventListener('touchstart', () => keys.ArrowRight = true);
        mobileRightBtn.addEventListener('touchend', () => keys.ArrowRight = false);
        mobileJumpBtn.addEventListener('touchstart', () => {
            if (!isJumping && gameRunning) jump();
        });
    }
    
    // Start game function
    function startGame() {
        startScreen.style.display = 'none';
        gameRunning = true;
        score = 0;
        lives = 3;
        playerPos = { x: 50, y: 100 };
        playerVel = { x: 0, y: 0 };
        
        // Reset UI
        updateScore();
        updateLives();
        gameOver.style.display = 'none';
        
        // Reset game elements
        resetCoins();
        resetQuestionBlocks();
        resetPowerUps();
        goombaPos = { x: 700, y: 100 };
        
        // Event listeners
        document.addEventListener('keydown', keyDown);
        document.addEventListener('keyup', keyUp);
        
        // Start game loop
        lastTimestamp = performance.now();
        requestAnimationFrame(gameLoop);
    }
    
    // Key press handlers
    function keyDown(e) {
        if (keys[e.code] !== undefined) {
            keys[e.code] = true;
            e.preventDefault();
        }
        
        // Space jump
        if ((e.code === 'Space' || e.code === 'ArrowUp') && !isJumping && gameRunning) {
            jump();
        }
    }
    
    function keyUp(e) {
        if (keys[e.code] !== undefined) {
            keys[e.code] = false;
            e.preventDefault();
        }
    }
    
    // Jump function
    function jump() {
        isJumping = true;
        let jumpHeight = 12;
        if (player.hasJumpBoost) {
            jumpHeight += 5; // Increase jump height if power-up is active
        }
        playerVel.y = jumpHeight;
        player.classList.add('jumping');
        setTimeout(() => player.classList.remove('jumping'), 200);
    }
    
    // Update player position
    function updatePlayer() {
        // Movement controls
        if (keys.ArrowRight) {
            playerVel.x = 5;
            if (!facingRight) {
                facingRight = true;
                player.style.transform = 'scaleX(1)';
            }
        } else if (keys.ArrowLeft) {
            playerVel.x = -5;
            if (facingRight) {
                facingRight = false;
                player.style.transform = 'scaleX(-1)';
            }
        } else {
            playerVel.x *= 0.7; // Friction
            if (Math.abs(playerVel.x) < 0.1) playerVel.x = 0;
        }
        
        // Apply gravity
        playerVel.y -= gravity * gameSpeed;
        
        // Update position
        playerPos.x += playerVel.x * gameSpeed;
        playerPos.y += playerVel.y * gameSpeed;
        
        // World boundaries
        if (playerPos.x < 0) {
            playerPos.x =document.addEventListener('DOMContentLoaded', function() {
                // [Todo el código anterior permanece igual hasta la función checkCoinCollisions...]
            
                // Function to handle coin collection
                function checkCoinCollisions() {
                    let coinsLeft = 0; // Contador de monedas restantes
                    
                    coins.forEach((coin, index) => {
                        if (!coin.collected &&
                            playerPos.x < coin.x + 20 &&
                            playerPos.x + 40 > coin.x &&
                            playerPos.y < coin.y + 20 &&
                            playerPos.y + 60 > coin.y
                        ) {
                            coin.collected = true;
                            document.querySelectorAll('.coin')[index].style.display = 'none';
                            score += 100;
                            updateScore();
                            
                            // Efecto de partículas al recolectar moneda
                            createParticles(coin.x + 10, coin.y + 10, 'gold');
                        }
                        
                        if (!coin.collected) {
                            coinsLeft++;
                        }
                    });
                    
                    // Verificar si no quedan monedas
                    if (coinsLeft === 0) {
                        showVictory();
                    }
                }
            
                // [El resto del código anterior permanece igual hasta donde estaba...]
            
                // Función para mostrar victoria
                function showVictory() {
                    gameRunning = false;
                    gameOver.style.display = 'flex';
                    finalScore.textContent = `¡Felicidades! ¡Has ganado el juego! Puntuación: ${score}`;
                    document.removeEventListener('keydown', keyDown);
                    document.removeEventListener('keyup', keyUp);
                    
                    // Cambiar el estilo para el mensaje de victoria
                    gameOver.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
                    finalScore.style.color = 'gold';
                    finalScore.style.fontSize = '24px';
                }
            
                // [El resto del código anterior permanece igual...]
            });
