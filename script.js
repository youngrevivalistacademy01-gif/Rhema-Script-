/**
 * Rhema Script - Final Stable Logic
 * Optimized for: GitHub Pages & Live Sermons
 */

// 1. DOM Elements (Matching your Fixed HTML IDs)
const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');
const liveText = document.getElementById('live-text');
const verseContent = document.getElementById('verse-content');
const referenceTitle = document.getElementById('reference-title');
const statusDot = document.getElementById('status-indicator');
const placeholder = document.getElementById('placeholder');

// 2. Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
} else {
    alert("Speech API not supported. Please use Chrome/Edge on HTTPS.");
}

let isListening = false;

// 3. Toggle Button Logic
startBtn.addEventListener('click', () => {
    if (!isListening) {
        try {
            recognition.start();
            isListening = true;
            updateUI(true);
        } catch (err) {
            console.error("Mic error:", err);
        }
    } else {
        recognition.stop();
        isListening = false;
        updateUI(false);
    }
});

function updateUI(active) {
    if (active) {
        startBtn.textContent = "Stop Listening";
        startBtn.style.background = "#ef4444"; // Red
        statusDot.classList.add('active');
        liveText.textContent = "Listening for the Word...";
    } else {
        startBtn.textContent = "Start Listening";
        startBtn.style.background = "#a855f7"; // Purple
        statusDot.classList.remove('active');
        liveText.textContent = "Listener paused.";
    }
}

// 4. Handle Results
recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            processSpeech(transcript);
        } else {
            interimTranscript += transcript;
        }
    }
    liveText.textContent = interimTranscript || "Processing...";
};

// 5. Advanced Scripture Detection
function processSpeech(text) {
    // Clean text: "John chapter 3 verse 16" -> "john 3 16"
    const clean = text.toLowerCase()
                      .replace(/chapter|verse|and|the/gi, " ")
                      .replace(/\s+/g, " ")
                      .trim();

    // Pattern: [Book] [Chapter] [Verse]
    const regex = /([1-3]?\s?[a-z]+)\s?(\d+)[\s|:]?\s?(\d+)/gi;
    
    let match;
    while ((match = regex.exec(clean)) !== null) {
        const ref = `${match[1].trim()} ${match[2]}:${match[3]}`;
        fetchVerse(ref);
    }
}

// 6. Fetch from API
async function fetchVerse(ref) {
    liveText.textContent = `Searching: ${ref}`;
    try {
        const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.text) {
            // Hide placeholder and show verse
            placeholder.style.display = 'none';
            referenceTitle.textContent = data.reference;
            verseContent.textContent = data.text;
            liveText.textContent = "Word found!";
        }
    } catch (err) {
        liveText.textContent = "Error finding verse.";
    }
}

// 7. Auto-Restart Loop
recognition.onend = () => {
    if (isListening) recognition.start();
};

// 8. Clear Button
clearBtn.addEventListener('click', () => {
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    liveText.textContent = "Screen Cleared.";
});


