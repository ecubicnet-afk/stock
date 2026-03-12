'use client';
import type { PositionSizing } from '../../types';

interface PositionCalculatorProps {
  sizing: PositionSizing;
  onChange: (updates: Partial<PositionSizing>) => void;
}

export function PositionCalculator({ sizing, onChange }: PositionCalculatorProps) {
  const { capital, riskPercent, entryPrice, stopLossPrice } = sizing;

  const riskAmount = capital * (riskPercent / 100);
  const priceDiff = Math.abs(entryPrice - stopLossPrice);
  const miniLossPerContract = priceDiff * 100; // 日経225ミニ: 100倍
  const miniContracts = miniLossPerContract > 0 ? Math.floor(riskAmount / miniLossPerContract) : 0;

  // 日経レバETF (1570/1458等): 概算。日経平均の約2倍連動、1株あたり損失≒priceDiff*2/日経平均*ETF価格
  // 簡易計算: ETF価格を仮に25000円、日経平均38000円とすると倍率≒25000/38000*2≒1.32
  // ここでは直接priceDiffベースで簡略化
  const leveragedEtfPrice = 25000; // 概算参考値
  const leveragedEtfLossPerShare = priceDiff * 2 * (leveragedEtfPrice / (entryPrice || 1));
  const leveragedEtfShares = leveragedEtfLossPerShare > 0 ? Math.floor(riskAmount / leveragedEtfLossPerShare) : 0;

  const isLong = entryPrice > stopLossPrice;
  const riskRatio = capital > 0 ? ((riskAmount / capital) * 100) : 0;

  // Speedometer color
  const speedColor = riskRatio <= 1 ? 'text-emerald-400' : riskRatio <= 2 ? 'text-accent-cyan' : riskRatio <= 3 ? 'text-amber-400' : 'text-red-400';
  const speedLabel = riskRatio <= 1 ? '安全' : riskRatio <= 2 ? '適正' : riskRatio <= 3 ? '注意' : '危険！';

  return (
    <div className="bg-card border border-primary/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-primary">ポジションサイズ計算機</h3>
        <div className={`text-xs font-bold ${speedColor}`}>
          {speedLabel} ({riskRatio.toFixed(1)}%)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] text-muted block mb-1">総資産 (円)</label>
          <input
            type="number"
            value={capital}
            onChange={(e) => onChange({ capital: Number(e.target.value) })}
            className="w-full px-2 py-1.5 bg-primary/5 border border-primary/10 rounded text-sm text-primary focus:outline-none focus:border-accent-cyan"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted block mb-1">リスク許容 (%)</label>
          <input
            type="number"
            value={riskPercent}
            onChange={(e) => onChange({ riskPercent: Math.min(10, Math.max(0.1, Number(e.target.value))) })}
            step="0.5"
            min="0.1"
            max="10"
            className="w-full px-2 py-1.5 bg-primary/5 border border-primary/10 rounded text-sm text-primary focus:outline-none focus:border-accent-cyan"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted block mb-1">エントリー価格</label>
          <input
            type="number"
            value={entryPrice}
            onChange={(e) => onChange({ entryPrice: Number(e.target.value) })}
            className="w-full px-2 py-1.5 bg-primary/5 border border-primary/10 rounded text-sm text-primary focus:outline-none focus:border-accent-cyan"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted block mb-1">ストップロス価格</label>
          <input
            type="number"
            value={stopLossPrice}
            onChange={(e) => onChange({ stopLossPrice: Number(e.target.value) })}
            className="w-full px-2 py-1.5 bg-primary/5 border border-primary/10 rounded text-sm text-primary focus:outline-none focus:border-accent-cyan"
          />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2 border-t border-primary/10 pt-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted">方向</span>
          <span className={isLong ? 'text-emerald-400' : 'text-red-400'}>
            {isLong ? '↑ ロング' : '↓ ショート'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted">許容損失額</span>
          <span className="text-primary font-medium">{riskAmount.toLocaleString()} 円</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted">値幅リスク</span>
          <span className="text-primary">{priceDiff.toLocaleString()} 円幅</span>
        </div>

        <div className="bg-primary/5 rounded-lg p-2 mt-2 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-accent-cyan font-medium">日経225ミニ</span>
            <span className="text-primary font-bold">{miniContracts} 枚</span>
          </div>
          <div className="text-[10px] text-muted">
            1枚あたり損失: {miniLossPerContract.toLocaleString()}円 (×100倍)
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg p-2 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-accent-gold font-medium">日経レバETF (概算)</span>
            <span className="text-primary font-bold">{leveragedEtfShares} 株</span>
          </div>
          <div className="text-[10px] text-muted">
            参考ETF価格: {leveragedEtfPrice.toLocaleString()}円 (2倍レバ)
          </div>
        </div>
      </div>
    </div>
  );
}
