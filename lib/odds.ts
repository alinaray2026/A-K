// Modeli i koeficientëve: shpërndarje Poisson e golave nga vlerësimi i ekipeve.
export const SELECTIONS = ["1", "X", "2", "O", "U", "GG", "NG"] as const;
export type Selection = (typeof SELECTIONS)[number];

export const SELECTION_LABEL: Record<Selection, string> = {
  "1": "1",
  X: "X",
  "2": "2",
  O: "Mbi 2.5",
  U: "Nën 2.5",
  GG: "GG",
  NG: "NG",
};

const MARGIN = 1.06;

export function expectedGoals(homeRating: number, awayRating: number) {
  const diff = (homeRating - awayRating) / 50;
  return {
    home: round2(1.35 * Math.exp(diff) * 1.12),
    away: round2(1.35 * Math.exp(-diff) / 1.12),
  };
}

function poisson(k: number, l: number) {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-l) * l ** k) / f;
}

export function probabilities(lh: number, la: number) {
  const p = { "1": 0, X: 0, "2": 0, O: 0, U: 0, GG: 0, NG: 0 };
  for (let h = 0; h <= 15; h++) {
    for (let a = 0; a <= 15; a++) {
      const q = poisson(h, lh) * poisson(a, la);
      if (h > a) p["1"] += q;
      else if (h === a) p.X += q;
      else p["2"] += q;
      if (h + a > 2.5) p.O += q;
      else p.U += q;
      if (h > 0 && a > 0) p.GG += q;
      else p.NG += q;
    }
  }
  return p;
}

export function priceFor(prob: number) {
  return Math.max(1.01, round2(1 / (prob * MARGIN)));
}

export function oddsFor(lh: number, la: number): Record<Selection, number> {
  const p = probabilities(lh, la);
  const out = {} as Record<Selection, number>;
  for (const s of SELECTIONS) out[s] = priceFor(p[s]);
  return out;
}

export function selectionWins(sel: Selection, hg: number, ag: number) {
  switch (sel) {
    case "1": return hg > ag;
    case "X": return hg === ag;
    case "2": return hg < ag;
    case "O": return hg + ag > 2.5;
    case "U": return hg + ag < 2.5;
    case "GG": return hg > 0 && ag > 0;
    case "NG": return hg === 0 || ag === 0;
  }
}

function samplePoisson(l: number) {
  const L = Math.exp(-l);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

export function simulateScore(lh: number, la: number) {
  return { home: samplePoisson(lh), away: samplePoisson(la) };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
