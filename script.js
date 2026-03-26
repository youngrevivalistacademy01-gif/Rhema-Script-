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

// 5. Logic to Extract Scripture
function processSpeech(text) {
    // Pre-clean: Remove words that might trip up the API
    // Converts "John chapter 3 verse 16" -> "John 3 16"
    const cleanedText = text.replace(/chapter|verse|and/gi, " ");

    // Regex for: (Optional 1-3) (Book Name) (Chapter Number) (Separator) (Verse Number)
    // Matches: "John 3:16", "1 John 1:9", "Genesis 1 1", "Psalm 23 1"
    const scriptureRegex = /([1-3]?\s?[a-zA-Z]+)\s?(\d+)\s?[:|\s]?\s?(\d+)/gi;
    
    const match = scriptureRegex.exec(cleanedText);

    if (match) {
        const foundReference = match[0].trim();
        fetchVerse(foundReference);
    }
}

// 6. API Fetch (Using Bible-API.com - KJV by default)
async function fetchVerse(reference) {
    liveText.textContent = `Searching for ${reference}...`;
    
    try {
        // We add ?translation=kjv for the classic preacher feel
        const response = await fetch(`https://bible-api.com/${reference}?translation=kjv`);
        
        if (!response.ok) throw new Error("Reference not found");

        const data = await response.json();

        if (data.text) {
            displayVerse(data.reference, data.text);
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        liveText.textContent = `Could not find "${reference}".`;
    }
}

// 7. UI Display with Smooth Transition
function displayVerse(ref, text) {
    placeholder.style.display = 'none';
    
    // Quick fade out
    verseContent.style.opacity = 0;
    referenceTitle.style.opacity = 0;

    setTimeout(() => {
        referenceTitle.textContent = ref;
        verseContent.textContent = text;
        
        // Fade back in
        referenceTitle.style.opacity = 1;
        verseContent.style.opacity = 1;
        liveText.textContent = "Listening for next verse...";
    }, 200);
}

// 8. Clear Button Logic
clearBtn.addEventListener('click', () => {
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    liveText.textContent = "Screen Cleared.";
});

// Auto-restart recognition if it times out (common in long sermons)
recognition.onend = () => {
    if (isListening) recognition.start();
};
