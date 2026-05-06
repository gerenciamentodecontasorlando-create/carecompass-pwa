// WHO LMS Z-score calculation (Cole's LMS method)
// Reference: https://www.who.int/childgrowth/standards/

export interface LMS {
  L: number;
  M: number;
  S: number;
}

/**
 * Calculate Z-score from a measurement using LMS parameters.
 * Z = ((value/M)^L - 1) / (L*S)  when L != 0
 * Z = ln(value/M) / S            when L == 0
 */
export function lmsToZ(value: number, lms: LMS): number {
  const { L, M, S } = lms;
  if (L === 0) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
}

/** Convert Z-score to percentile (0-100) using normal CDF approximation */
export function zToPercentile(z: number): number {
  // Abramowitz & Stegun approximation
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * absZ);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const erf =
    1 -
    (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);
  return Math.round(((1 + sign * erf) / 2) * 1000) / 10;
}

/** Linear interpolation between two LMS rows by age */
export function interpolateLMS(ageMonths: number, table: Array<{ age: number } & LMS>): LMS | null {
  if (table.length === 0) return null;
  if (ageMonths <= table[0].age) return table[0];
  if (ageMonths >= table[table.length - 1].age) return table[table.length - 1];
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i];
    const b = table[i + 1];
    if (ageMonths >= a.age && ageMonths <= b.age) {
      const t = (ageMonths - a.age) / (b.age - a.age);
      return {
        L: a.L + (b.L - a.L) * t,
        M: a.M + (b.M - a.M) * t,
        S: a.S + (b.S - a.S) * t,
      };
    }
  }
  return null;
}

export interface ZResult {
  z: number;
  percentile: number;
  classification: string;
  alert: "normal" | "warning" | "danger";
}

export function classifyWeightForAge(z: number): ZResult {
  if (z < -3) return { z, percentile: zToPercentile(z), classification: "Muito baixo peso para a idade", alert: "danger" };
  if (z < -2) return { z, percentile: zToPercentile(z), classification: "Baixo peso para a idade", alert: "warning" };
  if (z > 2) return { z, percentile: zToPercentile(z), classification: "Peso elevado para a idade", alert: "warning" };
  return { z, percentile: zToPercentile(z), classification: "Peso adequado para a idade", alert: "normal" };
}

export function classifyHeightForAge(z: number): ZResult {
  if (z < -3) return { z, percentile: zToPercentile(z), classification: "Muito baixa estatura para a idade", alert: "danger" };
  if (z < -2) return { z, percentile: zToPercentile(z), classification: "Baixa estatura para a idade", alert: "warning" };
  return { z, percentile: zToPercentile(z), classification: "Estatura adequada para a idade", alert: "normal" };
}

export function classifyBMIForAge(z: number, ageYears: number): ZResult {
  // For < 5y vs ≥5y the cutoffs differ slightly per WHO; we use the more conservative ≥5y cutoffs
  if (z < -3) return { z, percentile: zToPercentile(z), classification: "Magreza acentuada", alert: "danger" };
  if (z < -2) return { z, percentile: zToPercentile(z), classification: "Magreza", alert: "warning" };
  if (ageYears < 5) {
    if (z > 3) return { z, percentile: zToPercentile(z), classification: "Obesidade", alert: "danger" };
    if (z > 2) return { z, percentile: zToPercentile(z), classification: "Sobrepeso", alert: "warning" };
    if (z > 1) return { z, percentile: zToPercentile(z), classification: "Risco de sobrepeso", alert: "warning" };
  } else {
    if (z > 3) return { z, percentile: zToPercentile(z), classification: "Obesidade grave", alert: "danger" };
    if (z > 2) return { z, percentile: zToPercentile(z), classification: "Obesidade", alert: "danger" };
    if (z > 1) return { z, percentile: zToPercentile(z), classification: "Sobrepeso", alert: "warning" };
  }
  return { z, percentile: zToPercentile(z), classification: "Eutrofia", alert: "normal" };
}

export function classifyHCForAge(z: number): ZResult {
  if (z < -2) return { z, percentile: zToPercentile(z), classification: "Microcefalia (investigar)", alert: "danger" };
  if (z > 2) return { z, percentile: zToPercentile(z), classification: "Macrocefalia (investigar)", alert: "danger" };
  return { z, percentile: zToPercentile(z), classification: "Perímetro cefálico adequado", alert: "normal" };
}

/** Corrected age for prematures (<37w) up to 24 months chronological */
export function correctedAgeMonths(chronoMonths: number, gestationalAgeWeeks?: number): number {
  if (!gestationalAgeWeeks || gestationalAgeWeeks >= 37) return chronoMonths;
  if (chronoMonths > 24) return chronoMonths;
  const diffWeeks = 40 - gestationalAgeWeeks;
  return Math.max(0, chronoMonths - diffWeeks / 4.345);
}
