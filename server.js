const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const cors = require("cors");
const mammoth = require("mammoth");

// Braille Mapping
const brailleMap = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
    'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
    'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
    ' ': ' ', '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖', "'": '⠄',
    '0': '⠴', '1': '⠂', '2': '⠆', '3': '⠒', '4': '⠲',
    '5': '⠢', '6': '⠖', '7': '⠶', '8': '⠦', '9': '⠔'
};

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Text Summarization Function
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
        score: sentence.split(/\s+/).reduce(
            (sum, word) => sum + (wordFreq[word.toLowerCase().replace(/[^a-z]/g, "")] || 0),
            0
        ),
    }));

    rankedSentences.sort((a, b) => b.score - a.score);

    return rankedSentences
        .slice(0, Math.ceil(sentences.length * 0.3))
        .map((s) => s.sentence)
        .join(" ");
};

// Convert Text to Braille
const convertToBraille = (text) => {
    return text.toLowerCase().split('').map(char => brailleMap[char] || char).join('');
};

// Unified File Processing Endpoint
app.post("/process-file", async (req, res) => {
    try {
        let { filename, action = "summarize" } = req.body;
        const desktopPath = path.join(os.homedir(), "Desktop");

        // Security: Sanitize filename
        filename = path.basename(filename);

        // File search logic
        const targetFilename = filename.toLowerCase();
        let files;
        try {
            files = await fs.readdir(desktopPath);
        } catch (err) {
            return res.status(500).json({ error: "Error accessing Desktop directory." });
        }

        const lowerCaseFiles = files.map((file) => file.toLowerCase());
        const matchedIndex = lowerCaseFiles.indexOf(targetFilename);
        if (matchedIndex !== -1) {
            filename = files[matchedIndex];
        } else {
            const closestMatch = files.find((file) =>
                file.toLowerCase().includes(targetFilename.replace(/\.(txt|docx)$/, ""))
            );
            if (closestMatch) filename = closestMatch;
            else return res.status(404).json({ error: "File not found." });
        }

        const filePath = path.join(desktopPath, filename);

        // Validate file extension
        const allowedExtensions = ['.txt', '.docx'];
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
            if (!fileContent) return res.status(400).json({ error: "File contains no readable text." });
        }

        if (action === "convert-to-braille") {
            const brailleText = convertToBraille(fileContent);
            const outputPath = path.join(__dirname, "public", "braille_output.brl");
            await fs.writeFile(outputPath, brailleText);
            return res.json({ 
                success: true,
                brailleText: brailleText,
                downloadLink: "/braille_output.brl" 
            });
        } else {
            const summary = summarizeText(fileContent);
            return res.json({ summary });
        }
    } catch (error) {
        console.error("Error processing file:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Backward compatibility for summarizer - SIMPLIFIED VERSION
// Backward compatibility for summarizer - FIXED VERSION
app.post("/check-file", async (req, res) => {
    try {
        let { filename } = req.body;
        const desktopPath = path.join(os.homedir(), "Desktop");

        // Security: Sanitize filename
        filename = path.basename(filename);

        // Convert to lowercase for case-insensitive matching
        const targetFilename = filename.toLowerCase();

        // Read all files in the Desktop directory
        let files;
        try {
            files = await fs.readdir(desktopPath);
        } catch (err) {
            return res.status(500).json({ error: "Error accessing Desktop directory." });
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
                file.toLowerCase().includes(targetFilename.replace(/\.(txt|docx)$/, ""))
            );

            if (closestMatch) {
                filename = closestMatch;
            } else {
                return res.status(404).json({ error: "File not found." });
            }
        }

        const filePath = path.join(desktopPath, filename);

        // Validate file extension
        const allowedExtensions = ['.txt', '.docx'];
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
                return res.status(400).json({ error: "DOCX contains no readable text." });
            }
        }

        const summary = summarizeText(fileContent);
        return res.json({ summary });

    } catch (error) {
        console.error("Error in check-file:", error);
        return res.status(500).json({ error: "Error processing file" });
    }
});
// Direct Text to Braille Conversion
app.post("/convert-to-braille", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "No text provided for conversion" });
        }

        const brailleText = convertToBraille(text);
        const outputPath = path.join(__dirname, "public", "braille_output.brl");
        await fs.writeFile(outputPath, brailleText);
        
        res.json({ 
            success: true,
            brailleText: brailleText,
            downloadLink: "/braille_output.brl" 
        });
    } catch (error) {
        console.error("Braille conversion error:", error);
        res.status(500).json({ error: "Error converting text to Braille" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
