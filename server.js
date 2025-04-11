const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const cors = require("cors");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const app = express();
const PORT = 3000;

require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// text-to-speech
app.post("/tts", async (req, res) => {
	try {
		let { filename } = req.body;
		const desktopPath = path.join(os.homedir(), "Desktop");

		filename = path.basename(filename);

		// Convert to lowercase for case-insensitive matching
		const targetFilename = filename.toLowerCase();

		// Read all files in the Desktop directory
		let files;
		try {
			files = await fs.readdir(desktopPath);
		} catch (err) {
			return res
				.status(500)
				.json({ error: "Error accessing Desktop directory." });
		}

		// Convert all filenames to lowercase for comparison
		const lowerCaseFiles = files.map((file) => file.toLowerCase());

		// Try to find an exact case-insensitive match
		const matchedIndex = lowerCaseFiles.indexOf(targetFilename);
		if (matchedIndex !== -1) {
			filename = files[matchedIndex];
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
				return res.status(404).json({ error: "File not found." });
			}
		}

		const filePath = path.join(desktopPath, filename);

		// Validate file extension
		const allowedExtensions = [".txt", ".docx", ".pdf"];
		if (!allowedExtensions.includes(path.extname(filename))) {
			return res.status(400).json({ error: "Unsupported file type." });
		}

		// Process the file
		let fileContent = "";
		if (filename.endsWith(".txt")) {
			fileContent = await fs.readFile(filePath, "utf-8");
		} else if (filename.endsWith(".docx")) {
			const data = await fs.readFile(filePath);
			const result = await mammoth.extractRawText({ buffer: data });
			fileContent = result.value.trim();
			if (!fileContent) {
				return res
					.status(400)
					.json({ error: "DOCX contains no readable text." });
			}
		} else if (filename.endsWith(".pdf")) {
			const dataBuffer = await fs.readFile(filePath);
			const pdfData = await pdfParse(dataBuffer);
			fileContent = pdfData.text.trim();
			if (!fileContent) {
				return res
					.status(400)
					.json({ error: "PDF contains no readable text." });
			}
		}

		// Return the full content of the file
		return res.json({ content: fileContent });
	} catch (error) {
		console.error("Error in read-file:", error);
		return res.status(500).json({ error: "Error processing file" });
	}
});

// braille
const brailleMaps = {
	english: {
		a: "⠁",
		b: "⠃",
		c: "⠉",
		d: "⠙",
		e: "⠑",
		f: "⠋",
		g: "⠛",
		h: "⠓",
		i: "⠊",
		j: "⠚",
		k: "⠅",
		l: "⠇",
		m: "⠍",
		n: "⠝",
		o: "⠕",
		p: "⠏",
		q: "⠟",
		r: "⠗",
		s: "⠎",
		t: "⠞",
		u: "⠥",
		v: "⠧",
		w: "⠺",
		x: "⠭",
		y: "⠽",
		z: "⠵",
		" ": " ",
		".": "⠲",
		",": "⠂",
		"?": "⠦",
		"!": "⠖",
		"'": "⠄",
		0: "⠴",
		1: "⠂",
		2: "⠆",
		3: "⠒",
		4: "⠲",
		5: "⠢",
		6: "⠖",
		7: "⠶",
		8: "⠦",
		9: "⠔",
	},
	french: {
		a: "⠁",
		b: "⠃",
		c: "⠉",
		d: "⠙",
		e: "⠑",
		f: "⠋",
		g: "⠛",
		h: "⠓",
		i: "⠊",
		j: "⠚",
		k: "⠅",
		l: "⠇",
		m: "⠍",
		n: "⠝",
		o: "⠕",
		p: "⠏",
		q: "⠟",
		r: "⠗",
		s: "⠎",
		t: "⠞",
		u: "⠥",
		v: "⠧",
		w: "⠺",
		x: "⠭",
		y: "⠽",
		z: "⠵",
		à: "⠷",
		â: "⠡",
		ç: "⠩",
		é: "⠿",
		è: "⠮",
		ê: "⠣",
		ë: "⠫",
		î: "⠻",
		ï: "⠳",
		ô: "⠹",
		ù: "⠾",
		û: "⠢",
		ü: "⠬",
	},
	spanish: {
		a: "⠁",
		b: "⠃",
		c: "⠉",
		d: "⠙",
		e: "⠑",
		f: "⠋",
		g: "⠛",
		h: "⠓",
		i: "⠊",
		j: "⠚",
		k: "⠅",
		l: "⠇",
		m: "⠍",
		n: "⠝",
		o: "⠕",
		p: "⠏",
		q: "⠟",
		r: "⠗",
		s: "⠎",
		t: "⠞",
		u: "⠥",
		v: "⠧",
		w: "⠺",
		x: "⠭",
		y: "⠽",
		z: "⠵",
		á: "⠷",
		é: "⠿",
		í: "⠌",
		ó: "⠬",
		ú: "⠾",
		ü: "⠳",
		ñ: "⠈⠝",
		"¿": "⠢",
		"¡": "⠖",
	},
	hindi: {
		// Vowels
		अ: "⠁",
		आ: "⠜",
		इ: "⠊",
		ई: "⠔",
		उ: "⠥",
		ऊ: "⠳",
		ऋ: "⠻",
		ए: "⠢",
		ऐ: "⠿",
		ओ: "⠕",
		औ: "⠪",

		// Consonants
		क: "⠅",
		ख: "⠨⠅",
		ग: "⠛",
		घ: "⠨⠛",
		ङ: "⠬",
		च: "⠉",
		छ: "⠨⠉",
		ज: "⠚",
		झ: "⠨⠚",
		ञ: "⠭",
		ट: "⠾",
		ठ: "⠨⠾",
		ड: "⠫",
		ढ: "⠨⠫",
		ण: "⠼",
		त: "⠞",
		थ: "⠨⠞",
		द: "⠙",
		ध: "⠨⠙",
		न: "⠝",
		प: "⠏",
		फ: "⠨⠏",
		ब: "⠃",
		भ: "⠨⠃",
		म: "⠍",
		य: "⠽",
		र: "⠗",
		ल: "⠇",
		व: "⠧",
		श: "⠩",
		ष: "⠱",
		स: "⠎",
		ह: "⠓",

		// Matras (Vowel signs)
		"ा": "⠜",
		"ि": "⠊",
		"ी": "⠔",
		"ु": "⠥",
		"ू": "⠳",
		"ृ": "⠻",
		"े": "⠢",
		"ै": "⠿",
		"ो": "⠕",
		"ौ": "⠪",

		// Punctuation/Numbers
		"।": "⠲",
		"॥": "⠶",
		"्": "⠈",
		"ं": "⠰",
		"ः": "⠆",
		"०": "⠴",
		"१": "⠂",
		"२": "⠆",
		"३": "⠒",
		"४": "⠲",
		"५": "⠢",
		"६": "⠖",
		"७": "⠶",
		"८": "⠦",
		"९": "⠔",
	},
	malayalam: {
		// Vowels and vowel signs
		അ: "⠁",
		ആ: "⠜",
		ഇ: "⠊",
		ഈ: "⠔",
		ഉ: "⠥",
		ഊ: "⠳",
		ഋ: "⠻",
		എ: "⠢",
		ഏ: "⠮",
		ഐ: "⠿",
		ഒ: "⠕",
		ഓ: "⠪",
		ഔ: "⠔⠕",
		"ാ": "⠜",
		"ി": "⠊",
		"ീ": "⠔",
		"ു": "⠥",
		"ൂ": "⠳",
		"ൃ": "⠻",
		"െ": "⠢",
		"േ": "⠮",
		"ൈ": "⠿",
		"ൊ": "⠕",
		"ോ": "⠪",
		"ൌ": "⠔⠕",
		"ൗ": "⠕⠈",

		// Consonants
		ക: "⠅",
		ഖ: "⠨⠅",
		ഗ: "⠛",
		ഘ: "⠨⠛",
		ങ: "⠬",
		ച: "⠉",
		ഛ: "⠨⠉",
		ജ: "⠚",
		ഝ: "⠨⠚",
		ഞ: "⠭",
		ട: "⠾",
		ഠ: "⠨⠾",
		ഡ: "⠫",
		ഢ: "⠨⠫",
		ണ: "⠼",
		ത: "⠞",
		ഥ: "⠨⠞",
		ദ: "⠙",
		ധ: "⠨⠙",
		ന: "⠝",
		പ: "⠏",
		ഫ: "⠨⠏",
		ബ: "⠃",
		ഭ: "⠨⠃",
		മ: "⠍",
		യ: "⠽",
		ര: "⠗",
		ല: "⠇",
		വ: "⠧",
		ശ: "⠩",
		ഷ: "⠱",
		സ: "⠎",
		ഹ: "⠓",
		ള: "⠸",
		ഴ: "⠴",
		റ: "⠐⠗",

		// Chillu letters
		ൺ: "⠼⠈",
		ൻ: "⠝⠈",
		ർ: "⠗⠈",
		ൽ: "⠇⠈",
		ൾ: "⠸⠈",
		ൿ: "⠅⠈",

		// Other signs
		"്": "⠈",
		"ം": "⠰",
		"ഃ": "⠆",

		// Punctuation
		"।": "⠲",
		"॥": "⠶",
		ഽ: "⠐⠂",

		// Numbers
		"൦": "⠴",
		"൧": "⠂",
		"൨": "⠆",
		"൩": "⠒",
		"൪": "⠲",
		"൫": "⠢",
		"൬": "⠖",
		"൭": "⠶",
		"൮": "⠦",
		"൯": "⠔",

		// Special conjuncts
		"്യ": "⠽⠈",
		"്ര": "⠗⠈",
		"്ല": "⠇⠈",
		"്വ": "⠧⠈",
	},
};

function detectLanguage(text) {
	const hindiChars = /[\u0900-\u097F]/;
	const malayalamChars = /[\u0D00-\u0D7F]/;
	const frenchChars = /[àâçéèêëîïôùûü]/i;
	const spanishChars = /[áéíóúüñ¿¡]/i;

	if (hindiChars.test(text)) return "hindi";
	if (malayalamChars.test(text)) return "malayalam";
	if (frenchChars.test(text)) return "french";
	if (spanishChars.test(text)) return "spanish";
	return "english";
}

function isHindiVowelSign(char) {
	return ["ा", "ि", "ी", "ु", "ू", "ृ", "े", "ै", "ो", "ौ"].includes(char);
}

function isMalayalamVowelSign(char) {
	return [
		"ാ",
		"ി",
		"ീ",
		"ു",
		"ൂ",
		"ൃ",
		"െ",
		"േ",
		"ൈ",
		"ൊ",
		"ോ",
		"ൌ",
		"ൗ",
	].includes(char);
}

function isMalayalamChillu(char) {
	return ["ൺ", "ൻ", "ർ", "ൽ", "ൾ", "ൿ"].includes(char);
}

function convertToBraille(text) {
	if (!text || typeof text !== "string") return "";

	const language = detectLanguage(text);
	const brailleMap = brailleMaps[language];

	// Special handling for Indian languages
	if (language === "hindi" || language === "malayalam") {
		let result = "";

		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			const nextChar = text[i + 1];

			// Handle combined characters (consonant + vowel sign)
			if (nextChar) {
				// For Hindi
				if (language === "hindi" && isHindiVowelSign(nextChar)) {
					const combined = char + nextChar;
					if (brailleMap[combined]) {
						result += brailleMap[combined];
						i++; // Skip vowel sign
						continue;
					}
				}
				// For Malayalam
				else if (
					language === "malayalam" &&
					isMalayalamVowelSign(nextChar)
				) {
					const combined = char + nextChar;
					if (brailleMap[combined]) {
						result += brailleMap[combined];
						i++; // Skip vowel sign
						continue;
					}
				}
			}

			// Handle Malayalam chillu letters
			if (language === "malayalam" && isMalayalamChillu(char)) {
				result +=
					brailleMap[char] ||
					brailleMap[char.normalize("NFD")[0]] + "⠈";
				continue;
			}

			// Handle standalone characters
			result += brailleMap[char] || char;
		}
		return result;
	}

	// Handle Spanish ñ
	if (language === "spanish") {
		return text
			.toLowerCase()
			.split("")
			.map((char) => {
				if (char === "ñ") return "⠈⠝";
				if (char === "¿") return "⠢";
				if (char === "¡") return "⠖";
				return brailleMap[char] || char;
			})
			.join("");
	}

	// Standard conversion for other languages
	return text
		.toLowerCase()
		.split("")
		.map((char) => {
			// Handle French accented characters
			if (language === "french") {
				if (char === "é") return "⠿";
				if (char === "è" || char === "ê") return "⠮";
				if (char === "à") return "⠷";
				if (char === "ç") return "⠩";
				if (char === "ù" || char === "û") return "⠾";
				if (char === "ï" || char === "î") return "⠳";
			}
			return brailleMap[char] || char;
		})
		.join("");
}

app.post("/braille", async (req, res) => {
	try {
		let { filename } = req.body;
		const desktopPath = path.join(os.homedir(), "Desktop");

		// Sanitize filename
		filename = path.basename(filename);

		// File search logic
		const targetFilename = filename.toLowerCase();
		let files;
		try {
			files = await fs.readdir(desktopPath);
		} catch (err) {
			return res
				.status(500)
				.json({ error: "Error accessing Desktop directory." });
		}

		const lowerCaseFiles = files.map((file) => file.toLowerCase());
		const matchedIndex = lowerCaseFiles.indexOf(targetFilename);
		if (matchedIndex !== -1) {
			filename = files[matchedIndex];
		} else {
			const closestMatch = files.find((file) =>
				file
					.toLowerCase()
					.includes(targetFilename.replace(/\.(txt|docx|pdf)$/, ""))
			);
			if (closestMatch) filename = closestMatch;
			else return res.status(404).json({ error: "File not found." });
		}

		const filePath = path.join(desktopPath, filename);

		// Validate file extension
		const allowedExtensions = [".txt", ".docx", ".pdf"];
		if (!allowedExtensions.includes(path.extname(filename))) {
			return res.status(400).json({ error: "Unsupported file type." });
		}

		// Read file content
		let fileContent = "";
		if (filename.endsWith(".txt")) {
			fileContent = await fs.readFile(filePath, "utf-8");
		} else if (filename.endsWith(".docx")) {
			const data = await fs.readFile(filePath);
			const result = await mammoth.extractRawText({ buffer: data });
			fileContent = result.value.trim();
			if (!fileContent)
				return res
					.status(400)
					.json({ error: "File contains no readable text." });
		} else if (filename.endsWith(".pdf")) {
			const dataBuffer = await fs.readFile(filePath);
			const pdfData = await pdfParse(dataBuffer);
			fileContent = pdfData.text.trim();
			if (!fileContent) {
				return res
					.status(400)
					.json({ error: "PDF contains no readable text." });
			}
		}

		// Convert content to Braille
		const brailleText = convertToBraille(fileContent);
		const language = detectLanguage(fileContent);

		// Save Braille text to a file
		const brailleFilePath = path.join(desktopPath, `${filename}.brl`);
		await fs.writeFile(brailleFilePath, brailleText);

		return res.json({
			success: true,
			language,
			brailleText,
			downloadLink: `/download?path=${encodeURIComponent(
				brailleFilePath
			)}`,
		});
	} catch (error) {
		console.error("Error in convert-to-braille:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

// summarizer
const summarizeText = (text) => {
	if (!text) return "";

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

function calculateBleu(reference, candidate) {
	const referenceWords = reference
		.split(/\s+/)
		.map((word) => word.toLowerCase());
	const candidateWords = candidate
		.split(/\s+/)
		.map((word) => word.toLowerCase());

	const intersection = candidateWords.filter((word) =>
		referenceWords.includes(word)
	);
	const precision = intersection.length / candidateWords.length;

	return precision;
}

function calculateRouge(reference, candidate) {
	const referenceWords = reference
		.split(/\s+/)
		.map((word) => word.toLowerCase());
	const candidateWords = candidate
		.split(/\s+/)
		.map((word) => word.toLowerCase());

	const intersection = candidateWords.filter((word) =>
		referenceWords.includes(word)
	);
	const recall = intersection.length / referenceWords.length;

	return recall;
}

app.post("/summarize", async (req, res) => {
	try {
		let { filename } = req.body;
		const desktopPath = path.join(os.homedir(), "Desktop");

		filename = path.basename(filename);
		const targetFilename = filename.toLowerCase();

		let files;
		try {
			files = await fs.readdir(desktopPath);
		} catch (err) {
			return res
				.status(500)
				.json({ error: "Error accessing Desktop directory." });
		}

		const lowerCaseFiles = files.map((file) => file.toLowerCase());
		const matchedIndex = lowerCaseFiles.indexOf(targetFilename);
		if (matchedIndex !== -1) {
			filename = files[matchedIndex];
		} else {
			const closestMatch = files.find((file) =>
				file
					.toLowerCase()
					.includes(targetFilename.replace(/\.(txt|docx)$/, ""))
			);
			if (closestMatch) {
				filename = closestMatch;
			} else {
				return res.status(404).json({ error: "File not found." });
			}
		}

		const filePath = path.join(desktopPath, filename);
		const allowedExtensions = [".txt", ".docx", ".pdf"];
		if (!allowedExtensions.includes(path.extname(filename))) {
			return res.status(400).json({ error: "Unsupported file type." });
		}

		let fileContent = "";
		if (filename.endsWith(".txt")) {
			fileContent = await fs.readFile(filePath, "utf-8");
		} else if (filename.endsWith(".docx")) {
			const data = await fs.readFile(filePath);
			const result = await mammoth.extractRawText({ buffer: data });
			fileContent = result.value.trim();
			if (!fileContent) {
				return res
					.status(400)
					.json({ error: "DOCX contains no readable text." });
			}
		} else if (filename.endsWith(".pdf")) {
			const dataBuffer = await fs.readFile(filePath);
			const pdfData = await pdfParse(dataBuffer);
			fileContent = pdfData.text.trim();
			if (!fileContent) {
				return res
					.status(400)
					.json({ error: "PDF contains no readable text." });
			}
		}

		const referenceSummary = fileContent;
		const summary = summarizeText(fileContent);
		const bleuScore = calculateBleu(referenceSummary, summary);
		const rougeScore = calculateRouge(referenceSummary, summary);

		return res.json({
			summary,
			bleuScore: bleuScore || "Error in BLEU score",
			rougeScore: rougeScore || "Error in ROUGE score",
		});
	} catch (error) {
		console.error("Error in summarization:", error);
		return res.status(500).json({ error: "Error processing file" });
	}
});

// image recognition
app.post("/image", async (req, res) => {
	try {
		let { filename } = req.body;
		const desktopPath = path.join(os.homedir(), "Desktop");

		// Sanitize filename
		filename = path.basename(filename).toLowerCase();

		// Read all files in the Desktop directory
		let files;
		try {
			files = await fs.readdir(desktopPath);
		} catch (err) {
			return res
				.status(500)
				.json({ error: "Error accessing Desktop directory." });
		}

		// Filter for image files only
		const imageExtensions = [".jpg", ".jpeg", ".png"];
		const imageFiles = files.filter((file) =>
			imageExtensions.includes(path.extname(file).toLowerCase())
		);

		// Fuzzy search for the closest match
		const closestMatch = imageFiles.find((file) =>
			file
				.toLowerCase()
				.includes(filename.replace(/\.(jpg|jpeg|png)$/, ""))
		);

		if (!closestMatch) {
			return res.status(404).json({ error: "Image file not found." });
		}

		// Read the image file and convert it to Base64
		const filePath = path.join(desktopPath, closestMatch);
		const imageBuffer = await fs.readFile(filePath);
		const imageBase64 = imageBuffer.toString("base64");

		// Send the Base64 image to the Gemini API
		const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Replace with your API key
		const requestBody = {
			contents: [
				{
					parts: [
						{
							text: "Describe the objects and scene in this image. Do not use asterisks (*) for bolding text.",
						},
						{
							inlineData: {
								mimeType: `image/${path
									.extname(filePath)
									.slice(1)}`,
								data: imageBase64,
							},
						},
					],
				},
			],
		};

		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			}
		);

		const result = await response.json();

		if (result.candidates) {
			return res.json({
				success: true,
				description: result.candidates[0].content.parts[0].text,
			});
		} else {
			return res.status(500).json({ error: "Failed to analyze image." });
		}
	} catch (error) {
		console.error("Error in process-image:", error);
		return res.status(500).json({ error: "Internal server error." });
	}
});

app.post("/upload-image", async (req, res) => {
	try {
		const { base64Image, mimeType } = req.body;

		if (!base64Image || !mimeType) {
			return res.status(400).json({ error: "Invalid image data." });
		}

		// Ensure API key is set
		const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
		if (!GEMINI_API_KEY) {
			return res
				.status(500)
				.json({ error: "Server misconfiguration: missing API key." });
		}

		// Prepare request for Gemini API
		const requestBody = {
			contents: [
				{
					parts: [
						{
							text: "Describe the objects and scene in this image. Do not use asterisks (*) for bolding text.",
						},
						{
							inlineData: {
								mimeType,
								data: base64Image,
							},
						},
					],
				},
			],
		};

		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			}
		);

		const result = await response.json();

		if (result.candidates && result.candidates.length > 0) {
			return res.json({
				success: true,
				description: result.candidates[0].content.parts[0].text,
			});
		} else {
			return res.status(500).json({ error: "Failed to analyze image." });
		}
	} catch (error) {
		console.error("Error in /upload-image:", error);
		return res.status(500).json({ error: "Internal server error." });
	}
});

// translator
app.post("/translate", async (req, res) => {
	try {
		let { filename } = req.body;
		const desktopPath = path.join(os.homedir(), "Desktop");
		filename = path.basename(filename);

		const targetFilename = filename.toLowerCase();
		let files = await fs.readdir(desktopPath);
		const lowerCaseFiles = files.map((file) => file.toLowerCase());

		const matchedIndex = lowerCaseFiles.indexOf(targetFilename);
		if (matchedIndex !== -1) {
			filename = files[matchedIndex];
		} else {
			const closestMatch = files.find((file) =>
				file
					.toLowerCase()
					.includes(targetFilename.replace(/\.(txt|docx|pdf)$/, ""))
			);

			if (closestMatch) {
				filename = closestMatch;
			} else {
				return res.status(404).json({ error: "File not found." });
			}
		}

		const filePath = path.join(desktopPath, filename);
		const allowedExtensions = [".txt", ".docx", ".pdf"];
		if (!allowedExtensions.includes(path.extname(filename))) {
			return res.status(400).json({ error: "Unsupported file type." });
		}

		let fileContent = "";
		if (filename.endsWith(".txt")) {
			fileContent = await fs.readFile(filePath, "utf-8");
		} else if (filename.endsWith(".docx")) {
			const data = await fs.readFile(filePath);
			const result = await mammoth.extractRawText({ buffer: data });
			fileContent = result.value.trim();
			if (!fileContent)
				return res
					.status(400)
					.json({ error: "DOCX contains no readable text." });
		} else if (filename.endsWith(".pdf")) {
			const dataBuffer = await fs.readFile(filePath);
			const pdfData = await pdfParse(dataBuffer);
			fileContent = pdfData.text.trim();
			if (!fileContent)
				return res
					.status(400)
					.json({ error: "PDF contains no readable text." });
		}

		// Send text to Google Translate API
		const translateURL = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(
			fileContent
		)}`;
		const response = await fetch(translateURL);
		const translationData = await response.json();

		// Extract the translated text
		const translatedText = translationData[0]
			.map((item) => item[0])
			.join(" ");

		return res.json({ translation: translatedText });
	} catch (error) {
		console.error("Error in translation:", error);
		return res.status(500).json({ error: "Error processing translation." });
	}
});

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
