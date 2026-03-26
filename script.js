/**
 * Rhema Script - Perceptive Preacher Edition
 * Fixes: Long pauses, unclear book pronunciation, and multiple book logic.
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

// CRITICAL: Keep results continuous so pauses don't break the sentence
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

let isListening = false;
let lastFetched = "";
let sessionTranscript = ""; // Accumulates speech to handle long pauses

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

// 1. Controls
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
        sessionTranscript = ""; 
    }
});

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

    // Combine long-term memory with current speaking for matching
    const fullText = (sessionTranscript + " " + interim).trim();
    liveText.textContent = fullText.split(' ').slice(-10).join(' '); // Show last 10 words
    
    processSpeech(fullText);
};

function processSpeech(text) {
    // A. Clean and Normalize
    const clean = text.replace(/first/g, "1").replace(/second/g, "2").replace(/third/g, "3")
                      .replace(/1st/g, "1").replace(/2nd/g, "2").replace(/3rd/g, "3")
                      .replace(/,/g, " ").replace(/chapter|verse|verses|and/gi, " ");

    // B. Smart Book Match (Handles slight mispronunciations)
    let foundBook = "";
    for (let book of bibleBooks) {
        // Using "includes" allows for "revelations" to match "revelation"
        if (clean.includes(book)) {
            foundBook = book;
            break;
        }
    }

    if (!foundBook) return;

    // C. Number Extraction from the whole session
    const parts = clean.split(foundBook);
    const afterBook = parts[parts.length - 1]; // Look at the most recent mention
    
    const numbers = afterBook.match(/\d+/g);

    if (numbers && numbers.length >= 2) {
        const chapter = numbers[0];
        const verse = numbers[1];
        const ref = `${foundBook} ${chapter}:${verse}`;

        if (ref !== lastFetched) {
            lastFetched = ref;
            fetchVerse(ref);
            // Clear session transcript after a successful fetch to keep it fresh
            sessionTranscript = ""; 
        }
    }
}

// 3. API Engine
async function fetchVerse(ref) {
    try {
        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.text) {
            placeholder.style.display = 'none';
            referenceTitle.textContent = data.reference;
            verseContent.textContent = data.text;
            
            // Smoothly show content
            verseContent.style.opacity = 0;
            setTimeout(() => { verseContent.style.opacity = 1; }, 50);
        }
    } catch (err) {
        console.error("API Error");
    }
}

// 4. Clear Logic
clearBtn.addEventListener('click', () => {
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    lastFetched = "";
    sessionTranscript = "";
    liveText.textContent = "Ready.";
});

recognition.onend = () => { if (isListening) recognition.start(); };
