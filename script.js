// 1. Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

// 2. Select DOM Elements
const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');
const liveText = document.getElementById('live-text');
const verseContent = document.getElementById('verse-content');
const referenceTitle = document.getElementById('reference-title');
const statusDot = document.getElementById('status-indicator');
const placeholder = document.querySelector('.placeholder-text');

let isListening = false;

// 3. Toggle Listening State
startBtn.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
        startBtn.textContent = "Stop Listening";
        startBtn.style.background = "#ef4444"; // Red for stop
        statusDot.classList.add('active');
    } else {
        recognition.stop();
        startBtn.textContent = "Start Listening";
        startBtn.style.background = "#a855f7"; // Back to purple
        statusDot.classList.remove('active');
    }
    isListening = !isListening;
});

// 4. Handle Results
recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            const speech = event.results[i][0].transcript.toLowerCase();
            detectScripture(speech);
        } else {
            interimTranscript += event.results[i][0].transcript;
        }
    }
    liveText.textContent = interimTranscript || "Listening...";
};

// 5. Detect Scripture Pattern
function detectScripture(text) {
    // Regex to find patterns like "John 3:16" or "1 Corinthians 13:4"
    const regex = /([1-3]?\s?[a-zA-Z]+)\s?(\d+):(\d+)/gi;
    const match = regex.exec(text);

    if (match) {
        const reference = match[0];
        fetchVerse(reference);
    }
}

// 6. Fetch from Bible API
async function fetchVerse(ref) {
    try {
        const response = await fetch(`https://bible-api.com/${ref}`);
        const data = await response.json();

        if (data.text) {
            placeholder.style.display = 'none';
            referenceTitle.textContent = data.reference;
            verseContent.textContent = data.text;
            
            // Add a nice fade-in effect
            verseContent.style.opacity = 0;
            setTimeout(() => verseContent.style.opacity = 1, 100);
        }
    } catch (error) {
        console.error("Error fetching scripture:", error);
    }
}

// 7. Clear Screen
clearBtn.addEventListener('click', () => {
    referenceTitle.textContent = "";
    verseContent.textContent = "";
    placeholder.style.display = 'block';
    liveText.textContent = "Screen Cleared.";
});
