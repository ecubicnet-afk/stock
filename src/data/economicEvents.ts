import type { ScheduleEvent } from '../types';

// 2026年3月〜12月 主要経済指標・中銀イベント（日本時間JST）
// 重要度: high=米雇用統計/CPI/GDP/FOMC/日本GDP/日銀, medium=PCE/PPI/小売/日本CPI/短観, low=家計調査/労働力調査/鉱工業生産

export const DEFAULT_ECONOMIC_EVENTS: ScheduleEvent[] = [
  // ===== SQ（先物・オプション特別清算指数） =====
  // メジャーSQ: 3月・6月・9月・12月の第2金曜日（high）
  // 通常SQ: その他の月の第2金曜日（medium）
  { id: 'econ-0313-sq', title: 'メジャーSQ（3月限）', date: '2026-03-13', time: '09:00', importance: 'high' },
  { id: 'econ-0410-sq', title: 'SQ（4月限）', date: '2026-04-10', time: '09:00', importance: 'medium' },
  { id: 'econ-0508-sq', title: 'SQ（5月限）', date: '2026-05-08', time: '09:00', importance: 'medium' },
  { id: 'econ-0612-sq', title: 'メジャーSQ（6月限）', date: '2026-06-12', time: '09:00', importance: 'high' },
  { id: 'econ-0710-sq', title: 'SQ（7月限）', date: '2026-07-10', time: '09:00', importance: 'medium' },
  { id: 'econ-0814-sq', title: 'SQ（8月限）', date: '2026-08-14', time: '09:00', importance: 'medium' },
  { id: 'econ-0911-sq', title: 'メジャーSQ（9月限）', date: '2026-09-11', time: '09:00', importance: 'high' },
  { id: 'econ-1009-sq', title: 'SQ（10月限）', date: '2026-10-09', time: '09:00', importance: 'medium' },
  { id: 'econ-1113-sq', title: 'SQ（11月限）', date: '2026-11-13', time: '09:00', importance: 'medium' },
  { id: 'econ-1211-sq', title: 'メジャーSQ（12月限）', date: '2026-12-11', time: '09:00', importance: 'high' },

  // ===== 3月 =====
  { id: 'econ-0306-nfp', title: '米雇用統計（2月分）', date: '2026-03-06', time: '22:30', importance: 'high' },
  { id: 'econ-0310-household', title: '家計調査（1月分）', date: '2026-03-10', time: '08:30', importance: 'low' },
  { id: 'econ-0310-jpgdp', title: '日本GDP速報（10-12月期・2次速報）', date: '2026-03-10', time: '08:50', importance: 'high' },
  { id: 'econ-0311-cpi', title: '米CPI（2月分）', date: '2026-03-11', time: '22:30', importance: 'high' },
  { id: 'econ-0313-pce', title: '米PCE（1月分）', date: '2026-03-13', time: '21:30', importance: 'medium' },
  { id: 'econ-0313-gdp2', title: '米GDP改定値（10-12月期・2次推計）', date: '2026-03-13', time: '21:30', importance: 'high' },
  { id: 'econ-0319-boj', title: '日銀金融政策決定会合 結果公表', date: '2026-03-19', time: '12:00', importance: 'high' },
  { id: 'econ-0319-fomc', title: 'FOMC政策声明（3月会合）', date: '2026-03-19', time: '03:00', importance: 'high' },
  { id: 'econ-0324-jpcpi', title: '全国CPI（2月分）', date: '2026-03-24', time: '08:30', importance: 'medium' },
  { id: 'econ-0331-labor', title: '労働力調査（2月分）', date: '2026-03-31', time: '08:30', importance: 'low' },
  { id: 'econ-0331-tokyocpi', title: '東京都区部CPI（3月分）', date: '2026-03-31', time: '08:30', importance: 'medium' },

  // ===== 4月 =====
  { id: 'econ-0401-tankan1', title: '日銀短観（3月概要・要旨）', date: '2026-04-01', time: '08:50', importance: 'medium' },
  { id: 'econ-0402-tankan2', title: '日銀短観（3月調査全容）', date: '2026-04-02', time: '08:50', importance: 'medium' },
  { id: 'econ-0403-nfp', title: '米雇用統計（3月分）', date: '2026-04-03', time: '21:30', importance: 'high' },
  { id: 'econ-0407-household', title: '家計調査（2月分）', date: '2026-04-07', time: '08:30', importance: 'low' },
  { id: 'econ-0409-pce', title: '米PCE（2月分）', date: '2026-04-09', time: '21:30', importance: 'medium' },
  { id: 'econ-0409-gdp3', title: '米GDP確報値（10-12月期・3次推計）', date: '2026-04-09', time: '21:30', importance: 'high' },
  { id: 'econ-0410-cpi', title: '米CPI（3月分）', date: '2026-04-10', time: '21:30', importance: 'high' },
  { id: 'econ-0424-jpcpi', title: '全国CPI（3月分）', date: '2026-04-24', time: '08:30', importance: 'medium' },
  { id: 'econ-0428-labor', title: '労働力調査（3月分）', date: '2026-04-28', time: '08:30', importance: 'low' },
  { id: 'econ-0428-boj', title: '日銀金融政策決定会合 結果公表', date: '2026-04-28', time: '12:00', importance: 'high' },
  { id: 'econ-0430-fomc', title: 'FOMC政策声明（4月会合）', date: '2026-04-30', time: '03:00', importance: 'high' },
  { id: 'econ-0430-gdp1q', title: '米GDP速報値（1-3月期・1次速報）', date: '2026-04-30', time: '21:30', importance: 'high' },
  { id: 'econ-0430-pce3', title: '米PCE（3月分）', date: '2026-04-30', time: '21:30', importance: 'medium' },

  // ===== 5月 =====
  { id: 'econ-0501-tokyocpi', title: '東京都区部CPI（4月分）', date: '2026-05-01', time: '08:30', importance: 'medium' },
  { id: 'econ-0508-nfp', title: '米雇用統計（4月分）', date: '2026-05-08', time: '21:30', importance: 'high' },
  { id: 'econ-0512-household', title: '家計調査（3月分・1-3月期平均）', date: '2026-05-12', time: '08:30', importance: 'low' },
  { id: 'econ-0512-cpi', title: '米CPI（4月分）', date: '2026-05-12', time: '21:30', importance: 'high' },
  { id: 'econ-0519-jpgdp', title: '日本GDP速報（1-3月期・1次速報）', date: '2026-05-19', time: '08:50', importance: 'high' },
  { id: 'econ-0522-jpcpi', title: '全国CPI（4月分）', date: '2026-05-22', time: '08:30', importance: 'medium' },
  { id: 'econ-0528-gdp2q2', title: '米GDP改定値（1-3月期・2次推計）', date: '2026-05-28', time: '21:30', importance: 'high' },
  { id: 'econ-0529-labor', title: '労働力調査（4月分）', date: '2026-05-29', time: '08:30', importance: 'low' },
  { id: 'econ-0529-tokyocpi', title: '東京都区部CPI（5月分）', date: '2026-05-29', time: '08:30', importance: 'medium' },

  // ===== 6月 =====
  { id: 'econ-0605-nfp', title: '米雇用統計（5月分）', date: '2026-06-05', time: '21:30', importance: 'high' },
  { id: 'econ-0605-household', title: '家計調査（4月分）', date: '2026-06-05', time: '08:30', importance: 'low' },
  { id: 'econ-0608-jpgdp2', title: '日本GDP速報（1-3月期・2次速報）', date: '2026-06-08', time: '08:50', importance: 'high' },
  { id: 'econ-0609-pce', title: '米PCE（4月分）', date: '2026-06-09', time: '21:30', importance: 'medium' },
  { id: 'econ-0610-cpi', title: '米CPI（5月分）', date: '2026-06-10', time: '21:30', importance: 'high' },
  { id: 'econ-0616-boj', title: '日銀金融政策決定会合 結果公表', date: '2026-06-16', time: '12:00', importance: 'high' },
  { id: 'econ-0619-jpcpi', title: '全国CPI（5月分）', date: '2026-06-19', time: '08:30', importance: 'medium' },
  { id: 'econ-0625-gdp3q3', title: '米GDP確報値（1-3月期・3次推計）', date: '2026-06-25', time: '21:30', importance: 'high' },
  { id: 'econ-0626-tokyocpi', title: '東京都区部CPI（6月分）', date: '2026-06-26', time: '08:30', importance: 'medium' },
  { id: 'econ-0630-labor', title: '労働力調査（5月分）', date: '2026-06-30', time: '08:30', importance: 'low' },

  // ===== 7月 =====
  { id: 'econ-0702-nfp', title: '米雇用統計（6月分）', date: '2026-07-02', time: '21:30', importance: 'high' },
  { id: 'econ-0707-household', title: '家計調査（5月分）', date: '2026-07-07', time: '08:30', importance: 'low' },
  { id: 'econ-0707-pce', title: '米PCE（5月分）', date: '2026-07-07', time: '21:30', importance: 'medium' },
  { id: 'econ-0714-cpi', title: '米CPI（6月分）', date: '2026-07-14', time: '21:30', importance: 'high' },
  { id: 'econ-0724-jpcpi', title: '全国CPI（6月分）', date: '2026-07-24', time: '08:30', importance: 'medium' },
  { id: 'econ-0730-fomc', title: 'FOMC政策声明（7月会合）', date: '2026-07-30', time: '03:00', importance: 'high' },
  { id: 'econ-0730-gdp2q', title: '米GDP速報値（4-6月期・1次速報）', date: '2026-07-30', time: '21:30', importance: 'high' },
  { id: 'econ-0731-labor', title: '労働力調査（6月分）', date: '2026-07-31', time: '08:30', importance: 'low' },
  { id: 'econ-0731-tokyocpi', title: '東京都区部CPI（7月分）', date: '2026-07-31', time: '08:30', importance: 'medium' },
  { id: 'econ-0731-boj', title: '日銀金融政策決定会合 結果公表（展望レポート）', date: '2026-07-31', time: '12:00', importance: 'high' },

  // ===== 8月 =====
  { id: 'econ-0807-household', title: '家計調査（6月分・4-6月期平均）', date: '2026-08-07', time: '08:30', importance: 'low' },
  { id: 'econ-0807-nfp', title: '米雇用統計（7月分）', date: '2026-08-07', time: '21:30', importance: 'high' },
  { id: 'econ-0812-cpi', title: '米CPI（7月分）', date: '2026-08-12', time: '21:30', importance: 'high' },
  { id: 'econ-0817-jpgdp', title: '日本GDP速報（4-6月期・1次速報）', date: '2026-08-17', time: '08:50', importance: 'high' },
  { id: 'econ-0821-jpcpi', title: '全国CPI（7月分）※2025年基準切替', date: '2026-08-21', time: '08:30', importance: 'medium' },
  { id: 'econ-0826-gdp2q2', title: '米GDP改定値（4-6月期・2次推計）', date: '2026-08-26', time: '21:30', importance: 'high' },
  { id: 'econ-0828-labor', title: '労働力調査（7月分）', date: '2026-08-28', time: '08:30', importance: 'low' },
  { id: 'econ-0828-tokyocpi', title: '東京都区部CPI（8月分）', date: '2026-08-28', time: '08:30', importance: 'medium' },

  // ===== 9月 =====
  { id: 'econ-0904-household', title: '家計調査（7月分）', date: '2026-09-04', time: '08:30', importance: 'low' },
  { id: 'econ-0904-nfp', title: '米雇用統計（8月分）', date: '2026-09-04', time: '21:30', importance: 'high' },
  { id: 'econ-0908-jpgdp2', title: '日本GDP速報（4-6月期・2次速報）', date: '2026-09-08', time: '08:50', importance: 'high' },
  { id: 'econ-0911-cpi', title: '米CPI（8月分）', date: '2026-09-11', time: '21:30', importance: 'high' },
  { id: 'econ-0917-fomc', title: 'FOMC政策声明（9月会合・SEPあり）', date: '2026-09-17', time: '03:00', importance: 'high' },
  { id: 'econ-0918-jpcpi', title: '全国CPI（8月分）', date: '2026-09-18', time: '08:30', importance: 'medium' },
  { id: 'econ-0918-boj', title: '日銀金融政策決定会合 結果公表', date: '2026-09-18', time: '12:00', importance: 'high' },

  // ===== 10月 =====
  { id: 'econ-1002-labor', title: '労働力調査（8月分）', date: '2026-10-02', time: '08:30', importance: 'low' },
  { id: 'econ-1002-tokyocpi', title: '東京都区部CPI（9月分）', date: '2026-10-02', time: '08:30', importance: 'medium' },
  { id: 'econ-1002-nfp', title: '米雇用統計（9月分）', date: '2026-10-02', time: '21:30', importance: 'high' },
  { id: 'econ-1009-household', title: '家計調査（8月分）', date: '2026-10-09', time: '08:30', importance: 'low' },
  { id: 'econ-1014-cpi', title: '米CPI（9月分）', date: '2026-10-14', time: '21:30', importance: 'high' },
  { id: 'econ-1023-jpcpi', title: '全国CPI（9月分）', date: '2026-10-23', time: '08:30', importance: 'medium' },
  { id: 'econ-1029-fomc', title: 'FOMC政策声明（10月会合）', date: '2026-10-29', time: '03:00', importance: 'high' },
  { id: 'econ-1029-gdp3q', title: '米GDP速報値（7-9月期・1次速報）', date: '2026-10-29', time: '21:30', importance: 'high' },
  { id: 'econ-1030-labor', title: '労働力調査（9月分）', date: '2026-10-30', time: '08:30', importance: 'low' },
  { id: 'econ-1030-tokyocpi', title: '東京都区部CPI（10月分）', date: '2026-10-30', time: '08:30', importance: 'medium' },
  { id: 'econ-1030-boj', title: '日銀金融政策決定会合 結果公表（展望レポート）', date: '2026-10-30', time: '12:00', importance: 'high' },

  // ===== 11月 =====
  { id: 'econ-1106-nfp', title: '米雇用統計（10月分）', date: '2026-11-06', time: '22:30', importance: 'high' },
  { id: 'econ-1110-household', title: '家計調査（9月分・7-9月期平均）', date: '2026-11-10', time: '08:30', importance: 'low' },
  { id: 'econ-1110-cpi', title: '米CPI（10月分）', date: '2026-11-10', time: '22:30', importance: 'high' },
  { id: 'econ-1116-jpgdp', title: '日本GDP速報（7-9月期・1次速報）', date: '2026-11-16', time: '08:50', importance: 'high' },
  { id: 'econ-1120-jpcpi', title: '全国CPI（10月分）', date: '2026-11-20', time: '08:30', importance: 'medium' },
  { id: 'econ-1125-gdp3q2', title: '米GDP改定値（7-9月期・2次推計）', date: '2026-11-25', time: '22:30', importance: 'high' },
  { id: 'econ-1127-tokyocpi', title: '東京都区部CPI（11月分）', date: '2026-11-27', time: '08:30', importance: 'medium' },

  // ===== 12月 =====
  { id: 'econ-1201-labor', title: '労働力調査（10月分）', date: '2026-12-01', time: '08:30', importance: 'low' },
  { id: 'econ-1204-nfp', title: '米雇用統計（11月分）', date: '2026-12-04', time: '22:30', importance: 'high' },
  { id: 'econ-1208-household', title: '家計調査（10月分）', date: '2026-12-08', time: '08:30', importance: 'low' },
  { id: 'econ-1208-jpgdp2', title: '日本GDP速報（7-9月期・2次速報）', date: '2026-12-08', time: '08:50', importance: 'high' },
  { id: 'econ-1210-fomc', title: 'FOMC政策声明（12月会合・SEPあり）', date: '2026-12-10', time: '04:00', importance: 'high' },
  { id: 'econ-1210-cpi', title: '米CPI（11月分）', date: '2026-12-10', time: '22:30', importance: 'high' },
  { id: 'econ-1218-jpcpi', title: '全国CPI（11月分）', date: '2026-12-18', time: '08:30', importance: 'medium' },
  { id: 'econ-1218-boj', title: '日銀金融政策決定会合 結果公表', date: '2026-12-18', time: '12:00', importance: 'high' },
  { id: 'econ-1223-gdp3q3', title: '米GDP確報値（7-9月期・3次推計）', date: '2026-12-23', time: '22:30', importance: 'high' },
  { id: 'econ-1223-pce', title: '米PCE（11月分）', date: '2026-12-23', time: '22:30', importance: 'medium' },
  { id: 'econ-1225-labor', title: '労働力調査（11月分）', date: '2026-12-25', time: '08:30', importance: 'low' },
  { id: 'econ-1225-tokyocpi', title: '東京都区部CPI（12月分）', date: '2026-12-25', time: '08:30', importance: 'medium' },
];
