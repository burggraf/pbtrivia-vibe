export interface ShuffledAnswer {
  text: string;
  label: 'A' | 'B' | 'C' | 'D';
  originalIndex: 0 | 1 | 2 | 3;
}

export interface ShuffledQuestion {
  shuffledAnswers: ShuffledAnswer[];
  correctAnswerIndex: 0 | 1 | 2 | 3; // Index in shuffledAnswers array
  correctAnswerLabel: 'A' | 'B' | 'C' | 'D'; // Corresponding label
}

/**
 * A simple seeded random number generator (xorshift)
 * This ensures the same seed always produces the same sequence of "random" numbers
 */
function seededRandom(seed: string): () => number {
  // Convert string seed to number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use xorshift algorithm for deterministic randomness
  let x = hash || 1; // Ensure non-zero seed

  return function() {
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xFFFFFFFF; // Convert to [0, 1) float
  };
}

/**
 * Fisher-Yates shuffle using seeded random number generator
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  const shuffled = [...array];
  const random = seededRandom(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Get shuffled answers for a question using secure key as seed
 * Since correct answer is always in answer_a, we track which index contains it after shuffling
 * @param key - Secure random key from game_questions.key field (only accessible to host)
 */
export function getShuffledAnswers(
  key: string,
  answerA: string,
  answerB: string,
  answerC: string,
  answerD: string
): ShuffledQuestion {
  // Original answers array (answer_a is always correct)
  const originalAnswers = [answerA, answerB, answerC, answerD];

  // Shuffle using secure key as seed
  const shuffledIndices = [0, 1, 2, 3];
  const shuffled = seededShuffle(shuffledIndices, key);

  // Create shuffled answers with labels
  const labels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const shuffledAnswers: ShuffledAnswer[] = shuffled.map((originalIndex, shuffledIndex) => ({
    text: originalAnswers[originalIndex],
    label: labels[shuffledIndex],
    originalIndex: originalIndex as 0 | 1 | 2 | 3
  }));

  // Find which shuffled position contains the correct answer (original index 0)
  const correctAnswerIndex = shuffledAnswers.findIndex(
    answer => answer.originalIndex === 0
  ) as 0 | 1 | 2 | 3;

  const correctAnswerLabel = labels[correctAnswerIndex];

  return {
    shuffledAnswers,
    correctAnswerIndex,
    correctAnswerLabel
  };
}

/**
 * Get just the shuffled answer texts (for display purposes)
 * @param key - Secure random key from game_questions.key field (only accessible to host)
 */
export function getShuffledAnswerTexts(
  key: string,
  answerA: string,
  answerB: string,
  answerC: string,
  answerD: string
): string[] {
  const result = getShuffledAnswers(key, answerA, answerB, answerC, answerD);
  return result.shuffledAnswers.map(answer => answer.text);
}

/**
 * Get the correct answer label for a shuffled question
 * SECURITY: This requires the secure key, which is only accessible to the host
 * @param key - Secure random key from game_questions.key field (only accessible to host)
 */
export function getCorrectAnswerLabel(
  key: string
): 'A' | 'B' | 'C' | 'D' {
  // Use a dummy shuffle to determine the correct answer position
  const result = getShuffledAnswers(
    key,
    'Correct',
    'Wrong1',
    'Wrong2',
    'Wrong3'
  );
  return result.correctAnswerLabel;
}

/**
 * Translate a shuffled answer label back to its original position
 * This is used by the host when grading answers after reveal
 * @param key - Secure random key from game_questions.key field
 * @param selectedLabel - The label (A/B/C/D) that the player selected
 * @returns The original label (A/B/C/D) before shuffling
 */
export function translateAnswerToOriginal(
  key: string,
  selectedLabel: 'A' | 'B' | 'C' | 'D'
): 'A' | 'B' | 'C' | 'D' {
  // Get the shuffle mapping
  const result = getShuffledAnswers(key, 'A', 'B', 'C', 'D');

  // Find which shuffled answer matches the selected label
  const selectedAnswer = result.shuffledAnswers.find(
    answer => answer.label === selectedLabel
  );

  if (!selectedAnswer) {
    throw new Error(`Invalid answer label: ${selectedLabel}`);
  }

  // Return the original label (A/B/C/D based on originalIndex 0/1/2/3)
  const originalLabels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  return originalLabels[selectedAnswer.originalIndex];
}

/**
 * Check if a translated answer is correct
 * @param translatedLabel - The answer after translation to original position
 * @returns true if correct (A is always correct in the original position)
 */
export function isTranslatedAnswerCorrect(
  translatedLabel: 'A' | 'B' | 'C' | 'D'
): boolean {
  return translatedLabel === 'A';
}