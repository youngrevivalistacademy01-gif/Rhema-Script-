/**
 * Rhema Script - Bulletproof Logic
 * Fixes: Comma errors, "Verse" keyword hang-ups, and Interim processing
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
    recognition.interimResults = true; // Still true for the UI
    recognition.lang = 'en-US';
}

let isListening = false;

// 1. Start/Stop
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
    liveText.textContent = active ? "Waiting..." : "Paused.";
}

// 2. The Logic Fix: Process speech as it happens
recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript = event.results[i][0].transcript;
        liveText.textContent = transcript; // Show what is heard immediately

        // CRITICAL: We process BOTH final and interim to catch "Genesis 1:1" faster
        processSpeech(transcript);
    }
};

// 3. The Pattern Fix: Clean and Detect
let lastFetched = ""; // Prevent double-fetching the same verse

function processSpeech(text) {
    // CLEANING: Remove commas, replace "verse/chapter" with spaces, lowercase it
    const clean = text.toLowerCase()
                      .replace(/,/g, " ") 
                      .replace(/chapter|verse|and|the/gi, " ")
                      .replace(/\s+/g, " ")
                      .trim();

    // REGEX: Matches "genesis 1 1" or "genesis 1:1"
    const regex = /([1-3]?\s?[a-z]+)\s?(\d+)[\s|:]?\s?(\d+)/gi;
    const match = regex.exec(clean);

    if (match) {
        const ref = `${match[1].trim()} ${match[2]}:${match[3]}`;
        
        // Only fetch if it's a new reference to avoid spamming the API
        if (ref !== lastFetched) {
            lastFetched = ref;
            fetchVerse(ref);
        }
    }
}

// 4. The Fetch Fix: URL Encoding
async function fetchVerse(ref) {
    try {
        // Use encodeURIComponent to handle "1 John" or spaces correctly
        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.text) {
            placeholder.style.display = 'none';
            referenceTitle.textContent = data.reference;
            verseContent.textContent = data.text;
            liveText.textContent = `Displayed: ${data.reference}`;
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

recognition.onend = () => { if (isListening) recognition.start(); };

clearBtn.addEventListener('click', () => {
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    liveText.textContent = "Cleared.";
    lastFetched = ""; // Reset memory
});
