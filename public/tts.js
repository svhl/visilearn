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
			"Text to speech.\
			Press 1 to go back to the main screen.\
			Press 2 to convert a file to speech.\
			Press 0 to stop voice input and playback."
		);
	}
});

function startVoiceInput() {
	// check if browser supports WebSpeech API
	// chromium based browsers support it
	// firefox doesn't
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
	// prevents sentences for file names
	recognition.continuous = false;
	// only send final result
	recognition.interimResults = false;
	// only send one result
	recognition.maxAlternatives = 1;

	recognition.onstart = () => {
		document.getElementById("filename").textContent = "Listening...";
	};

	recognition.onerror = (event) => {
		document.getElementById("filename").textContent =
			"An error has occured.";
	};

	recognition.onresult = (event) => {
		// retrieve first result of set of results (only 1 since no alternative)
		// remove trailing whitespace
		let filename = event.results[0][0].transcript.trim();
		// regex for removing trailing periods
		filename = filename.replace(/\.$/, "");

		const possibleFilenames = [`${filename}.txt`, `${filename}.docx`];

		document.getElementById(
			"filename"
		).textContent = `Found ${filename}...`;

		// send json request to check file in server.js
		fetch("http://localhost:3000/tts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			// use fuzzy search
			body: JSON.stringify({ filename, fuzzy: true }),
		})
			.then((res) => res.json())
			.then((data) => {
				// if server returns error
				if (data.error) {
					document.getElementById("output").textContent = data.error;
					speak(data.error);
				} else if (data.content) {
					document.getElementById("output").textContent =
						data.content;
					speak(data.content);
				}
			})

			// if server itself fails
			.catch(() => {
				document.getElementById("output").textContent =
					"A server error has occurred.";
				speak("A server error has occurred. Try again.");
			});
	};

	// start recognition only after defining above fns
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
	speak("Text to speech.");
});
