/**
 * Rhema Script - Master Logic
 * Optimized for Live Sermons & Professional Deployment
 */

// 1. Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    alert("Speech API not supported. Please use Chrome or Edge on HTTPS.");
}

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

// 2. DOM Elements
const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');
const liveText = document.getElementById('live-text');
const verseContent = document.getElementById('verse-content');
const referenceTitle = document.getElementById('reference-title');
const statusDot = document.getElementById('status-indicator');
const placeholder = document.querySelector('.placeholder-text');

let isListening = false;

// 3. Toggle Listener
startBtn.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
        updateUI(true);
    } else {
        recognition.stop();
        updateUI(false);
    }
    isListening = !isListening;
});

function updateUI(active) {
    if (active) {
        startBtn.textContent = "Stop Listening";
        startBtn.style.background = "#ef4444";
        statusDot.classList.add('active');
        liveText.textContent = "Waiting for the Word...";
    } else {
        startBtn.textContent = "Start Listening";
        startBtn.style.background = "#a855f7";
        statusDot.classList.remove('active');
    }
}

// 4. Processing Voice Input
recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            console.log("Final Speech:", transcript);
            processSpeech(transcript);
        } else {
            interimTranscript += transcript;
        }
    }
    liveText.textContent = interimTranscript || "Listening...";
};

// 5. Advanced Scripture Detection (The "Brain")
function processSpeech(text) {
    // Clean common spoken words: "John chapter 3 verse 16" -> "john 3 16"
    const clean = text.toLowerCase()
                      .replace(/chapter|verse|and|the/gi, " ")
                      .replace(/\s+/g, " ")
                      .trim();

    // Regex Explanation: 
    // ([1-3]?\s?[a-z]+) -> Matches "John" or "1 John"
    // \s?(\d+) -> Matches Chapter number
    // [\s|:]?\s?(\d+) -> Matches Verse number (with space or colon)
    const regex = /([1-3]?\s?[a-z]+)\s?(\d+)[\s|:]?\s?(\d+)/gi;
    
    let match;
    while ((match = regex.exec(clean)) !== null) {
        const book = match[1].trim();
        const chapter = match[2];
        const verse = match[3];
        
        const formattedRef = `${book} ${chapter}:${verse}`;
        console.log("Detected Reference:", formattedRef);
        fetchVerse(formattedRef);
    }
}

// 6. Fetching from Bible API
async function fetchVerse(ref) {
    liveText.textContent = `Pulling ${ref}...`;
    
    try {
        // Encode URL to handle spaces in book names (like "1 John")
        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.text) {
            displayResults(data.reference, data.text);
        } else {
            console.warn("API found no text for:", ref);
        }
    } catch (err) {
        console.error("API Error:", err);
        liveText.textContent = "Connection error. Try again.";
    }
}

// 7. Display Logic
function displayResults(ref, text) {
    placeholder.style.display = 'none';
    
    // UI Refresh
    referenceTitle.style.opacity = 0;
    verseContent.style.opacity = 0;

    setTimeout(() => {
        referenceTitle.textContent = ref;
        verseContent.textContent = text;
        referenceTitle.style.opacity = 1;
        verseContent.style.opacity = 1;
        liveText.textContent = "Listening for next verse...";
    }, 300);
}

// 8. Auto-Restart (Crucial for live sermons)
recognition.onend = () => {
    if (isListening) {
        console.log("Restarting listener...");
        recognition.start();
    }
};

// 9. Clear Screen
clearBtn.addEventListener('click', () => {
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    liveText.textContent = "Ready.";
});
