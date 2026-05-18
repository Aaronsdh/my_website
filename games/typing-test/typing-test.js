const s = document.querySelector("#start-test");
const t = document.querySelector("#typing-input");
const q = document.querySelector("#quote");
const m = document.querySelector("#status-message");
const quotes = [
    'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
    'There is nothing more deceptive than an obvious fact.',
    'I ought to know by this time that when a fact appears to be opposed to a long train of deductions it invariably proves to be capable of bearing some other interpretation.',
    'I never make exceptions. An exception disproves the rule.',
    'What one man can invent another can discover.',
    'Nothing clears up a case so much as stating it to another person.',
    'Education never ends, Watson. It is a series of lessons, with the greatest for the last.',
    'The quick brown fox jumps over the lazy dog.',
    'Simplicity is the soul of efficiency.',
    'Knowledge is power.',
    'The limits of my language mean the limits of my world.'
];

let words = [];
let wordIndex = 0;
let startTime = Date.now();

const quoteElement = document.getElementById("quote");
const messageElement = document.getElementById("status-message");
const typingInput = document.getElementById("typing-input");

document.getElementById("start-test").addEventListener("click", () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    words = quote.split(' ');
    // reset word index for tracking which word the user is on
    wordIndex = 0;
    // each word is wrapped in a span for styling
    const spanWords = words.map(function (word) { return `<span>${word}</span>`; }).join(' ');
    // change the span to string and set it as the innerHTML on quote display
    quoteElement.innerHTML = spanWords;
    quoteElement.childNodes[0].classList.add('highlight');
    messageElement.textContent = '';
    typingInput.value = ' ';
    typingInput.focus();
    startTime = new Date().getTime();
});

t.addEventListener("input", () => {
    const currentWord = words[wordIndex];
    const typedValue = t.value;

    if (typedValue === currentWord && wordIndex === words.length - 1) {
        const elapsedTime = new Date().getTime() - startTime;
        const wpm = Math.round((words.length / (elapsedTime / 1000)) * 60);
        messageElement.textContent = `Test completed! Your WPM: ${wpm}`;
        t.value = '';
    } else if (typedValue.trim() === currentWord) {
        wordIndex++;
        t.value = '';
        for (const wordElement of quoteElement.childNodes) {
            wordElement.className = '';
        }
        // highlight the new word
        quoteElement.childNodes[wordIndex].className = 'highlight';
    } else if (currentWord.startsWith(typedValue)) {
        // currently correct
        // highlight the next word
        typedValueElement.className = '';
    } else {
        // error state
        typedValueElement.className = 'error';
    }
});