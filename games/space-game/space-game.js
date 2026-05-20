/*
Space Game

This file owns game state, gameplay objects, event subscriptions, and rendering.
Shared event and asset helpers are loaded first by index.html.
*/

// ---------------------------------------------------------------------------
// Canvas and game constants
// ---------------------------------------------------------------------------

const space = document.getElementById('Space');
const ctx = space.getContext('2d');
const SHIP_SIZE = 20;
const ALLIANCE_SHIP_START_X = 100;
const ALLIANCE_SHIP_START_Y = 100;
const ALLIANCE_SHIP_SPEED = 5;
const ENEMY_TOTAL = 5;
const ENEMY_ROWS = 5;
const ENEMY_SPACING_X = 98;
const ENEMY_SPACING_Y = 50;
const ENEMY_FALL_SPEED = .05;
const FORMATION_WIDTH = ENEMY_TOTAL * ENEMY_SPACING_X;
const START_X = (space.width - FORMATION_WIDTH) / 2;
const STOP_X = START_X + FORMATION_WIDTH;


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
}

class MovableObject extends GameObject {
    constructor(x, y, type) {
        super(x, y, type);
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }
}

class AllianceShip extends MovableObject {
    constructor(x, y, img) {
        super(x, y, 'AllianceShip');
        this.width = SHIP_SIZE;
        this.height = SHIP_SIZE;
        this.img = img;
    }
}

class AlienShip extends MovableObject {
    constructor(x, y, img) {
        super(x, y, 'AlienShip');
        this.width = SHIP_SIZE;
        this.height = SHIP_SIZE;
        this.img = img;
    }

    update() {
        this.y += ENEMY_FALL_SPEED;
    }
}

// ---------------------------------------------------------------------------
// Mutable game state
// ---------------------------------------------------------------------------

let allianceShip;
let gameObjects = [];

// ---------------------------------------------------------------------------
// Event subscriptions
// ---------------------------------------------------------------------------

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_LEFT, () => {
    allianceShip.moveTo(allianceShip.x - ALLIANCE_SHIP_SPEED, allianceShip.y);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_RIGHT, () => {
    allianceShip.moveTo(allianceShip.x + ALLIANCE_SHIP_SPEED, allianceShip.y);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_DOWN, () => {
    allianceShip.moveTo(allianceShip.x, allianceShip.y + ALLIANCE_SHIP_SPEED);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_UP, () => {
    allianceShip.moveTo(allianceShip.x, allianceShip.y - ALLIANCE_SHIP_SPEED);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_FIRED, () => {
    console.log('The alliance ship has fired a projectile!');
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

async function init() {
    const assets = await loadGameAssets();

    allianceShip = new AllianceShip(ALLIANCE_SHIP_START_X, ALLIANCE_SHIP_START_Y, assets.allianceShip);

    gameObjects.push(allianceShip);

    bindKeyboardEvents();
    createAlienFormation(assets.alienShip);
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

function gameLoop() {
    draw();
    update();
    requestAnimationFrame(gameLoop);
}

function update() {
    gameObjects.forEach(object => {
        if (object.update) object.update();
    });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function draw() {
    ctx.clearRect(0, 0, space.width, space.height);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, space.width, space.height);

    gameObjects.forEach(alienShip => {
        ctx.drawImage(
            alienShip.img,
            alienShip.x,
            alienShip.y,
            alienShip.width,
            alienShip.height
        );
    });
}

init();
