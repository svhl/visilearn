document.addEventListener("keydown", function (event) {
	if (event.code === "Space") {
		event.preventDefault();
		speakText(
			"Welcome to VisiLearn!\
            Press 1 for text-to-speech.\
            Press 2 for Braille conversion.\
            Press 3 for summarizer.\
            Press 4 for image recognition.\
            Press 5 for translator.\
			Press spacebar on any page to learn more.\
			Press 0 to stop voice input and playback."
		);
	} else if (event.key === "0") {
		stopSpeech();
	}
});

function speakText(text) {
	if ("speechSynthesis" in window) {
		window.speechSynthesis.cancel();
		const speech = new SpeechSynthesisUtterance(text);
		window.speechSynthesis.speak(speech);
	}
}

function stopSpeech() {
	window.speechSynthesis.cancel();
}
