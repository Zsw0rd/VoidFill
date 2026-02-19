export type Category = "Strong" | "Moderate" | "Weak" | "Missing";

export function categoryFromScore(score: number): Category {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Weak";
  return "Missing";
}

export function categoryRank(c: Category): number {
  if (c === "Missing") return 4;
  if (c === "Weak") return 3;
  if (c === "Moderate") return 2;
  return 0;
}

export function priorityScore(args: { score: number; roleWeight: number; dependencyBonus: number }): number {
  const c = categoryFromScore(args.score);
  const rank = categoryRank(c);
  return Number((rank * args.roleWeight * (args.dependencyBonus || 1)).toFixed(3));
}
