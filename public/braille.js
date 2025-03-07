const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Braille Mapping
const brailleMap = {
  'a': '\u2801', 'b': '\u2803', 'c': '\u2809', 'd': '\u2819', 'e': '\u2811',
  'f': '\u280B', 'g': '\u281B', 'h': '\u2813', 'i': '\u280A', 'j': '\u281A',
  'k': '\u2805', 'l': '\u2807', 'm': '\u280D', 'n': '\u281D', 'o': '\u2815',
  'p': '\u280F', 'q': '\u281F', 'r': '\u2817', 's': '\u280E', 't': '\u281E',
  'u': '\u2825', 'v': '\u2827', 'w': '\u283A', 'x': '\u282D', 'y': '\u283D', 'z': '\u2835',
  ' ': ' ', '.': '\u2832', ',': '\u2802', '?': '\u2822', '!': '\u2816'
};

// Convert Text to Braille
const convertToBraille = (text) => {
  return text.toLowerCase().split('').map(char => brailleMap[char] || char).join('');
};

app.post('/convert', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  
  const brailleText = convertToBraille(text);
  const filePath = `./public/output.brl`;
  fs.writeFileSync(filePath, brailleText);
  res.json({ brailleText, filePath: '/output.brl' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
