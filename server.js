const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const cors = require("cors");
const mammoth = require("mammoth");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from "public"

// Serve index.html for the root path
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "summarizer.html"));
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
			.reduce(
				(sum, word) =>
					sum +
					(wordFreq[word.toLowerCase().replace(/[^a-z]/g, "")] || 0),
				0
			),
	}));

	rankedSentences.sort((a, b) => b.score - a.score);

	return rankedSentences
		.slice(0, Math.ceil(sentences.length * 0.3))
		.map((s) => s.sentence)
		.join(" ");
};

app.post("/check-file", async (req, res) => {
	let { filename } = req.body;
	const desktopPath = path.join(os.homedir(), "Desktop");

	// Convert to lowercase for case-insensitive matching
	const targetFilename = filename.toLowerCase();

	// Read all files in the Desktop directory
	let files;
	try {
		files = fs.readdirSync(desktopPath);
	} catch (err) {
		return res.json({ error: "Error accessing Desktop directory." });
	}

	// Convert all filenames to lowercase for comparison
	const lowerCaseFiles = files.map((file) => file.toLowerCase());

	// Try to find an exact case-insensitive match
	const matchedIndex = lowerCaseFiles.indexOf(targetFilename);
	if (matchedIndex !== -1) {
		filename = files[matchedIndex]; // Get the correctly capitalized filename
	} else {
		// Fuzzy search: Find the closest match
		const closestMatch = files.find((file) =>
			file
				.toLowerCase()
				.includes(targetFilename.replace(/\.(txt|docx)$/, ""))
		);

		if (closestMatch) {
			filename = closestMatch;
		} else {
			return res.json({ error: "File not found." });
		}
	}

	const filePath = path.join(desktopPath, filename);

	// Check file type and process accordingly
	if (filename.endsWith(".txt")) {
		fs.readFile(filePath, "utf-8", (err, data) => {
			if (err) return res.json({ error: "Error reading text file." });

			const summary = summarizeText(data);
			res.json({ summary });
		});
	} else if (filename.endsWith(".docx")) {
		try {
			const data = fs.readFileSync(filePath);
			const result = await mammoth.extractRawText({ buffer: data });

			if (!result.value.trim()) {
				return res.json({ error: "DOCX contains no readable text." });
			}

			const summary = summarizeText(result.value);
			res.json({ summary });
		} catch (error) {
			return res.json({ error: "Error processing DOCX file." });
		}
	} else {
		res.json({ error: "Unsupported file type." });
	}
});

app.listen(PORT, () =>
	console.log(`Server running at http://localhost:${PORT}`)
);
