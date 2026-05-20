/*
Pub/Sub

Official design direction:
- Keep all event names and keyboard mappings in this file.
- Use eventEmitter to keep input publishers loosely coupled from gameplay code.
- Load this file before space-game.js so shared globals are available.
*/

// ---------------------------------------------------------------------------
// Global constants
// ---------------------------------------------------------------------------

// Add future gameplay events here before wiring subscribers in space-game.js.
const Messages = {
    ALLIANCE_SHIP_MOVED_LEFT: 'ALLIANCE_SHIP_MOVED_LEFT',
    ALLIANCE_SHIP_MOVED_RIGHT: 'ALLIANCE_SHIP_MOVED_RIGHT',
    ALLIANCE_SHIP_MOVED_UP: 'ALLIANCE_SHIP_MOVED_UP',
    ALLIANCE_SHIP_MOVED_DOWN: 'ALLIANCE_SHIP_MOVED_DOWN',
    ALLIANCE_SHIP_FIRED: 'ALLIANCE_SHIP_FIRED',
    COLLISION_ENEMY_LASER: 'COLLISION_ENEMY_LASER',
    COLLISION_ENEMY_ALLIANCE: 'COLLISION_ENEMY_ALLIANCE',
    PAUSE_TOGGLED: 'PAUSE_TOGGLED'
};

// Browser key names mapped to pub/sub messages.
const KeyboardMessages = {
    ArrowLeft: Messages.ALLIANCE_SHIP_MOVED_LEFT,
    ArrowRight: Messages.ALLIANCE_SHIP_MOVED_RIGHT,
    ArrowDown: Messages.ALLIANCE_SHIP_MOVED_DOWN,
    ArrowUp: Messages.ALLIANCE_SHIP_MOVED_UP,
    a: Messages.ALLIANCE_SHIP_MOVED_LEFT,
    d: Messages.ALLIANCE_SHIP_MOVED_RIGHT,
    s: Messages.ALLIANCE_SHIP_MOVED_DOWN,
    w: Messages.ALLIANCE_SHIP_MOVED_UP,
    A: Messages.ALLIANCE_SHIP_MOVED_LEFT,
    D: Messages.ALLIANCE_SHIP_MOVED_RIGHT,
    S: Messages.ALLIANCE_SHIP_MOVED_DOWN,
    W: Messages.ALLIANCE_SHIP_MOVED_UP,
    ' ': Messages.ALLIANCE_SHIP_FIRED,
    p: Messages.PAUSE_TOGGLED,
    P: Messages.PAUSE_TOGGLED
};

// ---------------------------------------------------------------------------
// Global mutable state
// ---------------------------------------------------------------------------

let eventEmitter;

// ---------------------------------------------------------------------------
// Event bus
// ---------------------------------------------------------------------------

class EventEmitter {
    constructor() {
        // Each event name maps to every listener registered for that event.
        this.listeners = {};
    }

    // Registers a listener function for the requested event name.
    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }

        this.listeners[message].push(listener);
    }

    // Broadcasts an event to every listener registered for that event name.
    emit(message, payload = null) {
        if (!this.listeners[message]) return;

        this.listeners[message].forEach(listener => listener(message, payload));
    }
}

// Creates the shared event bus instance used by the rest of the game.
function createEventEmitter() {
    return new EventEmitter();
}

// ---------------------------------------------------------------------------
// Keyboard publishing
// ---------------------------------------------------------------------------

// Converts browser key names into game events.
function getKeyboardMessage(key) {
    return KeyboardMessages[key];
}

// Publishes keyboard input as game events for subscribers in space-game.js.
function bindKeyboardEvents(target = window) {
    target.addEventListener('keydown', (event) => {
        const message = getKeyboardMessage(event.key);

        if (!message) return;

        event.preventDefault();
        eventEmitter.emit(message);
    });
}

eventEmitter = createEventEmitter();
