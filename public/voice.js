document.addEventListener("DOMContentLoaded", function () {
    // Wait for a user action before speaking
    document.body.addEventListener("click", function () {
        speakText("Welcome to VisiLearn. Press 1 to convert text to speech. Press 2 to convert text to Braille. Press 3 to perform object identification. Press 4 to convert text to speech. Press 5 to summarize text.");
    }, { once: true }); // Ensures it only triggers once
});

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech

        const speech = new SpeechSynthesisUtterance(text);
        speech.rate = 1;
        speech.pitch = 1;
        speech.volume = 1;
        speech.lang = 'en-US';

        let voices = window.speechSynthesis.getVoices();
        speech.voice = voices.find(voice => voice.name.includes("Google US")) || voices[0];

        window.speechSynthesis.speak(speech);
    } else {
        console.warn("Text-to-speech is not supported in this browser.");
    }
}
