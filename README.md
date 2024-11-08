# text-keyword-extractor

Extract keywords from text content with various processing options.

## Installation
```bash
npm install text-keyword-extractor

Text Keyword Extractor
A Node.js package for extracting keywords from text content. This package identifies proper nouns, high-frequency words, and contextual keywords from both content and titles while filtering out common stop words.
Features

Proper noun extraction (including compound names and terms with numbers)
High-frequency keyword identification
Context extraction from titles
Stop words filtering
Support for multi-word phrases
Customizable frequency threshold

Installation
Copynpm install text-keyword-extractor
Usage
Basic Usage
javascriptCopyconst { KeywordExtractor } = require('text-keyword-extractor');

// Initialize with content and optional title
const content = `Google and Microsoft announced new AI features.
                 OpenAI's ChatGPT continues to evolve.
                 Apple and Amazon are also investing in AI technology.`;
const title = "Tech Giants Announce AI Features";

const extractor = new KeywordExtractor(content, title);
const keywords = extractor.extractKeywords();
console.log(keywords);
// Output: ["OpenAI ChatGPT", "Google", "Microsoft", "Apple", "Amazon", "AI", "Tech Giants"]
Individual Methods
1. Extract Proper Nouns
javascriptCopyconst { KeywordExtractor } = require('text-keyword-extractor');

const content = "Microsoft and Google are working with OpenAI.";
const extractor = new KeywordExtractor(content);
const properNouns = extractor.findProperNouns();
console.log(properNouns);
// Output: ["Microsoft", "Google", "OpenAI"]
2. Find High-Frequency Keywords
javascriptCopyconst extractor = new KeywordExtractor(content);
const frequentWords = extractor.findHighFrequencyKeywords(5); // Get top 5 keywords
console.log(frequentWords);
// Output: [
//   { word: "AI", frequency: 3 },
//   { word: "technology", frequency: 2 }
// ]
3. Extract Keywords from Title
javascriptCopyconst extractor = new KeywordExtractor(content, "Breaking: ChatGPT Launches New Features");
const titleContext = extractor.findContextFromTitle();
console.log(titleContext);
// Output: ["ChatGPT", "Features"]
Utility Functions
You can also use individual utility functions without creating an instance:
javascriptCopyconst { utilities } = require('text-keyword-extractor');

// Remove stop words from array
const cleaned = utilities.removeStopWords(["The", "quick", "brown", "fox"]);
console.log(cleaned); // ["quick", "brown", "fox"]

// Find proper nouns in text
const properNouns = utilities.findProperNouns("Google and Microsoft announced new features");
console.log(properNouns); // ["Google", "Microsoft"]

// Get frequent keywords
const frequent = utilities.findHighFrequencyKeywords(content, 5);
console.log(frequent); // Returns top 5 frequent words with their counts
API Reference
Class: KeywordExtractor
Constructor
javascriptCopyconst extractor = new KeywordExtractor(content, title);

content (string): The text content to analyze
title (string, optional): Additional title for context

Methods
extractKeywords()
Returns an array of extracted keywords after processing all available methods.
findProperNouns()
Extracts proper nouns from the content. Identifies:

Single capitalized words (e.g., Google)
Compound names (e.g., MacBook)
Terms with numbers (e.g., iPhone14)
Multi-word proper nouns (e.g., Saudi Arabia)

findHighFrequencyKeywords(N)
Returns top N frequent keywords with their frequency counts.

N (number, default: 7): Number of keywords to return

findContextFromTitle()
Extracts relevant keywords from the title after removing stop words.
removeStopWords(tokens)
Removes common stop words from an array of tokens.

tokens (string[]): Array of words to process

License
MIT
