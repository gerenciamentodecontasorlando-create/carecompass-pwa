// WHO Child Growth Standards — LMS reference data (subset, interpolated at runtime)
// Source: https://www.who.int/childgrowth/standards/
// We include monthly values for key ages; intermediate values are linearly interpolated.

import type { LMS } from "./whoZScore";

export type Sex = "M" | "F";
export type LMSRow = { age: number } & LMS; // age in months

// Weight-for-age — Boys (kg), 0-60 months (subset)
export const WFA_BOYS: LMSRow[] = [
  { age: 0, L: 0.3487, M: 3.3464, S: 0.14602 },
  { age: 1, L: 0.2297, M: 4.4709, S: 0.13395 },
  { age: 2, L: 0.197, M: 5.5675, S: 0.12385 },
  { age: 3, L: 0.1738, M: 6.3762, S: 0.11727 },
  { age: 4, L: 0.1553, M: 7.0023, S: 0.11316 },
  { age: 5, L: 0.1395, M: 7.5105, S: 0.11080 },
  { age: 6, L: 0.1257, M: 7.934, S: 0.10958 },
  { age: 9, L: 0.0958, M: 8.9014, S: 0.10898 },
  { age: 12, L: 0.0728, M: 9.6479, S: 0.11065 },
  { age: 18, L: 0.0388, M: 10.9385, S: 0.11526 },
  { age: 24, L: 0.0145, M: 12.1515, S: 0.12012 },
  { age: 36, L: -0.0214, M: 14.3247, S: 0.12996 },
  { age: 48, L: -0.0466, M: 16.3185, S: 0.13864 },
  { age: 60, L: -0.0666, M: 18.3026, S: 0.14685 },
];

// Weight-for-age — Girls
export const WFA_GIRLS: LMSRow[] = [
  { age: 0, L: 0.3809, M: 3.2322, S: 0.14171 },
  { age: 1, L: 0.1714, M: 4.1873, S: 0.13724 },
  { age: 2, L: 0.0962, M: 5.1282, S: 0.13      },
  { age: 3, L: 0.0402, M: 5.8458, S: 0.12619 },
  { age: 4, L: -0.005, M: 6.4237, S: 0.12402 },
  { age: 5, L: -0.043, M: 6.8985, S: 0.12274 },
  { age: 6, L: -0.0756, M: 7.297, S: 0.12204 },
  { age: 9, L: -0.1564, M: 8.2308, S: 0.12222 },
  { age: 12, L: -0.2159, M: 8.9481, S: 0.12361 },
  { age: 18, L: -0.3037, M: 10.2315, S: 0.12685 },
  { age: 24, L: -0.366, M: 11.4775, S: 0.13029 },
  { age: 36, L: -0.4534, M: 13.857, S: 0.13738 },
  { age: 48, L: -0.5118, M: 16.024, S: 0.14376 },
  { age: 60, L: -0.5565, M: 18.197, S: 0.14947 },
];

// Length/Height-for-age — Boys (cm)
export const HFA_BOYS: LMSRow[] = [
  { age: 0, L: 1, M: 49.8842, S: 0.0379 },
  { age: 1, L: 1, M: 54.7244, S: 0.03557 },
  { age: 2, L: 1, M: 58.4249, S: 0.03424 },
  { age: 3, L: 1, M: 61.4292, S: 0.03328 },
  { age: 6, L: 1, M: 67.6236, S: 0.03165 },
  { age: 12, L: 1, M: 75.7488, S: 0.03361 },
  { age: 24, L: 1, M: 87.1161, S: 0.03601 },
  { age: 36, L: 1, M: 95.2729, S: 0.03747 },
  { age: 48, L: 1, M: 102.3402, S: 0.03842 },
  { age: 60, L: 1, M: 109.0816, S: 0.0398 },
  { age: 72, L: 1, M: 116, S: 0.041 },
  { age: 96, L: 1, M: 128, S: 0.044 },
  { age: 120, L: 1, M: 138.7, S: 0.046 },
  { age: 144, L: 1, M: 149.1, S: 0.05 },
  { age: 168, L: 1, M: 162.5, S: 0.053 },
  { age: 192, L: 1, M: 173, S: 0.052 },
  { age: 216, L: 1, M: 176.5, S: 0.045 },
  { age: 228, L: 1, M: 177, S: 0.043 },
];

// Length/Height-for-age — Girls
export const HFA_GIRLS: LMSRow[] = [
  { age: 0, L: 1, M: 49.1477, S: 0.0379 },
  { age: 1, L: 1, M: 53.6872, S: 0.0364 },
  { age: 2, L: 1, M: 57.0673, S: 0.03568 },
  { age: 3, L: 1, M: 59.8029, S: 0.03522 },
  { age: 6, L: 1, M: 65.7311, S: 0.03371 },
  { age: 12, L: 1, M: 74.0149, S: 0.0358 },
  { age: 24, L: 1, M: 85.7153, S: 0.038 },
  { age: 36, L: 1, M: 94.0728, S: 0.039 },
  { age: 48, L: 1, M: 101.3522, S: 0.0399 },
  { age: 60, L: 1, M: 108.0656, S: 0.0411 },
  { age: 72, L: 1, M: 115, S: 0.042 },
  { age: 96, L: 1, M: 127.3, S: 0.045 },
  { age: 120, L: 1, M: 138.6, S: 0.048 },
  { age: 144, L: 1, M: 151.2, S: 0.051 },
  { age: 168, L: 1, M: 159.8, S: 0.046 },
  { age: 192, L: 1, M: 162.5, S: 0.04 },
  { age: 216, L: 1, M: 163, S: 0.039 },
  { age: 228, L: 1, M: 163.2, S: 0.039 },
];

// BMI-for-age — Boys (kg/m²)
export const BMI_BOYS: LMSRow[] = [
  { age: 0, L: -0.3053, M: 13.4069, S: 0.09604 },
  { age: 6, L: -0.5567, M: 17.2528, S: 0.0822 },
  { age: 12, L: -0.6396, M: 17.2401, S: 0.08129 },
  { age: 24, L: -0.6997, M: 16.0287, S: 0.0825 },
  { age: 36, L: -0.7416, M: 15.5938, S: 0.0843 },
  { age: 48, L: -0.7706, M: 15.3389, S: 0.0859 },
  { age: 60, L: -0.7864, M: 15.2641, S: 0.0875 },
  { age: 72, L: -1.6318, M: 15.27, S: 0.087 },
  { age: 96, L: -2.0286, M: 15.85, S: 0.099 },
  { age: 120, L: -2.169, M: 16.86, S: 0.117 },
  { age: 144, L: -2.157, M: 18.27, S: 0.131 },
  { age: 168, L: -2.012, M: 19.83, S: 0.139 },
  { age: 192, L: -1.793, M: 21.18, S: 0.142 },
  { age: 216, L: -1.564, M: 22.12, S: 0.142 },
  { age: 228, L: -1.45, M: 22.5, S: 0.143 },
];

// BMI-for-age — Girls
export const BMI_GIRLS: LMSRow[] = [
  { age: 0, L: -0.0631, M: 13.3363, S: 0.09542 },
  { age: 6, L: -0.5946, M: 16.6, S: 0.083 },
  { age: 12, L: -0.7173, M: 16.5, S: 0.082 },
  { age: 24, L: -0.794, M: 15.7, S: 0.0857 },
  { age: 36, L: -0.872, M: 15.3, S: 0.088 },
  { age: 48, L: -0.91, M: 15.2, S: 0.0905 },
  { age: 60, L: -0.92, M: 15.2, S: 0.093 },
  { age: 72, L: -1.16, M: 15.3, S: 0.094 },
  { age: 96, L: -1.66, M: 15.95, S: 0.111 },
  { age: 120, L: -1.84, M: 17.04, S: 0.131 },
  { age: 144, L: -1.86, M: 18.61, S: 0.146 },
  { age: 168, L: -1.74, M: 20.18, S: 0.152 },
  { age: 192, L: -1.55, M: 21.18, S: 0.154 },
  { age: 216, L: -1.34, M: 21.7, S: 0.155 },
  { age: 228, L: -1.23, M: 21.85, S: 0.156 },
];

// Head circumference-for-age — Boys (cm), 0-60 months
export const HC_BOYS: LMSRow[] = [
  { age: 0, L: 1, M: 34.4618, S: 0.03686 },
  { age: 1, L: 1, M: 37.2759, S: 0.03133 },
  { age: 2, L: 1, M: 39.1285, S: 0.02997 },
  { age: 3, L: 1, M: 40.5135, S: 0.02918 },
  { age: 6, L: 1, M: 43.2493, S: 0.02795 },
  { age: 12, L: 1, M: 45.9776, S: 0.02713 },
  { age: 24, L: 1, M: 48.2691, S: 0.02683 },
  { age: 36, L: 1, M: 49.4757, S: 0.02671 },
  { age: 48, L: 1, M: 50.3027, S: 0.02666 },
  { age: 60, L: 1, M: 50.9532, S: 0.02666 },
];

// Head circumference-for-age — Girls
export const HC_GIRLS: LMSRow[] = [
  { age: 0, L: 1, M: 33.8787, S: 0.03496 },
  { age: 1, L: 1, M: 36.5463, S: 0.03210 },
  { age: 2, L: 1, M: 38.2521, S: 0.03105 },
  { age: 3, L: 1, M: 39.5328, S: 0.03039 },
  { age: 6, L: 1, M: 42.1995, S: 0.02955 },
  { age: 12, L: 1, M: 44.8765, S: 0.02921 },
  { age: 24, L: 1, M: 47.1497, S: 0.02921 },
  { age: 36, L: 1, M: 48.3439, S: 0.02921 },
  { age: 48, L: 1, M: 49.1626, S: 0.02921 },
  { age: 60, L: 1, M: 49.8112, S: 0.02921 },
];

export function getWFA(sex: Sex) { return sex === "M" ? WFA_BOYS : WFA_GIRLS; }
export function getHFA(sex: Sex) { return sex === "M" ? HFA_BOYS : HFA_GIRLS; }
export function getBMI(sex: Sex) { return sex === "M" ? BMI_BOYS : BMI_GIRLS; }
export function getHC(sex: Sex) { return sex === "M" ? HC_BOYS : HC_GIRLS; }
