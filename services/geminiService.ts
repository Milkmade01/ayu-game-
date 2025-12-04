
export const getGameCommentary = (score: number): string => {
  if (score === 0) return "Instant regret.";
  if (score < 5) return "That was... quick. Try opening your eyes!";
  if (score < 10) return "Gravity is a harsh mistress.";
  if (score < 20) return "Not bad, but the buildings are still winning.";
  if (score < 30) return "Okay, you're actually getting decent at this.";
  if (score < 50) return "Look at you go! Impressive skills!";
  return "You are a Flappy God! Unbelievable!";
};
