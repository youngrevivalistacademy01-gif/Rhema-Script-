/**
 * Rhema Script - Ultimate Edition
 * Fixes: Word-based numbers (one, two, etc.), Long pauses, and Multiple books.
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
let sessionTranscript = ""; 

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

// Map for word-to-number conversion
const wordToNum = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 
    'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50
};

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

// 2. The Smart Listener
recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        let text = event.results[i][0].transcript.toLowerCase();
        if (event.results[i].isFinal) {
            sessionTranscript += " " + text;
        } else {
            interim = text;
        }
    }
    const fullText = (sessionTranscript + " " + interim).trim();
    liveText.textContent = fullText;
    processSpeech(fullText);
};

function processSpeech(text) {
    // A. Convert word-numbers to digits (e.g., "six" -> "6")
    let processedText = text.toLowerCase();
    for (let word in wordToNum) {
        let reg = new RegExp(`\\b${word}\\b`, 'g');
        processedText = processedText.replace(reg, wordToNum[word]);
    }

    // B. Clean filler words
    const clean = processedText.replace(/first/g, "1").replace(/second/g, "2").replace(/third/g, "3")
                               .replace(/,/g, " ").replace(/chapter|verse|verses|and/gi, " ");

    // C. Book Match
    let foundBook = bibleBooks.find(book => clean.includes(book));
    if (!foundBook) return;

    // D. Extract Numbers
    const parts = clean.split(foundBook);
    const afterBook = parts[parts.length - 1];
    const numbers = afterBook.match(/\d+/g);

    if (numbers && numbers.length >= 2) {
        const ref = `${foundBook} ${numbers[0]}:${numbers[1]}`;
        if (ref !== lastFetched) {
            lastFetched = ref;
            fetchVerse(ref);
        }
    }
}

async function fetchVerse(ref) {
    try {
        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.text) {
            placeholder.style.display = 'none';
            referenceTitle.textContent = data.reference;
            verseContent.textContent = data.text;
            sessionTranscript = ""; // Clear memory after success
        }
    } catch (err) { console.error("API Error"); }
}

clearBtn.addEventListener('click', () => {
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    lastFetched = "";
    sessionTranscript = "";
    liveText.textContent = "Ready.";
});

recognition.onend = () => { if (isListening) recognition.start(); };
