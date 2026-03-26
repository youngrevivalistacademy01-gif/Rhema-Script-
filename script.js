/**
 * Rhema Script - Professional Bible Engine
 * Full 66-Book Dataset + Multi-Book Logic (1 Sam, 2 Sam, etc.)
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

// --- THE SOURCE OF TRUTH (All 66 Books) ---
const bibleBooks = [
    "1st samuel", "2nd samuel", "1st kings", "2nd kings", "1st chronicles", "2nd chronicles", 
    "1st corinthians", "2nd corinthians", "1st thessalonians", "2nd thessalonians", 
    "1st timothy", "2nd timothy", "1st peter", "2nd peter", "1st john", "2nd john", "3rd john",
    "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth", 
    "samuel", "kings", "chronicles", "ezra", "nehemiah", "esther", "job", "psalms", "psalm", 
    "proverbs", "ecclesiastes", "song of solomon", "isaiah", "jeremiah", "lamentations", 
    "ezekiel", "daniel", "hosea", "joel", "amos", "obadiah", "jonah", "micah", "nahum", 
    "habakkuk", "zephaniah", "haggai", "zechariah", "malachi", "matthew", "mark", "luke", 
    "john", "acts", "romans", "corinthians", "galatians", "ephesians", "philippians", 
    "colossians", "thessalonians", "timothy", "titus", "philemon", "hebrews", "james", 
    "peter", "jude", "revelation"
];

// 1. Controls
startBtn.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
        isListening = true;
        updateUI(true);
    } else {
        recognition.stop();
        isListening = false;
        updateUI(false);
    }
});

function updateUI(active) {
    startBtn.textContent = active ? "Stop Listening" : "Start Listening";
    startBtn.style.background = active ? "#ef4444" : "#a855f7";
    if (active) statusDot.classList.add('active'); else statusDot.classList.remove('active');
}

// 2. The Logic Fix
recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript = event.results[i][0].transcript.toLowerCase();
        // Replace spoken "1st" or "first" with "1" for the API
        transcript = transcript.replace(/first/g, "1").replace(/second/g, "2").replace(/third/g, "3");
        liveText.textContent = transcript;
        processSpeech(transcript);
    }
};

function processSpeech(text) {
    // 1. Clean the text of punctuation
    const cleanText = text.replace(/,/g, " ").replace(/:/g, " ");

    // 2. Find the Book
    let foundBook = "";
    for (let book of bibleBooks) {
        // We check for "1 samuel" or "samuel"
        let searchPattern = book.replace("1st", "1").replace("2nd", "2").replace("3rd", "3");
        if (cleanText.includes(searchPattern)) {
            foundBook = searchPattern;
            break; 
        }
    }

    if (!foundBook) return;

    // 3. Get numbers that appear AFTER the book name
    const afterBook = cleanText.split(foundBook)[1];
    if (!afterBook) return;

    const numbers = afterBook.match(/\d+/g);

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

// 3. API Fetch
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
        console.error("API Error", err);
    }
}

recognition.onend = () => { if (isListening) recognition.start(); };

clearBtn.addEventListener('click', () => {
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    lastFetched = "";
});
