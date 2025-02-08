document.getElementById("start").addEventListener("click", () => {
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
});

function speak(text) {
	const speech = new SpeechSynthesisUtterance(text);
	speech.lang = "en-US";
	window.speechSynthesis.speak(speech);
}

