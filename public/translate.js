// add event listener to start button
document.getElementById("start").addEventListener("click", startVoiceInput);

// listen for key presses
document.addEventListener("keydown", (event) => {
	if (event.key === "1") {
		window.speechSynthesis.cancel();
		window.location.href = "index.html";
	} else if (event.key === "0") {
		stopSpeech();
	} else if (event.key === "2") {
		startVoiceInput();
	} else if (event.code == "Space") {
		speak(
			"Translator.\
			Press 1 to go back to the main screen.\
			Press 2 to transalate a text file.\
			Press 0 to stop voice input and playback."
		);
	}
});

function startVoiceInput() {
	window.speechSynthesis.cancel();
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

	recognition.onerror = () => {
		document.getElementById("filename").textContent = "An error occurred.";
	};

	recognition.onresult = (event) => {
		let filename = event.results[0][0].transcript.trim();
		filename = filename.replace(/\.$/, ""); // Remove trailing periods

		document.getElementById(
			"filename"
		).textContent = `Found ${filename}...`;

		fetch("http://localhost:3000/translate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ filename, fuzzy: true }),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					document.getElementById("output").textContent = data.error;
					speak(data.error);
				} else if (data.translation) {
					document.getElementById("output").textContent =
						data.translation;
					speak(data.translation);
				}
			})
			.catch(() => {
				document.getElementById("output").textContent =
					"A server error occurred.";
				speak("A server error occurred. Try again.");
			});
	};

	recognition.start();
}

function speak(text) {
	// split text into sentences based on periods
	const chunks = text.match(/[^.!?]+[.!?]/g) || [text];
	let index = 0;

	function speakNextChunk() {
		if (index < chunks.length) {
			const speech = new SpeechSynthesisUtterance(chunks[index].trim());
			speech.lang = "en-US";
			speech.onend = () => {
				index++;
				speakNextChunk();
			};
			window.speechSynthesis.speak(speech);
		}
	}

	speakNextChunk();
}

function stopSpeech() {
	window.speechSynthesis.cancel();

	// check if voice input active before stopping it
	if (window.recognition) {
		window.recognition.stop();
		document.getElementById("filename").textContent = "Waiting for file...";
	}
}

window.addEventListener("load", () => {
	window.speechSynthesis.cancel();
	speak("Translator.");
});
