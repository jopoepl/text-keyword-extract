const stopWords = require("./stopWords");

/**
 * A class to extract and process keywords from text content
 * @class KeywordExtractor
 */
class KeywordExtractor {
  /**
   * Creates an instance of KeywordExtractor
   * @param {string} content - The text content to analyze
   * @param {string} [title] - Optional title for additional context
   * @throws {Error} When content is not a string
   */
  constructor(content, title = "") {
    if (typeof content !== "string") {
      throw new Error("Content must be a string");
    }
    this.content = content;
    this.title = title;
    this.keywords = [];
    this.words = [];
    this.stopWords = stopWords;
  }

  /**
   * Tokenizes the content into words
   * @returns {string[]} Array of tokens
   */
  tokenize() {
    try {
      // Split into sentences first
      const sentences = this.content.split(/([.!?])\s+/);

      // Process each sentence while preserving sentence boundaries
      return sentences
        .map((sentence) => {
          return sentence
            .replace(/([,;:])/g, " $1 ") // Add spaces around punctuation
            .split(/\s+/) // Split on whitespace
            .map((word) => word.trim())
            .filter(Boolean);
        })
        .flat();
    } catch (error) {
      console.error("Error tokenizing content:", error);
      return [];
    }
  }

  /**
   * Removes stop words from an array of tokens
   * @param {string[]} tokens - Array of words to process
   * @returns {string[]} Filtered array without stop words
   */
  removeStopWords(tokens) {
    if (!Array.isArray(tokens)) {
      throw new Error("Input must be an array of strings");
    }

    return tokens.flatMap((token) => {
      const words = token.split(" ");

      if (words.length === 1) {
        const lowercase = token.toLowerCase();
        const uppercase = token.toUpperCase();
        const capitalized =
          lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
        return !this.stopWords.has(lowercase) &&
          !this.stopWords.has(uppercase) &&
          !this.stopWords.has(capitalized)
          ? [token]
          : [];
      }

      const filteredWords = words.filter((word) => {
        const lowercase = word.toLowerCase();
        const uppercase = word.toUpperCase();
        const capitalized =
          lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
        return (
          !this.stopWords.has(lowercase) &&
          !this.stopWords.has(uppercase) &&
          !this.stopWords.has(capitalized)
        );
      });

      return filteredWords.length > 0 ? [filteredWords.join(" ")] : [];
    });
  }

  /**
   * Extracts proper nouns from the content
   * @returns {string[]} Array of proper nouns
   */
  findProperNouns() {
    // Get sentences and their words
    let sentences = this.content.split(/[.!?](?:\s+|\s*(?=[A-Z]))/);
    const properNouns = [];

    sentences.forEach((sentence) => {
      const words = sentence
        .split(/\s+/)
        .flatMap((word) =>
          word.includes("+") ? word.split(/\+/).filter(Boolean) : [word],
        )
        .filter(Boolean);
      for (let i = 0; i < words.length; i++) {
        let currentWord = words[i];

        // Skip words less than 2 characters or if it's a stop word
        if (
          currentWord.length < 2 ||
          this.stopWords.has(currentWord.toLowerCase())
        )
          continue;

        // Skip if it's the first word of a sentence (unless it matches our proper noun patterns)
        const isFirstWord = i === 0;
        const isProperNounPattern =
          /^[A-Z][a-z]*[A-Z][a-zA-Z]*$/.test(currentWord) || // Compound names (MacBook)
          (/^[A-Z][a-zA-Z0-9]*$/.test(currentWord) && /\d/.test(currentWord)); // Words with numbers (iPhone14)

        if (isFirstWord && !isProperNounPattern) continue;

        // Pattern 1: Single capitalized word (e.g., Samsung, Google)
        if (/^[A-Z][a-zA-Z]*$/.test(currentWord)) {
          properNouns.push(currentWord);
        }

        // Pattern 2 & 3: Already checked in isProperNounPattern
        if (isProperNounPattern) {
          properNouns.push(currentWord);
        }

        // Pattern 4: Multi-word proper nouns with technical specifications
        if (/^[A-Z]/.test(currentWord) && !isFirstWord) {
          let phrase = [currentWord];
          let j = i + 1;

          while (
            j < words.length &&
            (/^[A-Z]/.test(words[j]) || /^\d/.test(words[j]))
          ) {
            const nextWord = words[j];
            // Check for model numbers, technical specs, or capitalized words
            if (
              /^[A-Z]/.test(nextWord) || // Capitalized words
              /^\d/.test(nextWord) || // Numbers
              /^[A-Za-z]\d/.test(nextWord) || // Alphanumeric combinations
              /^[+]$/.test(nextWord) || // Plus sign
              nextWord.toLowerCase() === "plus" || // Word "plus"
              /^[A-Za-z]+\d+\+?$/.test(nextWord) // Words like "Dimensity9300+"
            ) {
              if (!this.stopWords.has(nextWord.toLowerCase())) {
                phrase.push(nextWord);
              }
              j++;
            } else {
              break;
            }
          }

          if (phrase.length > 1) {
            properNouns.push(phrase.join(" "));
            i = j - 1; // Skip processed words
          }
        }
      }
    });

    // Clean up and remove duplicates
    const cleanedProperNouns = this.cleanupKeywords(properNouns);
    const finalProperNouns = [
      ...new Set(this.removeStopWords(cleanedProperNouns)),
    ];
    this.keywords.push(...finalProperNouns);

    return finalProperNouns;
  }
  /**
   * Finds the most frequent keywords
   * @param {number} N - Number of top keywords to return
   * @returns {Array<{word: string, frequency: number}>} Array of keyword objects with frequencies
   */

  findHighFrequencyKeywords(N = 7) {
    if (typeof N !== "number" || N < 1) {
      throw new Error("N must be a positive number");
    }

    this.words = this.removeStopWords(this.tokenize());
    const frequency = this.words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    const keywordFreq = Object.entries(frequency)
      .filter(([word]) => !/^\d+$/.test(word))
      .sort(([, a], [, b]) => b - a)
      .slice(0, N + 1)
      .map(([word, freq]) => ({
        word,
        frequency: freq,
      }));

    // Clean first
    const cleanedKeywordFreq = keywordFreq
      .map((item) => ({
        word: this.cleanupKeywords([item.word])[0],
        frequency: item.frequency,
      }))
      .filter((item) => item.word);

    // Then update keywords array with cleaned words
    const newWords = cleanedKeywordFreq.map((item) => item.word);
    this.keywords = Array.from(new Set([...this.keywords, ...newWords]));

    return cleanedKeywordFreq; // Return cleaned version
  }

  /**
   * Extracts context keywords from the title
   * @returns {string[]|null} Array of context keywords or null if no title
   */
  findContextFromTitle() {
    if (!this.title) return null;
    const titleWords = this.title.split(/\s+/).filter(Boolean);
    const context = [];
    const titleWithoutStopWords = this.removeStopWords(titleWords).filter(
      (word) => {
        // Remove pure numbers
        if (/^\d+$/.test(word)) return false;

        // Remove prices (e.g., $400, $1,234, $1.99)
        if (/\$\d+/.test(word)) return false; // Will match any word containing $number

        // Alternative: more comprehensive price pattern
        if (/^[$€£¥]\d+(?:,\d+)*(?:\.\d+)?$/.test(word)) return false;

        return true;
      },
    );
    context.push(...new Set(titleWithoutStopWords));
    this.keywords.push(...context);
    this.keywords = Array.from(new Set(this.keywords));
    return context;
  }

  /**
   * Cleans up extracted keywords
   * @private
   * @returns {string[]} Cleaned keywords
   */
  cleanupKeywords(providedKeywords = null) {
    const wordsToClean = providedKeywords || this.keywords;

    const cleanedKeywords = wordsToClean
      .map((word) => {
        const cleaned = word
          // First remove trailing punctuation and symbols
          .replace(/[''""?":.,!;()[\]{}<>|\/\\~@#$%^&*+=_-]+$/g, "")
          // Remove leading punctuation and symbols
          .replace(/^[''—""?":.,!;()[\]{}<>|\/\\~@#$%^&*+=_-]+/g, "")
          // Optional: clean up any remaining quotes or apostrophes anywhere in the word
          .replace(/[''""]/g, "")
          // Optional: remove multiple spaces between words
          .replace(/\s+/g, " ")
          // Optional: trim any remaining whitespace
          .trim();
        const withoutPossessive = cleaned.replace(/['’]s\b/g, "");
        //handle edge case

        return withoutPossessive.trim();
      })
      .filter(Boolean);

    if (!providedKeywords) {
      this.keywords = Array.from(
        new Set(this.removeStopWords(cleanedKeywords)),
      );
    }
    return cleanedKeywords;
  }

  /**
   * Removes subset words from keywords
   * @returns {string[]} Final processed keywords
   */
  removeSubsetWords(text = null) {
    const wordsToProcess = this.keywords || text.tokenize();
    // Convert Set to Array for processing

    // Sort by length (descending) to process longer phrases first
    const sortedWords = wordsToProcess.sort((a, b) => b.length - a.length);

    // Keep track of words to remove
    const wordsToRemove = new Set();

    // Compare each word with others
    sortedWords.forEach((longWord) => {
      // Split the phrase into parts
      const parts = longWord.split(" ");

      // If it's a multi-word phrase, add its parts to removal list
      if (parts.length > 1) {
        parts.forEach((part) => {
          // Remove any punctuation/special chars for comparison
          const cleanPart = part.replace(/[''.,\s]+/g, "");
          wordsToRemove.add(cleanPart);
        });
      }
    });
    return sortedWords;
  }

  /**
   * Gets the final processed keywords
   * @returns {string[]} Array of extracted and processed keywords
   */
  extractKeywords() {
    this.findProperNouns();
    this.findHighFrequencyKeywords();
    this.findContextFromTitle();
    this.cleanupKeywords();
    return this.removeSubsetWords();
  }
}

module.exports = {
  KeywordExtractor,
  utilities: {
    removeStopWords: (tokens) =>
      new KeywordExtractor("").removeStopWords(tokens),
    findProperNouns: (content) =>
      new KeywordExtractor(content).findProperNouns(),
    findHighFrequencyKeywords: (content, N) =>
      new KeywordExtractor(content).findHighFrequencyKeywords(N),
  },
};
