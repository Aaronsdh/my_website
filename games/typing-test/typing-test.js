/*
Typing Test

Typing tests usually report speed as words per minute (WPM), but a "word" is
standardized as 5 typed characters instead of a natural-language words. That
keeps short words and long words from making the score feel random.

This game is event driven:
1. The user clicks Start Test.
2. The app builds a long stream of words from random quotes.
3. Each input event stores what the user has typed for the current word.
4. Rendering compares typed letters with expected letters and assigns each
   letter a visual state.
5. Pressing space submits the current word, updates score totals, and advances
   to the next word.
6. When the timer ends, the app calculates raw WPM, accuracy, and adjusted WPM.
*/

const QUOTES = [
    "When you have eliminated the impossible, whatever remains, however improbable, must be the truth.",
    "Age is an issue of mind over matter. If you don't mind, it doesn't matter.",
    "The world is full of obvious things which nobody by any chance ever observes.",
    "Anyone who stops learning is old, whether at twenty or eighty. Anyone who keeps learning stays young.",
    "It is better to be hated for what you are than to be loved for what you are not.",
    "There is nothing more deceptive than an obvious fact.",
    "I ought to know by this time that when a fact appears to be opposed to a long train of deductions it invariably proves to be capable of bearing some other interpretation.",
    "I never make exceptions. An exception disproves the rule.",
    "What one man can invent another can discover.",
    "Old age is fifteen years older than I am.",
    "It is not a lack of love, but a lack of friendship that makes unhappy marriages.",
    "Nothing clears up a case so much as stating it to another person.",
    "Education never ends, Watson. It is a series of lessons, with the greatest for the last.",
    "The quick brown fox jumps over the lazy dog.",
    "Simplicity is the soul of efficiency.",
    "At twenty years of age the will reigns at thirty, the wit and at forty, the judgment.",
    "Some say that the age of chivalry is past, that the spirit of romance is dead.",
    "Knowledge is power.",
    "Old age is just a record of one's whole life.",
    "A friend is someone who knows all about you and still loves you.",
    "We accept the love we think we deserve.",
    "Thomas Jefferson once said, 'We should never judge a president by his age, only by his works.'",
    "No matter what age you are, or what your circumstances might be, you are special.",
    "The limits of my language mean the limits of my world."
];

const CHARS_PER_STANDARD_WORD = 5;
const LEADERBOARD_STORAGE_KEY = "typingTestLeaderboard";
const LEADERBOARD_LIMIT = 5;
const TIMER_TICK_MS = 1000;
const WORD_STREAM_LENGTH = 300;
const KEY_LABELS = {
    " ": "space"
};

const elements = {
    startButton: document.querySelector("#start-button"),
    userInput: document.querySelector("#user-input"),
    quote: document.querySelector("#quote"),
    statusMessage: document.querySelector("#status-message"),
    timer: document.querySelector("#timer"),
    durationSelector: document.querySelector("#test-duration"),
    latestScore: document.querySelector("#latest-score"),
    latestDetail: document.querySelector("#latest-detail"),
    leaderboardList: document.querySelector("#leaderboard-list"),
    keys: document.querySelectorAll("[data-key]")
};

const state = {
    words: [],
    typedWords: [],
    wordElements: [],
    wordIndex: 0,
    timeLeft: 0,
    testDuration: 60,
    totalTyped: 0,
    mistakes: 0,
    missedKeys: {},
    timerId: null,
    isRunning: false
};

bindEvents();
renderLeaderboard();

// Connects DOM events to the game logic once the script loads.
function bindEvents() {
    elements.startButton.addEventListener("click", () => {
        startGame(Number(elements.durationSelector.value));
    });

    elements.userInput.addEventListener("input", handleTyping);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearPressedKeys);
}

// Starts a fresh typing test and resets all mutable game state.
function startGame(duration = 60) {
    state.words = buildWordStream();
    state.typedWords = [];
    state.wordElements = [];
    state.wordIndex = 0;
    state.timeLeft = duration;
    state.testDuration = duration;
    state.totalTyped = 0;
    state.mistakes = 0;
    state.missedKeys = {};
    state.isRunning = true;

    renderWords();
    resetInput();
    renderCurrentWord();
    startTimer();
}

// Stores the user's current input, then submits the word when space is pressed.
function handleTyping() {
    if (!state.isRunning) return;

    state.typedWords[state.wordIndex] = elements.userInput.value.trimEnd();

    if (elements.userInput.value.endsWith(" ")) {
        submitCurrentWord();
        return;
    }

    renderCurrentWord();
}

// Lights up the matching visual keyboard key while a physical key is pressed.
function handleKeyDown(event) {
    const keyElement = getKeyboardKey(event.key);

    if (!keyElement) return;

    keyElement.classList.add("is-pressed");
}

// Turns off the matching visual keyboard key when the physical key is released.
function handleKeyUp(event) {
    const keyElement = getKeyboardKey(event.key);

    if (!keyElement) return;

    keyElement.classList.remove("is-pressed");
}

// Clears keyboard highlights when the browser loses focus mid-keypress.
function clearPressedKeys() {
    elements.keys.forEach((keyElement) => {
        keyElement.classList.remove("is-pressed");
    });
}

// Finds the visual key that matches a KeyboardEvent key value.
function getKeyboardKey(key) {
    const normalizedKey = key.length === 1 ? key.toLowerCase() : key;

    return [...elements.keys].find((keyElement) => {
        return keyElement.dataset.key === normalizedKey;
    });
}

// Builds enough words for a full timed test by combining random quotes.
function buildWordStream() {
    const stream = [];

    while (stream.length < WORD_STREAM_LENGTH) {
        stream.push(...getRandomQuote().split(" "));
    }

    return stream.slice(0, WORD_STREAM_LENGTH);
}

// Returns one quote at random from the local quote bank.
function getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[randomIndex];
}

// Clears any old timer and begins counting down once per second.
function startTimer() {
    clearInterval(state.timerId);
    renderTimer();

    state.timerId = setInterval(() => {
        state.timeLeft--;
        renderTimer();

        if (state.timeLeft <= 0) {
            endGame();
        }
    }, TIMER_TICK_MS);
}

// Stops the test and displays the final speed and accuracy metrics.
function endGame() {
    if (!state.isRunning) return;

    finalizeCurrentWord();
    clearInterval(state.timerId);
    state.timerId = null;
    state.isRunning = false;
    elements.userInput.disabled = true;

    const results = calculateResults();

    saveScore(results);
    renderScoreSummary(results);
    renderLeaderboard();

    elements.statusMessage.textContent =
        `Raw WPM: ${results.rawWpm} | Accuracy: ${results.accuracy}% | Adjusted WPM: ${results.adjustedWpm}`;
}

// Scores the current word, freezes its letter colors, and advances the cursor.
function submitCurrentWord() {
    const typedWord = elements.userInput.value.trim();
    const currentWord = state.words[state.wordIndex];

    submitWord(state.wordIndex, typedWord, currentWord);

    state.wordIndex++;
    elements.userInput.value = "";

    if (state.wordIndex >= state.words.length) {
        endGame();
        return;
    }

    renderCurrentWord();
}

// Counts only the typed portion of an unfinished word when time expires.
function finalizeCurrentWord() {
    const typedWord = elements.userInput.value.trim();
    const currentWord = state.words[state.wordIndex];

    if (!typedWord || !currentWord) return;

    submitWord(state.wordIndex, typedWord, currentWord, typedWord.length);
    renderCurrentWord();
    elements.userInput.value = "";
}

// Records a word in state, updates score totals, and freezes its visual state.
function submitWord(index, typedWord, currentWord, scoreLength) {
    state.typedWords[index] = typedWord;
    scoreSubmittedWord(typedWord, currentWord, scoreLength);
    renderSubmittedWord(index);
}

// Creates the visible word and character spans from the generated word stream.
function renderWords() {
    const fragment = document.createDocumentFragment();

    elements.quote.replaceChildren();
    state.wordElements = [];

    state.words.forEach((word, index) => {
        if (index > 0) {
            fragment.append(" ");
        }

        const wordElement = createWordElement(word);

        state.wordElements.push(wordElement);
        fragment.append(wordElement);
    });

    elements.quote.append(fragment);
}

// Creates one word span and wraps each character so it can be styled separately.
function createWordElement(word) {
    const wordElement = document.createElement("span");
    wordElement.className = "word";

    for (const letter of word) {
        const letterElement = document.createElement("span");
        letterElement.className = "char";
        letterElement.textContent = letter;
        wordElement.append(letterElement);
    }

    return wordElement;
}

// Prepares the input field for a new test.
function resetInput() {
    elements.statusMessage.textContent = "Typing...";
    elements.userInput.disabled = false;
    elements.userInput.value = "";
    elements.userInput.focus();
}

// Updates the countdown display from the current state.
function renderTimer() {
    elements.timer.textContent = `Time: ${state.timeLeft}s`;
}

// Renders the word the user is currently typing.
function renderCurrentWord() {
    renderWord(state.wordIndex, state.typedWords[state.wordIndex] || "", true);
}

// Renders a submitted word so its final correct/error states stay visible.
function renderSubmittedWord(index) {
    renderWord(index, state.typedWords[index] || "", false);
}

// Applies the correct visual class to each letter in a word.
function renderWord(index, typedWord, isCurrent) {
    const currentWord = state.words[index];
    const wordElement = state.wordElements[index];

    if (!currentWord || !wordElement) return;

    for (let i = 0; i < currentWord.length; i++) {
        const letterElement = wordElement.children[i];
        const status = getLetterStatus(currentWord, typedWord, i, isCurrent);

        letterElement.className = `char ${status}`.trim();
    }
}

// Decides whether one letter should look completed, incorrect, highlighted, or untouched.
function getLetterStatus(currentWord, typedWord, letterIndex, isCurrent) {
    const typedLetter = typedWord[letterIndex];

    if (typedLetter === currentWord[letterIndex]) {
        return "completed";
    }

    if (typedLetter !== undefined || !isCurrent) {
        return "error";
    }

    if (letterIndex === typedWord.length) {
        return "highlight";
    }

    return "";
}

// Adds one submitted word to the running totals used for final scoring.
function scoreSubmittedWord(typedWord, currentWord, scoreLength) {
    const scoredLength = scoreLength ?? Math.max(typedWord.length, currentWord.length);

    state.totalTyped += scoredLength;

    for (let i = 0; i < scoredLength; i++) {
        if (typedWord[i] !== currentWord[i]) {
            state.mistakes++;
            trackMissedKey(currentWord[i]);
        }
    }
}

// Counts which expected keys were missed so score history can show weak spots.
function trackMissedKey(expectedKey) {
    if (expectedKey === undefined) return;

    const normalizedKey = expectedKey.toLowerCase();

    state.missedKeys[normalizedKey] = (state.missedKeys[normalizedKey] || 0) + 1;
}

// Converts raw character counts into user-facing typing results.
function calculateResults() {
    const minutes = state.testDuration / 60;
    const correctChars = Math.max(state.totalTyped - state.mistakes, 0);
    const rawWpm = Math.round((state.totalTyped / CHARS_PER_STANDARD_WORD) / minutes);
    const accuracy = state.totalTyped === 0
        ? 100
        : Math.round((correctChars / state.totalTyped) * 100);
    const adjustedWpm = Math.round(rawWpm * (accuracy / 100));

    return {
        rawWpm,
        accuracy,
        adjustedWpm,
        duration: state.testDuration,
        missedKeys: getTopMissedKeys(state.missedKeys)
    };
}

// Returns the top missed keys in descending order, capped for compact display.
function getTopMissedKeys(missedKeys) {
    return Object.entries(missedKeys)
        .sort((firstMiss, secondMiss) => {
            return secondMiss[1] - firstMiss[1];
        })
        .slice(0, 3)
        .map(([key, count]) => {
            return { key, count };
        });
}

// Shows the most recent completed run in the score panel.
function renderScoreSummary(results) {
    const latestDetailText = `${results.accuracy}% accuracy | raw ${results.rawWpm}`;

    elements.latestScore.textContent = `${results.adjustedWpm} WPM`;
    elements.latestDetail.replaceChildren(latestDetailText);

    if (results.missedKeys.length > 0) {
        elements.latestDetail.append(createMissedKeysElement(results.missedKeys));
    }
}

// Saves the best local scores and drops the lowest entry when the board is full.
function saveScore(results) {
    const scores = getSavedScores();

    scores.push({
        adjustedWpm: results.adjustedWpm,
        rawWpm: results.rawWpm,
        accuracy: results.accuracy,
        duration: results.duration,
        missedKeys: results.missedKeys,
        createdAt: Date.now()
    });

    scores.sort(compareScores);

    localStorage.setItem(
        LEADERBOARD_STORAGE_KEY,
        JSON.stringify(scores.slice(0, LEADERBOARD_LIMIT))
    );
}

// Reads leaderboard data defensively in case localStorage has invalid data.
function getSavedScores() {
    try {
        const savedScores = JSON.parse(localStorage.getItem(LEADERBOARD_STORAGE_KEY)) || [];

        return savedScores.map(normalizeSavedScore).sort(compareScores);
    } catch {
        return [];
    }
}

// Keeps older saved scores compatible after leaderboard fields change.
function normalizeSavedScore(score) {
    return {
        adjustedWpm: score.adjustedWpm,
        rawWpm: score.rawWpm || score.adjustedWpm,
        accuracy: score.accuracy,
        duration: score.duration,
        missedKeys: score.missedKeys || [],
        createdAt: score.createdAt || 0
    };
}

// Ranks higher WPM first, then prefers newer games when scores tie.
function compareScores(firstScore, secondScore) {
    if (secondScore.adjustedWpm !== firstScore.adjustedWpm) {
        return secondScore.adjustedWpm - firstScore.adjustedWpm;
    }

    return secondScore.createdAt - firstScore.createdAt;
}

// Renders saved scores into the side panel.
function renderLeaderboard() {
    const scores = getSavedScores();

    elements.leaderboardList.replaceChildren();

    if (scores.length === 0) {
        const emptyItem = document.createElement("li");

        emptyItem.textContent = "No scores yet";
        elements.leaderboardList.append(emptyItem);
        return;
    }

    scores.forEach((score) => {
        const scoreItem = document.createElement("li");

        scoreItem.append(
            createScoreLine(`${score.adjustedWpm} WPM`, "strong"),
            createScoreLine(`Raw ${score.rawWpm} | ${score.accuracy}% | ${score.duration}s`, "span")
        );

        if (score.missedKeys.length > 0) {
            scoreItem.append(createMissedKeysElement(score.missedKeys));
        }

        elements.leaderboardList.append(scoreItem);
    });
}

// Creates score text nodes without using HTML strings.
function createScoreLine(text, tagName) {
    const scoreLine = document.createElement(tagName);

    scoreLine.textContent = text;
    return scoreLine;
}

// Builds the chip row used by leaderboard entries with missed keys.
function createMissedKeysElement(missedKeys) {
    const missedKeysElement = document.createElement("div");
    const missedKeysLabel = document.createElement("span");

    missedKeysElement.className = "missed-keys";
    missedKeysLabel.textContent = "Missed";
    missedKeysElement.append(missedKeysLabel);

    missedKeys.forEach((missedKey) => {
        const keyChip = document.createElement("span");

        keyChip.className = "missed-key";
        keyChip.textContent = formatKeyLabel(missedKey.key);
        missedKeysElement.append(keyChip);
    });

    return missedKeysElement;
}

// Keeps whitespace and punctuation readable in the missed-key display.
function formatKeyLabel(key) {
    return KEY_LABELS[key] || key;
}
