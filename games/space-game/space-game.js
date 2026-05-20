/*
Space Game

Official design direction:
- Keep global constants and mutable game state in their own sections.
- Use pub-sub.js for loose communication between input and gameplay.
- Use asset-handling.js for image paths and loading.
- Render polymorphically: every drawable game object implements render(ctx).
*/

// ---------------------------------------------------------------------------
// Global constants
// ---------------------------------------------------------------------------

const space = document.getElementById('Space');
const ctx = space.getContext('2d');

const SHIP_SIZE = 20;
const ALLIANCE_SHIP_START_X = 500;
const ALLIANCE_SHIP_START_Y = 360;
const ALLIANCE_SHIP_SPEED = 5;

const ENEMY_TOTAL = 5;
const ENEMY_ROWS = 5;
const ENEMY_SPACING_X = 98;
const ENEMY_SPACING_Y = 50;
const ENEMY_FALL_SPEED = 0.05;
const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING_X;
const START_X = (space.width - FORMATION_WIDTH) / 2;
const STOP_X = START_X + FORMATION_WIDTH;

const PROJECTILE_SPEED = 5;
const PROJECTILE_WIDTH = 5;
const PROJECTILE_HEIGHT = 20;
const ALLIANCE_FIRE_COOLDOWN = 3;
const COOLDOWN_TICK_MS = 100;

// ---------------------------------------------------------------------------
// Global mutable state
// ---------------------------------------------------------------------------

let allianceShip;
let loadedAssets;
let gameObjects = [];
let isPaused = false;

// ---------------------------------------------------------------------------
// Game object models
// ---------------------------------------------------------------------------

class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.dead = false;
        this.width = 0;
        this.height = 0;
        this.img = undefined;
    }

    // Returns the object's current collision box for future collision systems.
    rectFromGameObject() {
        return {
            top: this.y,
            left: this.x,
            bottom: this.y + this.height,
            right: this.x + this.width
        };
    }

    // Default no-op update keeps the game loop polymorphic for static objects.
    update() { }

    // Draws the object if it has an image; subclasses can override if needed.
    render(renderingContext) {
        if (!this.img) return;

        renderingContext.drawImage(
            this.img,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
}

class MovableObject extends GameObject {
    constructor(x, y, type) {
        super(x, y, type);
    }

    // Central movement primitive for controllable and self-moving objects.
    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }
}

class LaserBeam extends MovableObject {
    constructor(x, y, img) {
        super(x, y, 'Projectile');
        this.width = PROJECTILE_WIDTH;
        this.height = PROJECTILE_HEIGHT;
        this.img = img;
    }

    // Projectiles own their vertical movement so the loop stays generic.
    update() {
        this.y -= PROJECTILE_SPEED;
    }
}

class AllianceShip extends MovableObject {
    constructor(x, y, img) {
        super(x, y, 'AllianceShip');
        this.width = SHIP_SIZE;
        this.height = SHIP_SIZE;
        this.img = img;
        this.cooldown = 0;
    }

    // Creates a projectile when the ship is ready to fire.
    fire(projectileImg) {
        this.cooldown = ALLIANCE_FIRE_COOLDOWN;
        this.startFireCooldown();

        return new LaserBeam(this.x + 7, this.y - PROJECTILE_HEIGHT, projectileImg);
    }

    // Indicates whether the ship can currently create a projectile.
    canFire() {
        return this.cooldown === 0;
    }

    // Reduces the fire cooldown over time until another shot is allowed.
    startFireCooldown() {
        const cooldownTimerId = setInterval(() => {
            if (this.cooldown > 0) {
                this.cooldown -= 1;
            } else {
                clearInterval(cooldownTimerId);
            }
        }, COOLDOWN_TICK_MS);
    }
}

class AlienShip extends MovableObject {
    constructor(x, y, img) {
        super(x, y, 'AlienShip');
        this.width = SHIP_SIZE;
        this.height = SHIP_SIZE;
        this.img = img;
    }

    // Alien ships own their native downward movement.
    update() {
        this.y += ENEMY_FALL_SPEED;
    }
}

// ---------------------------------------------------------------------------
// Event subscriptions
// ---------------------------------------------------------------------------

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_LEFT, () => {
    if (isPaused || !allianceShip) return;

    allianceShip.moveTo(allianceShip.x - ALLIANCE_SHIP_SPEED, allianceShip.y);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_RIGHT, () => {
    if (isPaused || !allianceShip) return;

    allianceShip.moveTo(allianceShip.x + ALLIANCE_SHIP_SPEED, allianceShip.y);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_DOWN, () => {
    if (isPaused || !allianceShip) return;

    allianceShip.moveTo(allianceShip.x, allianceShip.y + ALLIANCE_SHIP_SPEED);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_UP, () => {
    if (isPaused || !allianceShip) return;

    allianceShip.moveTo(allianceShip.x, allianceShip.y - ALLIANCE_SHIP_SPEED);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_FIRED, () => {
    if (!allianceShip || !allianceShip.canFire() || isPaused) return;

    gameObjects.push(allianceShip.fire(loadedAssets.laserBeam));
});

eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (message, { projectile, alien }) => {
    projectile.dead = true;
    alien.dead = true;
});

eventEmitter.on(Messages.PAUSE_TOGGLED, () => {
    togglePause();
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

// Loads assets, creates initial objects, wires input, and starts the game loop.
async function init() {
    loadedAssets = await loadGameAssets();

    allianceShip = new AllianceShip(
        ALLIANCE_SHIP_START_X,
        ALLIANCE_SHIP_START_Y,
        loadedAssets.allianceShip
    );

    gameObjects.push(allianceShip);
    createAlienFormation(loadedAssets.alienShip);

    bindKeyboardEvents();
    gameLoop();
}

// Creates the initial enemy grid. Future formation variants can branch here.
function createAlienFormation(alienShipImg) {
    for (let x = START_X; x < STOP_X; x += ENEMY_SPACING_X) {
        for (let y = 0; y < ENEMY_SPACING_Y * ENEMY_ROWS; y += ENEMY_SPACING_Y) {
            gameObjects.push(new AlienShip(x, y, alienShipImg));
        }
    }
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------

// Runs one frame of the game, then schedules the next browser animation frame.
function gameLoop() {
    if(!isPaused){    
        updateGameObjects();
    }
    drawScene();
    requestAnimationFrame(gameLoop);
}

// Updates every game object through the shared object contract.
function updateGameObjects() {
    gameObjects.forEach(gameObject => {
        gameObject.update();
    });

    const projectiles = gameObjects.filter(gameObject => gameObject.type === 'Projectile');
    const aliens = gameObjects.filter(gameObject => gameObject.type === 'AlienShip');

    projectiles.forEach(projectile => {
        aliens.forEach(alien => {
            if (intersects(projectile.rectFromGameObject(), alien.rectFromGameObject())) {
                eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, { projectile, alien });
            }
        });
    });

    gameObjects = gameObjects.filter(gameObject => !gameObject.dead);
}

function togglePause() {
    isPaused = !isPaused;

    const menu = document.getElementById('Menu');
    
    if (isPaused) {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

// ---------------------------------------------------------------------------
// Collision helpers
// ---------------------------------------------------------------------------

// Tests whether two rectangle objects overlap; use rectFromGameObject() first.
function intersects(rectA, rectB) {
    return !(
        rectB.left > rectA.right ||
        rectB.right < rectA.left ||
        rectB.top > rectA.bottom ||
        rectB.bottom < rectA.top
    );
}
 

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

// Clears the canvas and renders every object through its render method.
function drawScene() {
    clearScene();

    gameObjects.forEach(gameObject => {
        gameObject.render(ctx);
    });
}

// Paints the frame background before game objects render.
function clearScene() {
    ctx.clearRect(0, 0, space.width, space.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, space.width, space.height);
}

init();
