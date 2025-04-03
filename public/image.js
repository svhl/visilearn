const synth = window.speechSynthesis;

document.getElementById("analyzeButton").addEventListener("click", async () => {
	const fileInput = document.getElementById("imageInput");
	const descriptionElement = document.getElementById("description");

	if (!fileInput.files.length) {
		descriptionElement.textContent = "Please select an image.";
		speak("Please select an image.");
		return;
	}

	const file = fileInput.files[0];
	const reader = new FileReader();

	reader.onload = async function () {
		const base64Image = reader.result.split(",")[1];

		try {
			descriptionElement.textContent = "Analyzing image...";

			const response = await fetch("/upload-image", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					base64Image,
					mimeType: file.type,
				}),
			});

			const data = await response.json();

			if (data.error) {
				descriptionElement.textContent = data.error;
				speak(data.error);
			} else {
				descriptionElement.textContent = data.description;
				speak(data.description);
			}
		} catch (error) {
			descriptionElement.textContent = "Error analyzing image.";
			speak("Error analyzing image.");
			console.error(error);
		}
	};

	reader.readAsDataURL(file);
});

function speak(text) {
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = "en-US";
	synth.speak(utterance);
}

window.addEventListener("load", () => {
	synth.cancel();
	speak("Image analyzer.");
});
