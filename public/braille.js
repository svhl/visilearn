// Initialize speech synthesis
const synth = window.speechSynthesis;

// Add event listener to start button
document
	.getElementById("startVoice")
	.addEventListener("click", startVoiceInput);

// Keyboard shortcuts
document.addEventListener("keydown", (event) => {
	// Go home
	if (event.key === "1") {
		synth.cancel();
		window.location.href = "index.html";
	}
	// Stop speech
	else if (event.key === "0") {
		stopSpeech();
	}
	// Start voice input
	else if (event.key === "2") {
		startVoiceInput();
	}
	// Play help
	else if (event.code === "Space") {
		speak(
			"Braille Converter. " +
				"Press 1 to go back to the main screen. " +
				"Press 2 to convert a file to Braille. " +
				"Press 0 to stop voice input and playback."
		);
	}
});

// Voice input function
function startVoiceInput() {
	synth.cancel();
	const SpeechRecognition =
		window.SpeechRecognition || window.webkitSpeechRecognition;

	if (!SpeechRecognition) {
		alert("Web Speech API not supported in this browser.");
		return;
	}

	const recognition = new SpeechRecognition();
	window.recognition = recognition;
	recognition.lang = "en-US";
	recognition.continuous = false;
	recognition.interimResults = false;
	recognition.maxAlternatives = 1;

	recognition.onstart = () => {
		document.getElementById("filename").textContent = "Listening...";
	};

	recognition.onerror = (event) => {
		document.getElementById("filename").textContent =
			"An error has occurred.";
	};

	recognition.onresult = (event) => {
		let filename = event.results[0][0].transcript.trim();
		filename = filename.replace(/\.$/, ""); // Remove trailing period

		document.getElementById(
			"filename"
		).textContent = `Found ${filename}...`;
		convertFileToBraille(filename);
	};

	recognition.start();
}

// Convert file to Braille
async function convertFileToBraille(filename) {
	try {
		const response = await fetch("/braille", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ filename }),
		});

		const data = await response.json();

		if (data.error) {
			document.getElementById("brailleOutput").textContent = data.error;
			speak(data.error);
			return;
		}

		document.getElementById("brailleOutput").textContent = data.brailleText;

		setTimeout(() => {
			speak("Braille file is ready for download.");
		}, 500);
	} catch (error) {
		document.getElementById("brailleOutput").textContent =
			"Error processing file";
		speak("An error occurred while processing the file");
		console.error(error);
	}
}

// Text-to-speech function
function speak(text) {
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = "en-US";
	synth.speak(utterance);
}

// Stop speech function
function stopSpeech() {
	synth.cancel();
	if (window.recognition) {
		window.recognition.stop();
		document.getElementById("filename").textContent = "Voice input stopped";
	}
}

// Initial help message
window.addEventListener("load", () => {
	synth.cancel();
	speak("Braille Converter.");
});
