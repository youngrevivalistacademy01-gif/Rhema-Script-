/**
 * Rhema Script - Final Pro Edition
 * Features: Natural Language Support (verse/chapter), Comma Sanitization, 
 * Interim Result Processing, and Automatic Restart.
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
} else {
    alert("Web Speech API is not supported in this browser. Please use Chrome on HTTPS.");
}

let isListening = false;
let lastFetched = ""; // Memory to prevent double-pulling the same verse

// 1. Controls: Start/Stop
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
    if (active) {
        statusDot.classList.add('active');
        liveText.textContent = "Waiting for the Word...";
    } else {
        statusDot.classList.remove('active');
        liveText.textContent = "Listener paused.";
    }
}

// 2. The Listener: Captures speech in real-time
recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript = event.results[i][0].transcript;
        liveText.textContent = transcript; 

        // We process immediately to catch verses while the preacher is still talking
        processSpeech(transcript);
    }
};

// 3. The "Natural Language" Brain
function processSpeech(text) {
    // CLEANING: Convert "Psalm chapter 11 verse 2" -> "psalm 11 2"
    // Also removes commas and extra spaces
    const clean = text.toLowerCase()
                      .replace(/chapter|verse|and|,/gi, " ")
                      .replace(/\s+/g, " ")
                      .trim();

    // REGEX: Matches [Book Name] [Chapter] [Verse]
    // Handles books like "1 John" and numbers separated by spaces or colons
    const regex = /([1-3]?\s?[a-z]+)\s?(\d+)[\s|:]?\s?(\d+)/gi;
    
    let match;
    while ((match = regex.exec(clean)) !== null) {
        const book = match[1].trim();
        const chapter = match[2];
        const verse = match[3];
        
        const formattedRef = `${book} ${chapter}:${verse}`;
        
        // Only trigger if we haven't already pulled this exact verse
        if (formattedRef !== lastFetched) {
            lastFetched = formattedRef;
            fetchVerse(formattedRef);
        }
    }
}

// 4. API Fetching: Pulls from Bible-API (KJV)
async function fetchVerse(ref) {
    try {
        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.text) {
            // Visual Updates
            placeholder.style.display = 'none';
            referenceTitle.textContent = data.reference;
            verseContent.textContent = data.text;
            
            // Success Feedback
            liveText.textContent = `Displaying ${data.reference}`;
            console.log("Successfully displayed:", data.reference);
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

// 5. Stability: Auto-restart if mic times out
recognition.onend = () => {
    if (isListening) {
        console.log("Restarting mic for continued service...");
        recognition.start();
    }
};

// 6. Clear Screen
clearBtn.addEventListener('click', () => {
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    liveText.textContent = "Screen Cleared.";
    lastFetched = ""; // Allow re-fetching the same verse if cleared
});
