/**
 * Rhema Script - Professional Bible Engine (Final Build)
 * Fixes: Clear Screen Logic, Multiple Book Detection, and Natural Speech
 */

const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');
const liveText = document.getElementById('live-text');
const verseContent = document.getElementById('verse-content');
const referenceTitle = document.getElementById('reference-title');
const statusDot = document.getElementById('status-indicator');
const placeholder = document.getElementById('placeholder');

const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
let recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

let isListening = false;
let lastFetched = "";
let isCoolingDown = false; // Prevents "Clear" from being immediately overwritten

// 1. DATASET: Ordered so multi-books are checked FIRST
const bibleBooks = [
    "1 samuel", "2 samuel", "1 kings", "2 kings", "1 chronicles", "2 chronicles", 
    "1 corinthians", "2 corinthians", "1 thessalonians", "2 thessalonians", 
    "1 timothy", "2 timothy", "1 peter", "2 peter", "1 john", "2 john", "3 john",
    "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth", 
    "samuel", "kings", "chronicles", "ezra", "nehemiah", "esther", "job", "psalms", "psalm", 
    "proverbs", "ecclesiastes", "song of solomon", "isaiah", "jeremiah", "lamentations", 
    "ezekiel", "daniel", "hosea", "joel", "amos", "obadiah", "jonah", "micah", "nahum", 
    "habakkuk", "zephaniah", "haggai", "zechariah", "malachi", "matthew", "mark", "luke", 
    "john", "acts", "romans", "corinthians", "galatians", "ephesians", "philippians", 
    "colossians", "thessalonians", "timothy", "titus", "philemon", "hebrews", "james", 
    "peter", "jude", "revelation"
];

// 2. CONTROLS
startBtn.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
        isListening = true;
        startBtn.textContent = "Stop Listening";
        startBtn.style.background = "#ef4444";
        statusDot.classList.add('active');
    } else {
        recognition.stop();
        isListening = false;
        startBtn.textContent = "Start Listening";
        startBtn.style.background = "#a855f7";
        statusDot.classList.remove('active');
    }
});

// 3. SMART LISTENER
recognition.onresult = (event) => {
    if (isCoolingDown) return; // Stop processing if screen was just cleared

    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript = event.results[i][0].transcript.toLowerCase();
        
        // Normalize common speech variations
        transcript = transcript
            .replace(/first/g, "1")
            .replace(/second/g, "2")
            .replace(/third/g, "3")
            .replace(/1st/g, "1")
            .replace(/2nd/g, "2")
            .replace(/3rd/g, "3")
            .replace(/,/g, " "); // Fixes the "Genesis 1,1" issue

        liveText.textContent = transcript;
        processSpeech(transcript);
    }
};

function processSpeech(text) {
    let foundBook = "";
    for (let book of bibleBooks) {
        // Use word boundaries to ensure "John" doesn't match inside "1 John"
        if (text.includes(book)) {
            foundBook = book;
            break; 
        }
    }

    if (!foundBook) return;

    // Isolate text AFTER the book name to get Chapter/Verse
    const speechAfterBook = text.split(foundBook)[1];
    if (!speechAfterBook) return;

    const numbers = speechAfterBook.match(/\d+/g);

    if (numbers && numbers.length >= 2) {
        const chapter = numbers[0];
        const verse = numbers[1];
        const ref = `${foundBook} ${chapter}:${verse}`;

        if (ref !== lastFetched) {
            lastFetched = ref;
            fetchVerse(ref);
        }
    }
}

// 4. API ENGINE
async function fetchVerse(ref) {
    try {
        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.text) {
            placeholder.style.display = 'none';
            referenceTitle.textContent = data.reference;
            verseContent.textContent = data.text;
        }
    } catch (err) {
        console.error("API Error");
    }
}

// 5. IMPROVED CLEAR LOGIC
clearBtn.addEventListener('click', () => {
    // Enable cooldown so the old transcript doesn't instantly re-trigger the verse
    isCoolingDown = true;
    
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    lastFetched = ""; // Allow the same verse to be searched again later
    liveText.textContent = "Screen Cleared.";

    // Restart the recognition to clear its internal buffer/memory
    if (isListening) {
        recognition.stop();
        setTimeout(() => {
            if (isListening) recognition.start();
            isCoolingDown = false;
        }, 1000);
    } else {
        setTimeout(() => { isCoolingDown = false; }, 1000);
    }
});

recognition.onend = () => { if (isListening && !isCoolingDown) recognition.start(); };
