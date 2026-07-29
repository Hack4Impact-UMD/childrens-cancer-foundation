// Reviewer scores use the old NIH scale: 1.0 (best) to 5.0 (worst) in 0.1
// increments. Averaging two of those lands on at most two decimals, but binary
// floats make (1.1 + 1.2) / 2 come out as 1.1500000000000001 — so averages are
// rounded before they are stored or shown.

// A single reviewer's score, e.g. 3 -> "3.0", 1.1 -> "1.1".
export const formatScore = (score: number): string => score.toFixed(1);

// Average of two reviewer scores, e.g. 1.15 -> "1.15", 1.2 -> "1.20".
export const formatAverageScore = (score: number): string => score.toFixed(2);

// Rounds an average to the two decimals the 0.1 scale can actually produce.
export const roundAverageScore = (score: number): number =>
    Math.round(score * 100) / 100;
