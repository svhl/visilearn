// add event listener to start button
document.getElementById("start").addEventListener("click", startVoiceInput);

// listen for key presses
document.addEventListener("keydown", (event) => {
	// go home
	if (event.key === "1") {
		window.speechSynthesis.cancel();
		window.location.href = "index.html";
	}

	// stop speech
	else if (event.key === "0") {
		stopSpeech();
	}

	// read voice input from user
	else if (event.key === "2") {
		startVoiceInput();
	}

	// play help
	else if (event.code == "Space") {
		speak(
			"Summarizer.\
			Press 1 to go back to the main screen.\
			Press 2 to summarize a file.\
			Press 0 to stop voice input and playback."
		);
	}
});

// speech to text for input
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

	// create new recognition object
	const recognition = new SpeechRecognition();
	// store recognition object globally
	// need to use in stopSpeech fn
	window.recognition = recognition;
	recognition.lang = "en-US";
	// prevents sentences for file names
	recognition.continuous = false;
	// only send final result
	recognition.interimResults = false;
	// only send one result
	recognition.maxAlternatives = 1;

	// display voice recognition starts
	recognition.onstart = () => {
		document.getElementById("filename").textContent = "Listening...";
	};

	// when error
	recognition.onerror = (event) => {
		document.getElementById("filename").textContent =
			"An error has occurred.";
	};

	// when speech recognized
	recognition.onresult = (event) => {
		// retrieve first result of set of results (only 1 since no alternative)
		// remove trailing whitespace
		let filename = event.results[0][0].transcript.trim();
		// regex for removing trailing periods
		filename = filename.replace(/\.$/, "");

		// Try both .txt and .docx extensions
		const possibleFilenames = [`${filename}.txt`, `${filename}.docx`];

		// display filename attempt
		document.getElementById(
			"filename"
		).textContent = `Found ${filename}...`;

		// send json request to check file in server.js
		fetch("http://localhost:3000/summarize", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ filename, fuzzy: true }), // Enable fuzzy search
		})
			.then((res) => res.json())
			.then((data) => {
				// if server returns error
				if (data.error) {
					document.getElementById("output").textContent = data.error;
					speak(data.error);
				}
				// handle docx content
				else if (data.docxContent) {
					document.getElementById("output").textContent =
						data.docxContent;
					speak(data.docxContent);
				}
				// display the summary and scores
				else {
					document.getElementById("output").textContent =
						data.summary;
					document.getElementById(
						"bleuScore"
					).textContent = `BLEU Score: ${data.bleuScore}`;
					document.getElementById(
						"rougeScore"
					).textContent = `ROUGE Score: ${data.rougeScore}`;
					speak(data.summary);
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

// text to speech for output
function speak(text) {
	// Split text into sentences based on periods
	const chunks = text.match(/[^.!?]+[.!?]/g) || [text]; // Ensure at least one chunk
	let index = 0;

	function speakNextChunk() {
		if (index < chunks.length) {
			const speech = new SpeechSynthesisUtterance(chunks[index].trim());
			speech.lang = "en-US";
			speech.onend = () => {
				index++;
				speakNextChunk(); // Speak the next chunk after the current one finishes
			};
			window.speechSynthesis.speak(speech);
		}
	}

	speakNextChunk();
}

// stop any ongoing speech
function stopSpeech() {
	window.speechSynthesis.cancel();

	// Check if voice recognition exists before stopping it
	if (window.recognition) {
		window.recognition.stop();

		// Update UI to indicate that recognition has stopped
		document.getElementById("filename").textContent = "Waiting for file...";

		// Reset the recognition variable to avoid conflicts
		window.recognition = null;
	}
}

window.addEventListener("load", () => {
	window.speechSynthesis.cancel();
	speak("Summarizer.");
});
