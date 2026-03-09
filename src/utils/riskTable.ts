// 限界リスク表（最大速度表）
// 破産基準 -30% の場合に、破産確率が2%未満になる最大の1回あたりリスク量
// 出典: 株式会社CLEAR TRADE

const RR_ROWS = [10, 7, 5, 4, 3, 2.5, 2.2, 2, 1.8, 1.6, 1.4, 1.2, 1, 0.9, 0.8, 0.7, 0.6, 0.5];
const WIN_COLS = [20, 30, 40, 45, 50, 55, 60, 65, 70, 75, 80];

// null = '-' (not applicable)
const TABLE: (number | null)[][] = [
  [1.7, 3.1, 4.5, 5.3, 6.1, 7.0, 8.0, 9.1, 10.4, 11.9, 13.6], // RR 10
  [1.3, 2.8, 4.4, 5.2, 6.0, 7.0, 8.0, 9.1, 10.4, 11.9, 13.6], // RR 7
  [null, 2.4, 4.1, 5.0, 5.9, 6.8, 7.9, 9.0, 10.3, 11.8, 13.6], // RR 5
  [null, 1.9, 3.8, 4.7, 5.7, 6.7, 7.7, 8.9, 10.3, 11.8, 13.6], // RR 4
  [null, 1.1, 3.1, 4.2, 5.2, 6.3, 7.4, 8.7, 10.1, 11.6, 13.5], // RR 3
  [null, null, 2.6, 3.7, 4.8, 5.9, 7.1, 8.4, 9.9, 11.5, 13.4], // RR 2.5
  [null, null, 2.1, 3.2, 4.4, 5.6, 6.9, 8.2, 9.7, 11.3, 13.3], // RR 2.2
  [null, null, 1.6, 2.8, 4.1, 5.3, 6.6, 8.0, 9.5, 11.2, 13.1], // RR 2
  [null, null, 1.1, 2.4, 3.6, 4.9, 6.3, 7.7, 9.3, 11.0, 13.0], // RR 1.8
  [null, null, null, 1.8, 3.1, 4.4, 5.9, 7.3, 8.9, 10.7, 12.8], // RR 1.6
  [null, null, null, null, 2.4, 3.8, 5.3, 6.8, 8.5, 10.4, 12.5], // RR 1.4
  [null, null, null, null, 1.4, 2.9, 4.5, 6.2, 7.9, 9.9, 12.1], // RR 1.2
  [null, null, null, null, null, 1.7, 3.4, 5.2, 7.0, 9.1, 11.4], // RR 1
  [null, null, null, null, null, null, 2.6, 4.5, 6.4, 8.6, 11.0], // RR 0.9
  [null, null, null, null, null, null, 1.7, 3.6, 5.7, 7.9, 10.4], // RR 0.8
  [null, null, null, null, null, null, null, 2.6, 4.7, 7.1, 9.7],  // RR 0.7
  [null, null, null, null, null, null, null, 1.1, 3.4, 5.9, 8.7],  // RR 0.6
  [null, null, null, null, null, null, null, null, 1.7, 4.4, 7.3],  // RR 0.5
];

function findClosestIndex(arr: number[], value: number): number {
  let best = 0;
  let bestDist = Math.abs(arr[0] - value);
  for (let i = 1; i < arr.length; i++) {
    const dist = Math.abs(arr[i] - value);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export function lookupMaxRisk(winRate: number, rrRatio: number): number | null {
  const rowIdx = findClosestIndex(RR_ROWS, rrRatio);
  const colIdx = findClosestIndex(WIN_COLS, winRate);
  return TABLE[rowIdx][colIdx];
}

export { RR_ROWS, WIN_COLS, TABLE };
