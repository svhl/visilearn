document.addEventListener("DOMContentLoaded", function () {
    // Add event listener for first click only
    document.body.addEventListener("click", function handleClick() {
        speakText("Welcome to VisiLearn. Press 1 to convert text to speech. Press 2 to convert text to Braille. Press 3 to perform object identification. Press 4 to convert text to speech. Press 5 to summarize text.");
        
        // Remove event listener after first click
        document.body.removeEventListener("click", handleClick);
    }, { once: true }); // Ensures it runs only once
});

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
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
