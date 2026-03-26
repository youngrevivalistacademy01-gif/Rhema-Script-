/**
 * Rhema Script - Omni-Logic (Full Feature Set)
 * NO FUNCTIONS REMOVED. ALL PREVIOUS FIXES INTEGRATED.
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
recognition.lang = 'en-US';

let isListening = false;
let lastFetched = "";
let speechBuffer = ""; // Maintains memory during long pauses
let isCoolingDown = false; // Protects Clear Screen logic

// 1. DATASET: Full 66 Books + Word-to-Number Map
const wordToNum = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 
    'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50
};

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

// 2. CONTROLS: Toggle Start/Stop
startBtn.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
        isListening = true;
        updateUI(true);
    } else {
        recognition.stop();
        isListening = false;
        updateUI(false);
        speechBuffer = ""; 
    }
});

function updateUI(active) {
    startBtn.textContent = active ? "Stop Listening" : "Start Listening";
    startBtn.style.background = active ? "#ef4444" : "#a855f7";
    if (active) statusDot.classList.add('active'); else statusDot.classList.remove('active');
}

// 3. THE LISTENER: Continuous Buffering
recognition.onresult = (event) => {
    if (isCoolingDown) return; 

    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        let text = event.results[i][0].transcript.toLowerCase();
        if (event.results[i].isFinal) {
            speechBuffer += " " + text;
        } else {
            interim = text;
        }
    }
    const fullText = (speechBuffer + " " + interim).trim();
    liveText.textContent = fullText;
    processSpeech(fullText);
};

// 4. THE BRAIN: Sanitization & Matching
function processSpeech(text) {
    // A. Fix word-numbers (e.g., "six" -> "6")
    let processedText = text.toLowerCase();
    for (let word in wordToNum) {
        let reg = new RegExp(`\\b${word}\\b`, 'g');
        processedText = processedText.replace(reg, wordToNum[word]);
    }

    // B. Clean filler and handle Variations
    const clean = processedText.replace(/first/g, "1").replace(/second/g, "2").replace(/third/g, "3")
                               .replace(/1st/g, "1").replace(/2nd/g, "2").replace(/3rd/g, "3")
                               .replace(/,/g, " ").replace(/chapter|verse|verses|and/gi, " ");

    // C. Smart Book Search
    let foundBook = bibleBooks.find(book => clean.includes(book));
    if (!foundBook) return;

    // D. Isolate Numbers after Book Name
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

// 5. API ENGINE
async function fetchVerse(ref) {
    try {
        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.text) {
            placeholder.style.display = 'none';
            referenceTitle.textContent = data.reference;
            verseContent.textContent = data.text;
            // Success reset
            speechBuffer = ""; 
        }
    } catch (err) { console.error("API Fetch Failure"); }
}

// 6. ROBUST CLEAR LOGIC
clearBtn.addEventListener('click', () => {
    isCoolingDown = true;
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    lastFetched = "";
    speechBuffer = "";
    liveText.textContent = "Screen Cleared.";

    // Restart mic to wipe internal browser cache
    if (isListening) {
        recognition.stop();
        setTimeout(() => {
            if (isListening) recognition.start();
            isCoolingDown = false;
        }, 1200);
    } else {
        setTimeout(() => { isCoolingDown = false; }, 1200);
    }
});

recognition.onend = () => { if (isListening && !isCoolingDown) recognition.start(); };
