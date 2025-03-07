document.getElementById("start").addEventListener("click", startVoiceInput);

// Listen for keyboard events
document.addEventListener("keydown", (event) => {
	if (event.key === "1") {
		speak("Press 1 to go back to the main screen.\
			Press 2 to convert a text file to speech.\
			Press 3 to convert a text file to Braille.\
			Press 0 to stop voice playback.");
	} else if (event.key === "2") {
		startVoiceInput();
	} else if (event.key === "3") {
		convertToBraille();
	} else if (event.key === "0") {
		stopSpeech();
	}
});

function startVoiceInput() {
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if (!SpeechRecognition) {
		alert("Web Speech API not supported in this browser.");
		return;
	}

	const recognition = new SpeechRecognition();
	recognition.lang = "en-US";
	recognition.continuous = false;
	recognition.interimResults = false;
	recognition.maxAlternatives = 1;

	recognition.onstart = () => {
		document.getElementById("output").textContent = "Listening...";
		document.getElementById("filename").textContent = "Listening...";
	};

	recognition.onerror = (event) => {
		document.getElementById("output").textContent = "Error: " + event.error;
		document.getElementById("filename").textContent = "Error";
	};

	recognition.onresult = (event) => {
		let filename = event.results[0][0].transcript.trim();
		filename = filename.replace(/\.$/, ""); // Remove trailing period if any
		filename += ".txt";
		document.getElementById("filename").textContent = filename; // Show corrected filename

		document.getElementById("output").textContent = "Checking file...";

		fetch("http://localhost:3000/check-file", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ filename }),
		})
		.then((res) => res.json())
		.then((data) => {
			if (data.error) {
				document.getElementById("output").textContent = data.error;
				speak(data.error);
			} else {
				document.getElementById("output").textContent = data.summary;
				speak(data.summary);
			}
		})
		.catch(() => {
			document.getElementById("output").textContent = "Server error.";
			speak("Server error.");
		});
	};

	recognition.start();
}

function convertToBraille() {
	const filename = document.getElementById("filename").textContent;
	if (filename === "Waiting..." || filename === "Listening..." || filename === "Error") {
		speak("No valid file recognized. Please try again.");
		return;
	}

	document.getElementById("output").textContent = "Converting to Braille...";

	fetch("http://localhost:3000/convert-braille", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ filename }),
	})
	.then((res) => res.blob())
	.then((blob) => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename.replace(".txt", "_braille.txt");
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		document.getElementById("output").textContent = "Braille file downloaded.";
		speak("Braille file has been downloaded.");
	})
	.catch(() => {
		document.getElementById("output").textContent = "Error converting to Braille.";
		speak("Error converting to Braille.");
	});
}

function speak(text) {
	const speech = new SpeechSynthesisUtterance(text);
	speech.lang = "en-US";
	window.speechSynthesis.speak(speech);
}

function stopSpeech() {
	window.speechSynthesis.cancel(); // Stops any ongoing speech
}
