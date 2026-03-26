/**
 * Rhema Script - Core Logic
 * Role: Listen, Parse, Fetch, and Display
 */

// 1. Initialize Speech Recognition (Cross-browser support)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    alert("Your browser does not support Web Speech API. Please use Chrome or Edge.");
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

// 3. Toggle Listening Functionality
startBtn.addEventListener('click', () => {
    if (!isListening) {
        try {
            recognition.start();
            updateUIState(true);
        } catch (err) {
            console.error("Speech recognition error:", err);
        }
    } else {
        recognition.stop();
        updateUIState(false);
    }
    isListening = !isListening;
});

function updateUIState(active) {
    if (active) {
        startBtn.textContent = "Stop Listening";
        startBtn.style.background = "#ef4444"; // Red for "Stop"
        statusDot.classList.add('active');
        liveText.textContent = "Mic active. Speak a verse...";
    } else {
        startBtn.textContent = "Start Listening";
        startBtn.style.background = "#a855f7"; // Purple for "Start"
        statusDot.classList.remove('active');
        liveText.textContent = "Listener paused.";
    }
}

// 4. Handle Voice Results
recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            processSpeech(finalTranscript.toLowerCase());
        } else {
            interimTranscript += event.results[i][0].transcript;
        }
    }
    
    // Show the "live" text so the user sees it's working
    if (interimTranscript) {
        liveText.textContent = interimTranscript;
    }
};

Display
 */
