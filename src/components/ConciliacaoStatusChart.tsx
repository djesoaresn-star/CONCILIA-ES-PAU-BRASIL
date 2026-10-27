import React from 'react';
import { CheckCircle2, TrendingDown, TrendingUp, PieChart } from 'lucide-react';
import { ReconciliationModeTotals } from '../utils/reconciliationEngine';
import { formatCurrency } from '../utils/parsers';

export type StatusChartSelection = 'ALL' | 'FALTAS' | 'SOBRAS' | 'CONCILIADOS';

interface ConciliacaoStatusChartProps {
  totals: ReconciliationModeTotals;
  mode: 'sem_ajuste' | 'com_ajuste';
  activeSelection: StatusChartSelection;
  onSelectCategory: (category: StatusChartSelection) => void;
}

export const ConciliacaoStatusChart: React.FC<ConciliacaoStatusChartProps> = ({
  totals,
  mode,
  activeSelection,
  onSelectCategory,
}) => {
  const validos = Math.max(0, totals.totalItensValidos);
  const countConciliados = totals.totalItensAcurados;
  const countFaltas = totals.totalItensComFalta;
  const countSobras = totals.totalItensComSobra;

  const pctConciliados = validos > 0 ? (countConciliados / validos) * 100 : 0;
  const pctFaltas = validos > 0 ? (countFaltas / validos) * 100 : 0;
  const pctSobras = validos > 0 ? (countSobras / validos) * 100 : 0;

  // SVG Donut ring geometry (r = 38 => circumference = 2 * pi * 38 = 238.761)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const lenConciliados = (pctConciliados / 100) * circumference;
  const lenSobras = (pctSobras / 100) * circumference;
  const lenFaltas = (pctFaltas / 100) * circumference;

  const offsetConciliados = 0;
  const offsetSobras = -lenConciliados;
  const offsetFaltas = -(lenConciliados + lenSobras);

  const formatPct = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const handleCardClick = (cat: 'FALTAS' | 'SOBRAS' | 'CONCILIADOS') => {
    if (activeSelection === cat) {
      onSelectCategory('ALL');
    } else {
      onSelectCategory(cat);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Distribuição Percentual de SKUs: Faltas, Sobras e {mode === 'com_ajuste' ? 'Equalizados' : 'Conciliados'}
            </h3>
            <p className="text-xs text-slate-500">
              Composição sobre <strong className="font-mono tabular-nums text-slate-700">{validos}</strong> SKUs válidos analisados
              {totals.totalItensSaldoNegativo > 0 && (
                <span>
                  {' '}
                  (+{totals.totalItensSaldoNegativo} SKU{totals.totalItensSaldoNegativo > 1 ? 's' : ''} com saldo fiscal negativo desconsiderado)
                </span>
              )}
              . Clique em qualquer indicador abaixo para filtrar a tabela.
            </p>
          </div>
        </div>

        {activeSelection !== 'ALL' && (
          <button
            type="button"
            onClick={() => onSelectCategory('ALL')}
            className="self-start sm:self-auto px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            Mostrar Todos ({totals.totalItens})
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5 items-center">
        {/* Donut Chart SVG */}
        <div className="flex items-center justify-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="12"
              />
              {validos > 0 && (
                <>
                  {/* Segment 1: Equalizados / Conciliados (Blue) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth="12"
                    strokeDasharray={`${lenConciliados} ${circumference}`}
                    strokeDashoffset={offsetConciliados}
                    className="transition-all duration-300"
                  />
                  {/* Segment 2: Sobras (Emerald) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#059669"
                    strokeWidth="12"
                    strokeDasharray={`${lenSobras} ${circumference}`}
                    strokeDashoffset={offsetSobras}
                    className="transition-all duration-300"
                  />
                  {/* Segment 3: Faltas (Rose) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#e11d48"
                    strokeWidth="12"
                    strokeDasharray={`${lenFaltas} ${circumference}`}
                    strokeDashoffset={offsetFaltas}
                    className="transition-all duration-300"
                  />
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Total
              </span>
              <span className="text-lg font-black font-mono tabular-nums text-slate-900 leading-none mt-0.5">
                {validos}
              </span>
              <span className="text-[10px] font-medium text-slate-500">SKUs</span>
            </div>
          </div>
        </div>

        {/* Right Side: Proportional Stacked Bar + 3 Clickable Metric Blocks */}
        <div className="space-y-3.5">
          {/* Proportional 100% Segmented Horizontal Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
              <span>Proporção Geral dos Itens (100%)</span>
              <span className="font-mono tabular-nums text-slate-500">
                {countFaltas + countSobras} divergentes ({formatPct(pctFaltas + pctSobras)}%) · {countConciliados} sem divergência ({formatPct(pctConciliados)}%)
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-100 rounded-lg overflow-hidden flex border border-slate-200">
              {pctFaltas > 0 && (
                <button
                  type="button"
                  onClick={() => handleCardClick('FALTAS')}
                  style={{ width: `${pctFaltas}%` }}
                  className="h-full bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer"
                  title={`Itens com Falta: ${formatPct(pctFaltas)}% (${countFaltas} SKUs)`}
                />
              )}
              {pctSobras > 0 && (
                <button
                  type="button"
                  onClick={() => handleCardClick('SOBRAS')}
                  style={{ width: `${pctSobras}%` }}
                  className="h-full bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer"
                  title={`Itens com Sobra: ${formatPct(pctSobras)}% (${countSobras} SKUs)`}
                />
              )}
              {pctConciliados > 0 && (
                <button
                  type="button"
                  onClick={() => handleCardClick('CONCILIADOS')}
                  style={{ width: `${pctConciliados}%` }}
                  className="h-full bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer"
                  title={`Itens Equalizados/Conciliados: ${formatPct(pctConciliados)}% (${countConciliados} SKUs)`}
                />
              )}
            </div>
          </div>

          {/* 3 Interactive Percentage Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Com Falta */}
            <button
              type="button"
              onClick={() => handleCardClick('FALTAS')}
              className={`text-left rounded-xl p-3 border transition cursor-pointer ${
                activeSelection === 'FALTAS'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20'
                  : 'bg-slate-50/70 hover:bg-rose-50/40 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" />
                  Com Falta
                </span>
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-black font-mono tabular-nums text-rose-700">
                  {formatPct(pctFaltas)}%
                </span>
                <span className="text-xs font-bold font-mono tabular-nums text-slate-700">
                  {countFaltas} <span className="font-normal text-slate-500">SKUs</span>
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
                <span>-{totals.totalFaltasSkus.toLocaleString('pt-BR')} cx</span>
                <span className="text-rose-700 font-semibold">-{formatCurrency(totals.totalFaltasValor)}</span>
              </div>
            </button>

            {/* 2. Com Sobras */}
            <button
              type="button"
              onClick={() => handleCardClick('SOBRAS')}
              className={`text-left rounded-xl p-3 border transition cursor-pointer ${
                activeSelection === 'SOBRAS'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/70 hover:bg-emerald-50/40 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                  Com Sobras
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-black font-mono tabular-nums text-emerald-700">
                  {formatPct(pctSobras)}%
                </span>
                <span className="text-xs font-bold font-mono tabular-nums text-slate-700">
                  {countSobras} <span className="font-normal text-slate-500">SKUs</span>
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
                <span>+{totals.totalSobrasSkus.toLocaleString('pt-BR')} cx</span>
                <span className="text-emerald-700 font-semibold">+{formatCurrency(totals.totalSobrasValor)}</span>
              </div>
            </button>

            {/* 3. Equalizados / Conciliados */}
            <button
              type="button"
              onClick={() => handleCardClick('CONCILIADOS')}
              className={`text-left rounded-xl p-3 border transition cursor-pointer ${
                activeSelection === 'CONCILIADOS'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
                  : 'bg-slate-50/70 hover:bg-blue-50/40 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
                  {mode === 'com_ajuste' ? 'Equalizados (0 Dif)' : 'Conciliados (0 Dif)'}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-black font-mono tabular-nums text-blue-700">
                  {formatPct(pctConciliados)}%
                </span>
                <span className="text-xs font-bold font-mono tabular-nums text-slate-700">
                  {countConciliados} <span className="font-normal text-slate-500">SKUs</span>
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
                <span>0 cx divergentes</span>
                <span className="text-blue-700 font-semibold">100% Acurado</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
