// --- CORE GAME STATE & CONSTANTS ---
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;
const PLAYER_WIDTH = 25;
const PLAYER_HEIGHT = 25;
const LEVEL_COUNT = 5; 

// Level 1 Mechanics
const RISE_BLOCK_ID = 'rise-1';
const PENDULUM_ID = 'pend-1';

// Level 2 Mechanics
const TELEPORT_BLOCK_ID = 'tele-2';
const SPINNER_BLOCK_ID = 'spinner-2';
const PUSHABLE_BOX_ID = 'push-2';
const CRUSHING_TRAP_ID = 'crush-2';
const BLUE_LIFT_ID = 'lift-2';

// Cinematic Message
const BSDK_MESSAGE = "BSDK PADHAI LIKHAI KARNE KI UMR ME GAME KHELI JA RHI HAI, INKI GAANMASTI TO DEKHO.";
const BSDK_TYPING_SPEED = 80;

let gameState = {
    tapCount: 0,
    currentLevel: 1,
    unlockedLevels: parseInt(localStorage.getItem('unlockedLevels') || 1), 
    
    // Player Physics & State
    player: { x: 50, y: 0, dx: 0, dy: 0, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, onGround: false },
    gravity: 0.7,
    jumpPower: -13,
    moveSpeed: 5,
    isDead: false,
    gameLoopRunning: false, 
    
    // Input Handling
    keys: {},
    touchHeld: false, 
    jumpBuffer: 0,
    coyoteTime: 0,
    
    // Mechanics State
    pendulum: null,
    spinnerTimer: 0,
};

// --- CORRECTED LEVEL DEFINITIONS ---
const levels = {
    1: {
        spawn: [20, 100], 
        blocks: [
            [0, 300, 150, 20, 0, 'block-start'], 
            [150, 300, 50, 20, 0, RISE_BLOCK_ID, 'rise'], 
            [200, 300, 100, 20, 0, 'block-mid'], 
            [150, 100, 150, 20, 1, 'trap-crush-ceiling'],
            [400, 300, 100, 20, 0, 'block-after-pit-base'], 
            [550, 300, 200, 20, 0, 'block-pendulum-base'],
        ],
        exit: [750, 300, 20, 40], 
        pendulum: {
            id: PENDULUM_ID,
            anchorX: 650, anchorY: 50, length: 250, swingAngle: Math.PI / 4, speed: 0.04, hiddenUntilX: 500,
        }
    },
    2: {
        spawn: [20, 420], 
        blocks: [
            [0, 50, 250, 20, 0, 'block-2-lower-ground'],
            [250, 50, 50, 20, 0, TELEPORT_BLOCK_ID, 'teleport'],
            [300, 300, 150, 20, 0, 'block-2-upper-start'],
            [400, 300, 50, 20, 0, SPINNER_BLOCK_ID, 'spinner'], 
            [400, 50, 100, 20, 1, 'trap-2-spikes'], 
            [50, 70, 30, 30, 0, PUSHABLE_BOX_ID, 'pushable'], 
            [300, 50, 150, 20, 0, 'block-2-after-pit'], 
            [500, 50, 150, 20, 0, 'block-2-safe-zone'], 
            [600, 450, 50, 20, 1, CRUSHING_TRAP_ID, 'crush-down'], 
            [700, 50, 50, 20, 0, BLUE_LIFT_ID, 'lift'], 
        ],
        exit: [700, 400, 20, 40], 
        mechanics: {
            teleportTarget: [300, 320], spinnerDuration: 50, crushTrapY: [450, 50], liftMovementY: [50, 400], liftSpeed: 2,
        }
    },
    3: { spawn: [50, 50], blocks: [[0, 0, 800, 50, 0, 'g']], exit: [750, 50, 20, 40] },
    4: { spawn: [50, 50], blocks: [[0, 0, 800, 50, 0, 'g']], exit: [750, 50, 20, 40] },
    5: { spawn: [50, 50], blocks: [[0, 0, 800, 50, 0, 'g']], exit: [750, 50, 20, 40] },
};


// --- DOM ELEMENTS ---
const introScreen = document.getElementById('intro-screen');
const glowingDoor = document.getElementById('glowing-door');
const tapText = document.getElementById('tap-text'); 
const typewriterScreen = document.getElementById('typewriter-screen');
const typewriterTextElement = document.getElementById('typewriter-text');
const continueBsdkButton = document.getElementById('continue-bsdk'); 
const transitionOverlay = document.getElementById('transition-overlay');
const levelSelect = document.getElementById('level-select'); 
const levelGrid = document.getElementById('level-grid');
const gameScreen = document.getElementById('game-screen');
const gameCanvas = document.getElementById('game-canvas');
const playerElement = document.getElementById('player');
const textOverlay = document.getElementById('text-overlay');


// --- INTRO/CINEMATIC LOGIC (FINALIZED SEQUENCE) ---

function initIntro() {
    setTimeout(() => {
        glowingDoor.classList.add('zoom-in');
        introScreen.classList.add('ready'); 
    }, 100); 
    
    glowingDoor.addEventListener('click', handleDoorTap);
    tapText.addEventListener('click', handleDoorTap);
}

function handleDoorTap() {
    gameState.tapCount++;
    if (gameState.tapCount === 1) {
        tapText.textContent = `...`; 
    }

    if (gameState.tapCount >= 2) {
        glowingDoor.removeEventListener('click', handleDoorTap);
        tapText.removeEventListener('click', handleDoorTap);
        glowingDoor.style.opacity = 0;
        introScreen.classList.add('white-flash');
        
        // **STEP 1: Orange Diffusion Transition**
        setTimeout(() => {
            introScreen.classList.add('hidden');
            typewriterScreen.classList.remove('hidden');
            
            // Set typewriter screen background to ORANGE for the message display
            typewriterScreen.style.backgroundColor = '#F86720'; 
            
            // Start the orange diffusion
            transitionOverlay.classList.remove('hidden');
            document.body.classList.add('diffuse-expand-orange'); 
            
            setTimeout(() => {
                document.body.classList.remove('diffuse-expand-orange');
                transitionOverlay.classList.add('hidden');
                
                // **STEP 2: Start BSDK Typewriter on the Orange Screen**
                startBSDKTypewriter();
                
            }, 1000); 
        }, 500); 
    }
}

function startBSDKTypewriter() {
    // White text on Orange BG (as requested)
    typewriterTextElement.style.color = '#fff'; 
    typewriterTextElement.textContent = ''; 
    
    // Start Typing BSDK Message
    type(0, BSDK_MESSAGE, BSDK_TYPING_SPEED, showContinueButton);
}

// Generic Typewriter function
function type(i, message, speed, callback) {
    if (i < message.length) {
        if (message.charAt(i) === '\n') {
            typewriterTextElement.innerHTML += '<br>';
        } else {
            typewriterTextElement.textContent += message.charAt(i);
        }
        typewriterTextElement.style.borderRight = 'none'; 
        
        setTimeout(() => {
            type(i + 1, message, speed, callback);
        }, speed);
    } else {
        setTimeout(callback, 500);
    }
}

function showContinueButton() {
    // Show the CONTINUE Button
    continueBsdkButton.classList.remove('hidden');
    continueBsdkButton.style.opacity = 1;
    
    // Set up the final transition when button is clicked/pressed
    continueBsdkButton.addEventListener('click', startFinalBlackDiffusion);
    document.addEventListener('keydown', handleContinueKey); 
}

function handleContinueKey(e) {
    if (e.code === 'Enter') {
        document.removeEventListener('keydown', handleContinueKey);
        startFinalBlackDiffusion(); 
    }
}

function startFinalBlackDiffusion() {
    continueBsdkButton.removeEventListener('click', startFinalBlackDiffusion);
    continueBsdkButton.classList.add('hidden');

    // **FINAL STEP: Black Diffusion to Level Select**
    transitionOverlay.classList.remove('hidden');
    document.body.classList.add('diffuse-expand-black'); 
    
    setTimeout(() => {
        typewriterScreen.classList.add('hidden');
        
        // Reset the typewriter screen background color 
        typewriterScreen.style.backgroundColor = ''; 
        
        // Proceed to Level Select
        showLevelSelect(); 
        
        document.body.classList.remove('diffuse-expand-black');
        transitionOverlay.classList.add('hidden');
    }, 1000);
}


// --- LEVEL SELECT LOGIC ---

function showLevelSelect() {
    levelSelect.classList.remove('hidden');
    generateLevelSelect();
    gameState.gameLoopRunning = false;
}

function generateLevelSelect() {
    levelGrid.innerHTML = '';
    
    for (let i = 1; i <= LEVEL_COUNT; i++) {
        const levelBox = document.createElement('div');
        levelBox.classList.add('level-box');
        levelBox.setAttribute('data-level', i);
        levelBox.innerHTML = `<span class="level-number">${i}</span>`;

        if (i <= gameState.unlockedLevels) {
            levelBox.classList.add('unlocked');
            levelBox.innerHTML += `<p>LEVEL</p>`;
            levelBox.addEventListener('click', () => startLevel(i)); 
        } else {
            levelBox.classList.add('locked');
            levelBox.innerHTML += `<p>LOCKED</p>`;
            levelBox.addEventListener('click', () => alert('Level is locked! Complete the previous one.'));
        }

        levelGrid.appendChild(levelBox);
    }
}


// --- GAME LOGIC ---

function startLevel(levelId) {
    levelSelect.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameState.currentLevel = levelId;
    
    restartLevel(); 

    if (!gameState.gameLoopRunning) {
        gameState.gameLoopRunning = true;
        gameLoop();
    }
}

function restartLevel() {
    gameState.player.dy = 0;
    gameState.player.dx = 0;
    gameState.player.onGround = false;
    gameState.isDead = false;
    
    // Reset player position
    const [startX, startY_bottom] = levels[gameState.currentLevel].spawn;
    gameState.player.x = startX;
    gameState.player.y = GAME_HEIGHT - startY_bottom - PLAYER_HEIGHT; 

    // Reset visuals
    gameCanvas.classList.remove('screen-shake');
    playerElement.classList.remove('player-crushed');
    playerElement.style.opacity = 1;

    // Reset Level Specific Mechanics
    if (gameState.currentLevel === 1) {
        gameState.pendulum = {
            ...levels[1].pendulum,
            active: false,
            time: 0,
            angle: 0,
            ballX: levels[1].pendulum.anchorX,
            ballY: levels[1].pendulum.anchorY + levels[1].pendulum.length,
        };
    }
    if (gameState.currentLevel === 2) {
        gameState.spinnerTimer = 0;
        const crushTrap = document.getElementById(CRUSHING_TRAP_ID);
        if (crushTrap) crushTrap.dataset.triggered = 'false';
    }

    renderLevelGeometry();
}

function renderLevelGeometry() {
    gameCanvas.innerHTML = `<div id="player"></div><div id="text-overlay" class="hidden">pain.</div>`;
    const currentLevelData = levels[gameState.currentLevel];
    
    // 1. Render Blocks and Traps
    currentLevelData.blocks.forEach(blockData => {
        const [x, y_bottom, w, h, isTrap, id, type] = blockData;
        const block = document.createElement('div');
        
        block.id = id;
        block.style.left = `${x}px`;
        block.style.width = `${w}px`;
        block.style.height = `${h}px`;
        block.style.top = `${GAME_HEIGHT - y_bottom - h}px`; 
        
        if (isTrap === 1) {
            block.classList.add('trap-block');
        } else if (type === 'rise') {
            block.classList.add('rise-block');
            block.dataset.initialY = parseInt(block.style.top);
            block.dataset.targetY = parseInt(document.getElementById('trap-crush-ceiling').style.top) + parseInt(document.getElementById('trap-crush-ceiling').style.height);
            block.dataset.triggered = 'false';
        } else if (type === 'spinner') {
            block.classList.add('game-block', 'spinner-block');
            block.style.backgroundColor = '#000'; // Black platform
        } else if (type === 'pushable') {
            block.classList.add('game-block', 'pushable-box');
            block.dataset.isPushable = 'true';
        } else if (type === 'lift') {
            block.classList.add('game-block', 'lift-block');
            block.dataset.yBottom = y_bottom;
            block.dataset.liftDirection = 'up';
        } else if (id === CRUSHING_TRAP_ID) {
            block.classList.add('trap-block');
            block.dataset.yStart = parseInt(block.style.top);
            block.dataset.yEnd = currentLevelData.mechanics.crushTrapY[1];
            block.dataset.triggered = 'false';
        } else {
            block.classList.add('game-block');
            block.style.backgroundColor = '#000'; // Standard platforms are BLACK
        }
        
        gameCanvas.appendChild(block);
    });

    // 2. Render Exit Door
    const [ex, ey_bottom, ew, eh] = currentLevelData.exit;
    const exitDoor = document.createElement('div');
    exitDoor.id = 'exit-door';
    exitDoor.classList.add('exit-door');
    exitDoor.style.left = `${ex}px`;
    exitDoor.style.width = `${ew}px`;
    exitDoor.style.height = `${eh}px`;
    exitDoor.style.top = `${GAME_HEIGHT - ey_bottom - eh}px`;
    gameCanvas.appendChild(exitDoor);

    // 3. Render Level 1 Pendulum
    if (gameState.currentLevel === 1) {
        const p = gameState.pendulum;
        // The rope (fixed point to ball)
        const rope = document.createElement('div');
        rope.id = PENDULUM_ID + '-rope';
        rope.classList.add('pendulum-rope');
        rope.style.position = 'absolute';
        rope.style.left = `${p.anchorX}px`;
        rope.style.top = `${p.anchorY}px`;
        rope.style.width = '2px';
        rope.style.height = `${p.length}px`; 
        rope.style.transformOrigin = 'top center';
        rope.style.transform = `rotate(${p.angle}rad)`;
        gameCanvas.appendChild(rope);
        
        // The ball (the hazard)
        const ball = document.createElement('div');
        ball.id = PENDULUM_ID + '-ball';
        ball.classList.add('pendulum-ball');
        ball.style.position = 'absolute';
        ball.style.width = '20px';
        ball.style.height = '20px';
        ball.style.borderRadius = '50%';
        ball.style.left = `${p.ballX - 10}px`;
        ball.style.top = `${p.ballY - 10}px`;
        gameCanvas.appendChild(ball);
    }
    
    // Re-append player and overlay to ensure highest Z-index
    gameCanvas.appendChild(playerElement);
    gameCanvas.appendChild(textOverlay);
}

function gameLoop() {
    if (gameState.isDead || !gameState.gameLoopRunning) return;

    // 1. Input Handling
    if (gameState.keys['a'] || gameState.keys['A'] || gameState.keys['ArrowLeft'] || gameState.touchHeld === 'left') {
        gameState.player.dx = -gameState.moveSpeed;
    } else if (gameState.keys['d'] || gameState.keys['D'] || gameState.keys['ArrowRight'] || gameState.touchHeld === 'right') {
        gameState.player.dx = gameState.moveSpeed;
    } else {
        gameState.player.dx = 0;
    }

    // Jump Logic (W, Space, or generic touch)
    if ((gameState.keys['w'] || gameState.keys['W'] || gameState.keys[' '] || gameState.jumpBuffer > 0) && (gameState.player.onGround || gameState.coyoteTime > 0)) {
        gameState.player.dy = gameState.jumpPower;
        gameState.player.onGround = false;
        gameState.coyoteTime = 0; 
        gameState.jumpBuffer = 0;
    }

    // 2. Apply Gravity and Movement
    gameState.player.dy += gameState.gravity;
    
    // Cap vertical speed
    if (gameState.player.dy > 15) gameState.player.dy = 15;

    // Apply movement
    gameState.player.x += gameState.player.dx;
    gameState.player.y += gameState.player.dy;

    // 3. Collision and Mechanics
    gameState.coyoteTime = Math.max(0, gameState.coyoteTime - 1);
    gameState.jumpBuffer = Math.max(0, gameState.jumpBuffer - 1);
    
    collisionCheck();
    updateLevelMechanics();
    
    // 4. Boundary Check (Death below floor)
    if (gameState.player.y > GAME_HEIGHT) {
        restartLevel();
        return;
    }

    // 5. Render Player Position
    playerElement.style.left = `${gameState.player.x}px`;
    playerElement.style.top = `${gameState.player.y}px`;
    
    // 6. Check Exit Condition
    const exitDoor = document.getElementById('exit-door');
    if (exitDoor) {
        const exitRect = exitDoor.getBoundingClientRect();
        const playerRect = playerElement.getBoundingClientRect();
        
        if (
            playerRect.left < exitRect.right && playerRect.right > exitRect.left &&
            playerRect.top < exitRect.bottom && playerRect.bottom > exitRect.top
        ) {
            winLevel();
            return;
        }
    }
    
    requestAnimationFrame(gameLoop);
}

function collisionCheck() {
    let player = gameState.player;
    let onGroundThisFrame = false;
    
    // Include all collision elements
    const allBlocks = gameCanvas.querySelectorAll('.game-block, .trap-block, .rise-block, .pendulum-ball, .pushable-box');
    
    const blockRects = Array.from(allBlocks).map(blockElement => {
         const x = parseInt(blockElement.style.left);
         const w = parseInt(blockElement.style.width || 20); 
         const h = parseInt(blockElement.style.height || 20); 
         const y = parseInt(blockElement.style.top);

        return {
            x: x, y: y, width: w, height: h,
            isTrap: blockElement.classList.contains('trap-block') || (blockElement.id === PENDULUM_ID + '-ball') || (blockElement.id === CRUSHING_TRAP_ID),
            isPushable: blockElement.dataset.isPushable === 'true',
            isTeleport: blockElement.id === TELEPORT_BLOCK_ID,
            element: blockElement,
        };
    });

    blockRects.forEach(block => {
        const isColliding = (
            player.x < block.x + block.width && player.x + player.width > block.x &&
            player.y < block.y + block.height && player.y + player.height > block.y
        );

        if (isColliding) {
            
            // 1. Trap Collision (Instant Death)
            if (block.isTrap) {
                restartLevel();
                return;
            }

            // 2. Teleport Block (Level 2)
            if (block.isTeleport) {
                const [targetX, targetY_bottom] = levels[2].mechanics.teleportTarget;
                player.x = targetX;
                player.y = GAME_HEIGHT - targetY_bottom - PLAYER_HEIGHT;
                player.dy = 0; 
                gameState.spinnerTimer = levels[2].mechanics.spinnerDuration;
            }

            // 3. Pushable Block (Level 2)
            if (block.isPushable && player.onGround && player.dx !== 0) {
                 block.element.style.left = `${block.x + player.dx}px`;
            }

            // 4. Standard Block/Platform Collision
            const x_overlap = Math.min(player.x + player.width, block.x + block.width) - Math.max(player.x, block.x);
            const y_overlap = Math.min(player.y + player.height, block.y + block.height) - Math.max(player.y, block.y);

            if (x_overlap < y_overlap) {
                // Horizontal collision
                if (player.x + player.width > block.x && player.x < block.x) {
                    player.x = block.x - player.width;
                } else if (player.x < block.x + block.width && player.x + player.width > block.x + block.width) {
                    player.x = block.x + block.width;
                }
                player.dx = 0;
            } else {
                // Vertical collision
                if (player.y + player.height > block.y && player.y < block.y) {
                    // Landed on platform
                    player.y = block.y - player.height;
                    player.dy = 0;
                    onGroundThisFrame = true;
                } else if (player.y < block.y + block.height && player.y + player.height > block.y + block.height) {
                    // Hit bottom of block (Head bump)
                    player.y = block.y + block.height;
                    player.dy = 0;
                }
            }
            
            // 5. Special Block Interaction: Rise Block Activation (Level 1)
            if (block.element.id === RISE_BLOCK_ID && block.element.dataset.triggered === 'false') {
                block.element.dataset.triggered = 'true';
                block.element.style.top = `${block.element.dataset.targetY}px`;
            }
        }
    });

    if (gameState.player.onGround && !onGroundThisFrame) {
        gameState.coyoteTime = 5;
    }
    gameState.player.onGround = onGroundThisFrame;
}

function updateLevelMechanics() {
    const player = gameState.player;
    const currentLevelData = levels[gameState.currentLevel];

    // --- Level 1 Logic ---
    if (gameState.currentLevel === 1) {
        const riseBlock = document.getElementById(RISE_BLOCK_ID);
        const spikes = document.getElementById('trap-crush-ceiling');
        
        // Rise Block Crush Check
        if (riseBlock && riseBlock.dataset.triggered === 'true' && spikes) {
            const spikeTop = parseInt(spikes.style.top) + parseInt(spikes.style.height);
            const riseBlockTop = parseInt(riseBlock.style.top);

            if (player.y < spikeTop && player.y + player.height > riseBlockTop) {
                restartLevel(); 
            }
        }

        // Pendulum Logic
        if (gameState.pendulum) {
            const rope = document.getElementById(PENDULUM_ID + '-rope');
            const ball = document.getElementById(PENDULUM_ID + '-ball');
            
            if (player.x > gameState.pendulum.hiddenUntilX && !gameState.pendulum.active) {
                gameState.pendulum.active = true;
                gameState.pendulum.time = 0;
            }

            if (gameState.pendulum.active) {
                gameState.pendulum.time += gameState.pendulum.speed;
                const angle = gameState.pendulum.swingAngle * Math.sin(gameState.pendulum.time);
                gameState.pendulum.angle = angle;
                
                const ballX = gameState.pendulum.anchorX + gameState.pendulum.length * Math.sin(angle);
                const ballY = gameState.pendulum.anchorY + gameState.pendulum.length * Math.cos(angle);
                
                gameState.pendulum.ballX = ballX;
                gameState.pendulum.ballY = ballY;

                if (rope) {
                    rope.style.transform = `rotate(${angle}rad)`;
                }
                if (ball) {
                    ball.style.left = `${ballX - 10}px`; 
                    ball.style.top = `${ballY - 10}px`;
                }
            }
        }
    }

    // --- Level 2 Logic ---
    if (gameState.currentLevel === 2) {
        // Spinner Logic 
        const spinner = document.getElementById(SPINNER_BLOCK_ID);
        if (spinner) {
            if (gameState.spinnerTimer > 0) {
                gameState.spinnerTimer--;
                
                const rotation = (levels[2].mechanics.spinnerDuration - gameState.spinnerTimer) * 7; 
                spinner.style.transform = `rotate(${rotation}deg)`;

                if (gameState.spinnerTimer <= 0) {
                    spinner.style.display = 'none';
                }
            } else {
                 spinner.style.display = 'block'; // Ensure it resets if player restarts
                 spinner.style.transform = 'rotate(0deg)';
            }
        }

        // Crushing Trap Logic
        const crushTrap = document.getElementById(CRUSHING_TRAP_ID);
        const safeZone = document.getElementById('block-2-safe-zone');
        if (crushTrap && safeZone) {
            const safeZoneRight = parseInt(safeZone.style.left) + parseInt(safeZone.style.width);

            // Trigger condition: Player is under the trap and moves right
            if (player.x + player.width > parseInt(crushTrap.style.left) && player.x < parseInt(crushTrap.style.left) + parseInt(crushTrap.style.width) && crushTrap.dataset.triggered === 'false') {
                crushTrap.dataset.triggered = 'true';
                // Drop instantly
                crushTrap.style.top = `${currentLevelData.mechanics.crushTrapY[1]}px`;
            }
            
            // If the trap is down, reset it when the player moves past the safe zone
            if (crushTrap.dataset.triggered === 'true' && player.x > safeZoneRight) {
                 crushTrap.dataset.triggered = 'false';
                 crushTrap.style.top = `${currentLevelData.mechanics.crushTrapY[0]}px`;
            }
        }

        // Lift Logic
        const lift = document.getElementById(BLUE_LIFT_ID);
        if (lift) {
            const liftTop = parseInt(lift.style.top);
            const liftBottom = liftTop + parseInt(lift.style.height);
            const liftYStart = GAME_HEIGHT - currentLevelData.mechanics.liftMovementY[0] - parseInt(lift.style.height);
            const liftYEnd = GAME_HEIGHT - currentLevelData.mechanics.liftMovementY[1] - parseInt(lift.style.height);

            let dy = 0;
            if (lift.dataset.liftDirection === 'up') {
                dy = -currentLevelData.mechanics.liftSpeed;
                if (liftTop <= liftYEnd) {
                    lift.dataset.liftDirection = 'down';
                }
            } else {
                dy = currentLevelData.mechanics.liftSpeed;
                if (liftTop >= liftYStart) {
                    lift.dataset.liftDirection = 'up';
                }
            }

            lift.style.top = `${liftTop + dy}px`;

            // Player moves with the lift if standing on it
            if (gameState.player.onGround && player.y + player.height === liftBottom && player.x + player.width > parseInt(lift.style.left) && player.x < parseInt(lift.style.left) + parseInt(lift.style.width)) {
                 player.y += dy;
            }
        }
    }
}

function winLevel() {
    gameState.isDead = true;
    gameState.gameLoopRunning = false;
    
    // Unlock the next level
    if (gameState.currentLevel < LEVEL_COUNT) {
        gameState.unlockedLevels = Math.max(gameState.unlockedLevels, gameState.currentLevel + 1);
        localStorage.setItem('unlockedLevels', gameState.unlockedLevels);
    }

    textOverlay.textContent = `LEVEL ${gameState.currentLevel} COMPLETE!`;
    textOverlay.classList.remove('hidden');
    textOverlay.classList.add('level-unlocked');

    // Return to level select after a delay
    setTimeout(() => {
        textOverlay.classList.add('hidden');
        textOverlay.classList.remove('level-unlocked');
        gameScreen.classList.add('hidden');
        showLevelSelect();
    }, 2000);
}


// --- INITIAL CALL ---
document.getElementById('back-to-levels').addEventListener('click', () => {
    gameState.gameLoopRunning = false;
    gameScreen.classList.add('hidden');
    showLevelSelect();
});
initIntro();