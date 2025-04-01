const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const cors = require("cors");
const mammoth = require("mammoth");

// Complete Braille Mappings for All Supported Languages
const brailleMaps = {
    english: {
        'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
        'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
        'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
        'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
        'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
        ' ': ' ', '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖', "'": '⠄',
        '0': '⠴', '1': '⠂', '2': '⠆', '3': '⠒', '4': '⠲',
        '5': '⠢', '6': '⠖', '7': '⠶', '8': '⠦', '9': '⠔'
    },
    french: {
        'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
        'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
        'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
        'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
        'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
        'à': '⠷', 'â': '⠡', 'ç': '⠩', 'é': '⠿', 'è': '⠮', 'ê': '⠣',
        'ë': '⠫', 'î': '⠻', 'ï': '⠳', 'ô': '⠹', 'ù': '⠾', 'û': '⠢', 'ü': '⠬'
    },
    spanish: {
        'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
        'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
        'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
        'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
        'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
        'á': '⠷', 'é': '⠿', 'í': '⠌', 'ó': '⠬', 'ú': '⠾', 'ü': '⠳',
        'ñ': '⠈⠝', '¿': '⠢', '¡': '⠖'
    },
    hindi: {
        // Vowels
        'अ': '⠁', 'आ': '⠜', 'इ': '⠊', 'ई': '⠔', 'उ': '⠥',
        'ऊ': '⠳', 'ऋ': '⠻', 'ए': '⠢', 'ऐ': '⠿', 'ओ': '⠕',
        'औ': '⠪',
        
        // Consonants
        'क': '⠅', 'ख': '⠨⠅', 'ग': '⠛', 'घ': '⠨⠛', 'ङ': '⠬',
        'च': '⠉', 'छ': '⠨⠉', 'ज': '⠚', 'झ': '⠨⠚', 'ञ': '⠭',
        'ट': '⠾', 'ठ': '⠨⠾', 'ड': '⠫', 'ढ': '⠨⠫', 'ण': '⠼',
        'त': '⠞', 'थ': '⠨⠞', 'द': '⠙', 'ध': '⠨⠙', 'न': '⠝',
        'प': '⠏', 'फ': '⠨⠏', 'ब': '⠃', 'भ': '⠨⠃', 'म': '⠍',
        'य': '⠽', 'र': '⠗', 'ल': '⠇', 'व': '⠧', 'श': '⠩',
        'ष': '⠱', 'स': '⠎', 'ह': '⠓',
        
        // Matras (Vowel signs)
        'ा': '⠜', 'ि': '⠊', 'ी': '⠔', 'ु': '⠥', 'ू': '⠳',
        'ृ': '⠻', 'े': '⠢', 'ै': '⠿', 'ो': '⠕', 'ौ': '⠪',
        
        // Punctuation/Numbers
        '।': '⠲', '॥': '⠶', '्': '⠈', 'ं': '⠰', 'ः': '⠆',
        '०': '⠴', '१': '⠂', '२': '⠆', '३': '⠒', '४': '⠲',
        '५': '⠢', '६': '⠖', '७': '⠶', '८': '⠦', '९': '⠔'
    },
    malayalam: {
        // Vowels and vowel signs
        'അ': '⠁', 'ആ': '⠜', 'ഇ': '⠊', 'ഈ': '⠔', 'ഉ': '⠥',
        'ഊ': '⠳', 'ഋ': '⠻', 'എ': '⠢', 'ഏ': '⠮', 'ഐ': '⠿',
        'ഒ': '⠕', 'ഓ': '⠪', 'ഔ': '⠔⠕',
        'ാ': '⠜', 'ി': '⠊', 'ീ': '⠔', 'ു': '⠥', 'ൂ': '⠳',
        'ൃ': '⠻', 'െ': '⠢', 'േ': '⠮', 'ൈ': '⠿', 'ൊ': '⠕',
        'ോ': '⠪', 'ൌ': '⠔⠕', 'ൗ': '⠕⠈',
        
        // Consonants
        'ക': '⠅', 'ഖ': '⠨⠅', 'ഗ': '⠛', 'ഘ': '⠨⠛', 'ങ': '⠬',
        'ച': '⠉', 'ഛ': '⠨⠉', 'ജ': '⠚', 'ഝ': '⠨⠚', 'ഞ': '⠭',
        'ട': '⠾', 'ഠ': '⠨⠾', 'ഡ': '⠫', 'ഢ': '⠨⠫', 'ണ': '⠼',
        'ത': '⠞', 'ഥ': '⠨⠞', 'ദ': '⠙', 'ധ': '⠨⠙', 'ന': '⠝',
        'പ': '⠏', 'ഫ': '⠨⠏', 'ബ': '⠃', 'ഭ': '⠨⠃', 'മ': '⠍',
        'യ': '⠽', 'ര': '⠗', 'ല': '⠇', 'വ': '⠧', 'ശ': '⠩',
        'ഷ': '⠱', 'സ': '⠎', 'ഹ': '⠓', 'ള': '⠸', 'ഴ': '⠴',
        'റ': '⠐⠗',
        
        // Chillu letters
        'ൺ': '⠼⠈', 'ൻ': '⠝⠈', 'ർ': '⠗⠈', 'ൽ': '⠇⠈', 'ൾ': '⠸⠈', 'ൿ': '⠅⠈',
        
        // Other signs
        '്': '⠈', 'ം': '⠰', 'ഃ': '⠆',
        
        // Punctuation
        '।': '⠲', '॥': '⠶', 'ഽ': '⠐⠂',
        
        // Numbers
        '൦': '⠴', '൧': '⠂', '൨': '⠆', '൩': '⠒', '൪': '⠲',
        '൫': '⠢', '൬': '⠖', '൭': '⠶', '൮': '⠦', '൯': '⠔',
        
        // Special conjuncts
        '്യ': '⠽⠈', '്ര': '⠗⠈', '്ല': '⠇⠈', '്വ': '⠧⠈'
    }
};

// Language Detection Function
function detectLanguage(text) {
    const hindiChars = /[\u0900-\u097F]/;
    const malayalamChars = /[\u0D00-\u0D7F]/;
    const frenchChars = /[àâçéèêëîïôùûü]/i;
    const spanishChars = /[áéíóúüñ¿¡]/i;
    
    if (hindiChars.test(text)) return 'hindi';
    if (malayalamChars.test(text)) return 'malayalam';
    if (frenchChars.test(text)) return 'french';
    if (spanishChars.test(text)) return 'spanish';
    return 'english';
}

// Helper Functions for Malayalam
function isMalayalamVowelSign(char) {
    return ['ാ', 'ി', 'ീ', 'ു', 'ൂ', 'ൃ', 'െ', 'േ', 'ൈ', 'ൊ', 'ോ', 'ൌ', 'ൗ'].includes(char);
}

function isMalayalamChillu(char) {
    return ['ൺ', 'ൻ', 'ർ', 'ൽ', 'ൾ', 'ൿ'].includes(char);
}

// Enhanced Braille Conversion Function
function convertToBraille(text) {
    if (!text || typeof text !== 'string') return '';
    
    const language = detectLanguage(text);
    const brailleMap = brailleMaps[language];
    
    console.log(`Detected language: ${language}`);
    
    // Special handling for Indian languages
    if (language === 'hindi' || language === 'malayalam') {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i+1];
            
            // Handle combined characters (consonant + vowel sign)
            if (nextChar) {
                // For Hindi
                if (language === 'hindi' && isHindiVowelSign(nextChar)) {
                    const combined = char + nextChar;
                    if (brailleMap[combined]) {
                        result += brailleMap[combined];
                        i++; // Skip vowel sign
                        continue;
                    }
                }
                // For Malayalam
                else if (language === 'malayalam' && isMalayalamVowelSign(nextChar)) {
                    const combined = char + nextChar;
                    if (brailleMap[combined]) {
                        result += brailleMap[combined];
                        i++; // Skip vowel sign
                        continue;
                    }
                }
            }
            
            // Handle Malayalam chillu letters
            if (language === 'malayalam' && isMalayalamChillu(char)) {
                result += brailleMap[char] || (brailleMap[char.normalize("NFD")[0]] + '⠈');
                continue;
            }
            
            // Handle standalone characters
            result += brailleMap[char] || char;
        }
        return result;
    }
    
    // Handle Spanish ñ
    if (language === 'spanish') {
        return text.toLowerCase().split('').map(char => {
            if (char === 'ñ') return '⠈⠝';
            if (char === '¿') return '⠢';
            if (char === '¡') return '⠖';
            return brailleMap[char] || char;
        }).join('');
    }
    
    // Standard conversion for other languages
    return text.toLowerCase().split('').map(char => {
        // Handle French accented characters
        if (language === 'french') {
            if (char === 'é') return '⠿';
            if (char === 'è' || char === 'ê') return '⠮';
            if (char === 'à') return '⠷';
            if (char === 'ç') return '⠩';
            if (char === 'ù' || char === 'û') return '⠾';
            if (char === 'ï' || char === 'î') return '⠳';
        }
        return brailleMap[char] || char;
    }).join('');
}

// Helper functions
function isHindiVowelSign(char) {
    return ['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ'].includes(char);
}

function isMalayalamVowelSign(char) {
    return ['ാ', 'ി', 'ീ', 'ു', 'ൂ', 'ൃ', 'െ', 'േ', 'ൈ', 'ൊ', 'ോ', 'ൌ', 'ൗ'].includes(char);
}

function isMalayalamChillu(char) {
    return ['ൺ', 'ൻ', 'ർ', 'ൽ', 'ൾ', 'ൿ'].includes(char);
}



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
            const language = detectLanguage(fileContent);
            const outputPath = path.join(__dirname, "public", "braille_output.brl");
            await fs.writeFile(outputPath, brailleText);
            return res.json({ 
                success: true,
                language,
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

// Backward compatibility for summarizer
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
            filename = files[matchedIndex];
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
        const language = detectLanguage(text);
        const outputPath = path.join(__dirname, "public", "braille_output.brl");
        await fs.writeFile(outputPath, brailleText);
        
        res.json({ 
            success: true,
            language,
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
