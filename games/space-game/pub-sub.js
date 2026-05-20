/*
Pub/Sub

This file owns the small event bus used by the game. Keep event names here so
input handling, gameplay objects, and rendering code do not need to call each
other directly as the game grows.
*/

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
        if (this.listeners[message]) {
            this.listeners[message].forEach(listener => listener(message, payload));
        }
    }
}

// ---------------------------------------------------------------------------
// Game events
// ---------------------------------------------------------------------------

// Add future gameplay events here before wiring subscribers in space-game.js.
const Messages = {
    ALLIANCE_SHIP_MOVED_LEFT: 'ALLIANCE_SHIP_MOVED_LEFT',
    ALLIANCE_SHIP_MOVED_RIGHT: 'ALLIANCE_SHIP_MOVED_RIGHT',
    ALLIANCE_SHIP_MOVED_UP: 'ALLIANCE_SHIP_MOVED_UP',
    ALLIANCE_SHIP_MOVED_DOWN: 'ALLIANCE_SHIP_MOVED_DOWN',
    ALLIANCE_SHIP_FIRED: 'ALLIANCE_SHIP_FIRED',
};

// Shared event bus instance loaded before space-game.js in index.html.
const eventEmitter = new EventEmitter();

// ---------------------------------------------------------------------------
// Keyboard publishing
// ---------------------------------------------------------------------------

// Convert browser key names into game events. Add new controls here first.
function getKeyboardMessage(key) {
    const keyboardMessages = {
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
    };

    return keyboardMessages[key];
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
