// Base classes
class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
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


// Specific class types
class AllianceShip extends MovableObject {
    constructor(x, y) {
        super(x, y, 'AllianceShip');
    }
}

class AlienShip extends MovableObject {
    constructor(x, y) {
        super(x, y, 'AlienShip');
    }
}

class Asteroid extends MovableObject {
    constructor(x, y) {
        super(x, y, 'Asteroid');
    }
}

class something extends GameObject {
    constructor(x, y) {
        super(x, y, 'something');
    }
}


// Event System, handles communication between the game objects and user input.
class EventEmitter {
    constructor() {
        // Create a key-value store. The key, the message, is an event-type and it will enable access to its own array of functions.
        this.listeners = {};
    }

    // Registers a listener function of the type defined by the message, so, it can be stored and called later when the message is emitted.
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }
    
    // Broadcast messages/events to all relevant listeners, the message selects the array of listeners that will be called.
    // Optionally, a payload containing information can be passed to the listeners.
    emit(message, payload = null) {
        if (this.listeners[message]) {
            this.listeners[message].forEach(listener => listener(message, payload));
        }
    }
}

// Event types
const Messages = {
    ALLIANCE_SHIP_MOVED_LEFT: 'ALLIANCE_SHIP_MOVED_LEFT',
    ALLIANCE_SHIP_MOVED_RIGHT: 'ALLIANCE_SHIP_MOVED_RIGHT',
    ALLIANCE_SHIP_MOVED_UP: 'ALLIANCE_SHIP_MOVED_UP',
    ALLIANCE_SHIP_MOVED_DOWN: 'ALLIANCE_SHIP_MOVED_DOWN',
    ALLIANCE_SHIP_FIRED: 'ALLIANCE_SHIP_FIRED',
    ALLIANCE_SHIP_DESTROYED: 'ALLIANCE_SHIP_DESTROYED',
    ALIEN_SHIP_DESTROYED: 'ALIEN_SHIP_DESTROYED',
    ASTEROID_DESTROYED: 'ASTEROID_DESTROYED',
    ALLIANCE_SHIP_COLLIDED: 'ALLIANCE_SHIP_COLLIDED',
    ALIEN_SHIP_COLLIDED: 'ALIEN_SHIP_COLLIDED',
    ASTEROID_COLLIDED: 'ASTEROID_COLLIDED',
    ALIEN_SHIP_GENERATED: 'ALIEN_SHIP_GENERATED',
    ASTEROID_GENERATED: 'ASTEROID_GENERATED',
}


// Subscribers, 'event handlers' or listeners that react to events emitted by the emitter.
const eventEmitter = new EventEmitter();

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_LEFT, () => {
    allianceShip.moveTo(allianceShip.x - 5, allianceShip.y);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_RIGHT, () => {
    allianceShip.moveTo(allianceShip.x + 5, allianceShip.y);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_DOWN, () => {
    allianceShip.moveTo(allianceShip.x, allianceShip.y + 5);
});

eventEmitter.on(Messages.ALLIANCE_SHIP_MOVED_UP, () => {
    allianceShip.moveTo(allianceShip.x, allianceShip.y - 5);
});

eventEmitter.on(Messages.ALIEN_SHIP_GENERATED, () => {
    const x = Math.random() * 400;
    const y = Math.random() * 400;
    const alienShip = new AlienShip(x, y);
    ctx.fillRect(alienShip.x, alienShip.y, 20, 20);
});

eventEmitter.on(Messages.ASTEROID_GENERATED, () => {
 //
});

eventEmitter.on(Messages.ALLIANCE_SHIP_FIRED, () => {
    console.log('The alliance ship has fired a projectile!');
});


// Connect user interaction to event-types
window.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowLeft': eventEmitter.emit(Messages.ALLIANCE_SHIP_MOVED_LEFT); break;
        case 'ArrowRight': eventEmitter.emit(Messages.ALLIANCE_SHIP_MOVED_RIGHT); break;
        case 'ArrowDown': eventEmitter.emit(Messages.ALLIANCE_SHIP_MOVED_DOWN); break;
        case 'ArrowUp': eventEmitter.emit(Messages.ALLIANCE_SHIP_MOVED_UP); break;
        case ' ': eventEmitter.emit(Messages.ALLIANCE_SHIP_FIRED); break;
    }
});

// Doing things
const space = document.getElementById('Space');
const ctx = space.getContext('2d');
const allianceShip = new AllianceShip(100, 100);
const path_to_alliance_ship = '../assets/images/alliance-ship.png';
const path_to_alien_ship = '../assets/images/alien-ship.png';

allianceShip.moveTo(150, 150);

async function renderGameScreen() {
  try {
    // Load game assets
    const allianceShipImg = await loadAsset(path_to_alliance_ship);
    const alienShipImg = await loadAsset(path_to_alien_ship);

    // Get canvas and context
    const canvas = document.getElementById("Space");
    const ctx = canvas.getContext("2d");

    // Draw images to specific positions
    ctx.drawImage(allianceShipImg, canvas.width / 2, canvas.height / 2);
    ctx.drawImage(alienShipImg, 10, 10);
  } catch (error) {
    console.error('Failed to render game screen:', error);
  }
}

renderGameScreen();