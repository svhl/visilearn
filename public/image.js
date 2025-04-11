const synth = window.speechSynthesis;

// Speak text using TTS
function speak(text) {
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = "en-US";
	synth.speak(utterance);
}

// Stop speech playback
function stopSpeech() {
	synth.cancel();
}

function startVoiceInput() {
	stopSpeech();
	const SpeechRecognition =
		window.SpeechRecognition || window.webkitSpeechRecognition;

	if (!SpeechRecognition) {
		alert("Web Speech API not supported in this browser.");
		return;
	}

	const recognition = new SpeechRecognition();
	recognition.lang = "en-US";
	recognition.continuous = false;
	recognition.interimResults = false;
	recognition.maxAlternatives = 1;

	const descriptionBox = document.getElementById("description");

	recognition.onstart = () => {
		descriptionBox.textContent = "Listening...";
	};

	recognition.onerror = () => {
		descriptionBox.textContent = "An error occurred during voice input.";
	};

	recognition.onresult = (event) => {
		let filename = event.results[0][0].transcript.trim();
		filename = filename.replace(/\.$/, ""); // Remove trailing period

		descriptionBox.textContent = `Found ${filename}...`;

		// Send request to server for fuzzy search and image processing
		fetch("http://localhost:3000/image", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ filename }),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					descriptionBox.textContent = data.error;
					descriptionBox.classList.remove("output-shown");
					speak(data.error);
				} else {
					descriptionBox.textContent = data.description;
					descriptionBox.classList.add("output-shown");
					speak(data.description);
				}
			})
			.catch(() => {
				descriptionBox.textContent = "A server error occurred.";
				speak("A server error occurred. Try again.");
			});
	};

	recognition.start();
}

// Analyze image function
async function analyzeImage() {
	const fileInput = document.getElementById("imageInput");
	const descriptionBox = document.getElementById("description");

	if (!fileInput.files.length) {
		alert("Please select an image.");
		return;
	}

	const file = fileInput.files[0];
	const fileName = file.name;
	descriptionBox.textContent = `Analyzing ${fileName}...`;

	const reader = new FileReader();

	reader.onload = async function () {
		const base64Image = reader.result.split(",")[1];

		try {
			const response = await fetch("http://localhost:3000/upload-image", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					base64Image,
					mimeType: file.type,
				}),
			});

			const result = await response.json();

			if (result.description) {
				descriptionBox.textContent = result.description;
				descriptionBox.classList.add("output-shown");
				speak(result.description);
			} else {
				descriptionBox.textContent =
					"Error: Could not generate description.";
				descriptionBox.classList.remove("output-shown");
				speak("Error: Could not generate description.");
			}
		} catch (error) {
			console.error("Error:", error);
			descriptionBox.textContent = "Error: Unable to fetch description.";
			descriptionBox.classList.remove("output-shown");
			speak("Error: Unable to fetch description.");
		}
	};

	reader.readAsDataURL(file);
}

document.addEventListener("keydown", (event) => {
	if (event.key === "1") {
		stopSpeech();
		window.location.href = "index.html";
	} else if (event.key === "0") {
		stopSpeech();
	} else if (event.key === "2") {
		startVoiceInput();
	} else if (event.code === "Space") {
		speak(
			"Image recognition. Press 1 to go back to the main screen. Press 2 for image recognition. Press 0 to stop voice playback."
		);
	}
});

// Set default message in the description box
window.addEventListener("load", () => {
	const descriptionBox = document.getElementById("description");
	descriptionBox.textContent = "Waiting for file...";
	descriptionBox.classList.remove("output-shown");
	synth.cancel();
	speak("Image recognition.");
});
