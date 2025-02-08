const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from "public"

// Serve index.html for the root path
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

const summarizeText = (text) => {
	const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
	const wordFreq = {};

	sentences.forEach((sentence) => {
		sentence.split(/\s+/).forEach((word) => {
			const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
			if (cleanWord) wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
		});
	});

	const rankedSentences = sentences.map((sentence) => ({
		sentence,
		score: sentence
			.split(/\s+/)
			.reduce((sum, word) => sum + (wordFreq[word.toLowerCase().replace(/[^a-z]/g, "")] || 0), 0),
	}));

	rankedSentences.sort((a, b) => b.score - a.score);

	return rankedSentences.slice(0, Math.ceil(sentences.length * 0.3)).map((s) => s.sentence).join(" ");
};

app.post("/check-file", (req, res) => {
	const { filename } = req.body;
	const desktopPath = path.join(os.homedir(), "Desktop", filename);

	if (!fs.existsSync(desktopPath)) {
		return res.json({ error: "File not found." });
	}

	fs.readFile(desktopPath, "utf-8", (err, data) => {
		if (err) {
			return res.json({ error: "Error reading file." });
		}

		const summary = summarizeText(data);
		res.json({ summary });
	});
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

