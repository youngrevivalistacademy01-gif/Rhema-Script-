/**
 * Rhema Script - Natural Language Engine
 * High-performance extraction for "John Chapter 3 Verse 16" or "John 3,16"
 */

const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');
const liveText = document.getElementById('live-text');
const verseContent = document.getElementById('verse-content');
const referenceTitle = document.getElementById('reference-title');
const statusDot = document.getElementById('status-indicator');
const placeholder = document.getElementById('placeholder');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
}

let isListening = false;
let lastFetched = ""; 

// 1. UI Controls
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

// 2. Real-time Listener
recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript = event.results[i][0].transcript;
        liveText.textContent = transcript; 
        processSpeech(transcript);
    }
};

// 3. THE "HUMAN" ENGINE: This is the fix you needed
function processSpeech(text) {
    // Standardize: "John Chapter 3, Verse 16" -> "john chapter 3 verse 16"
    const input = text.toLowerCase().replace(/,/g, " ");

    // List of Bible Books (Shortened for logic example, but covers most common)
    const books = ["genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth", "samuel", "kings", "chronicles", "ezra", "nehemiah", "esther", "job", "psalms", "psalm", "proverbs", "ecclesiastes", "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel", "amos", "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai", "zechariah", "malachi", "matthew", "mark", "luke", "john", "acts", "romans", "corinthians", "galatians", "ephesians", "philippians", "colossians", "thessalonians", "timothy", "titus", "philemon", "hebrews", "james", "peter", "jude", "revelation"];

    // Step 1: Find if a book name is mentioned
    let foundBook = books.find(book => input.includes(book));
    if (!foundBook) return;

    // Step 2: Extract all numbers in the order they were spoken
    // This finds "3" and "16" even if "chapter" and "verse" are between them
    const numbers = input.match(/\d+/g);

    if (numbers && numbers.length >= 2) {
        const chapter = numbers[0];
        const verse = numbers[1];
        
        // Handle "1 John" or "2 Samuel" cases
        let finalBook = foundBook;
        if (input.includes(`1 ${foundBook}`)) finalBook = `1 ${foundBook}`;
        if (input.includes(`2 ${foundBook}`)) finalBook = `2 ${foundBook}`;
        if (input.includes(`3 ${foundBook}`)) finalBook = `3 ${foundBook}`;

        const formattedRef = `${finalBook} ${chapter}:${verse}`;

        if (formattedRef !== lastFetched) {
            lastFetched = formattedRef;
            fetchVerse(formattedRef);
        }
    }
}

// 4. Fetching Logic
async function fetchVerse(ref) {
    try {
        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.text) {
            placeholder.style.display = 'none';
            referenceTitle.textContent = data.reference;
            verseContent.textContent = data.text;
            liveText.textContent = `Pushed: ${data.reference}`;
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
    liveText.textContent = "Ready.";
    lastFetched = "";
});
