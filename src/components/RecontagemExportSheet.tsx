import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { DashboardRankingItem } from './RecontagemRankingsModal';
import { TopSyncedScrollContainer } from './TopSyncedScrollContainer';

export type SheetDisplaySection =
  | 'both'
  | 'faltas_only'
  | 'sobras_only'
  | 'conciliados_only'
  | 'all_three';

interface RecontagemExportSheetProps {
  exportFaltas: DashboardRankingItem[];
  exportSobras: DashboardRankingItem[];
  exportConciliados?: DashboardRankingItem[];
  displaySection?: SheetDisplaySection;
  isFilteredView?: boolean;
  totalDisplayFaltas: number;
  totalDisplaySobras: number;
  saldoFinalDisplay: number;
  totalGeralPrejuizoFaltas: number;
  totalGeralValorSobras: number;
  totalGeralSkusFaltas?: number;
  totalGeralSkusSobras?: number;
  saldoFinalGeral?: number;
  saldoFinalSkusGeral?: number;
  currentDepositoName: string;
  currentMode: 'sem_ajuste' | 'com_ajuste';
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  isExportTarget?: boolean;
  /** Se true, exibe colunas detalhadas (FISCAL, FÍSICO, QTDE, FINAL) como na Conciliação.
   *  Se false (padrão), exibe formato consolidado (# | COD | DESCRIÇÃO | QTDE | VALOR R$ | PESO) como no Dashboard & BI */
  showFiscalFisico?: boolean;
  /** Callback para alteração direta da quantidade física ao clicar na célula FÍSICO */
  onUpdateFisico?: (itemId: string, newFisicoRaw: string) => void;
  /** Callback para editar, trocar ou excluir o item */
  onEditItem?: (item: DashboardRankingItem) => void;
}

export const getPesoStyle = (pct: number, isSobra = false) => {
  if (pct >= 10) return 'bg-[#f87171] text-black font-bold';
  if (pct >= 7) return 'bg-[#fb923c] text-black font-semibold';
  if (pct >= 5) return 'bg-[#fdba74] text-black font-medium';
  if (pct >= 4) return 'bg-[#fed7aa] text-black';
  if (pct >= 3) return 'bg-[#ffedd5] text-black';
  if (pct >= 2) return 'bg-[#fef08a] text-black';
  if (pct >= 1) return 'bg-[#fef9c3] text-black';
  if (isSobra && pct === 0) return 'bg-[#86efac] text-black';
  return 'bg-[#dcfce7] text-black';
};

/**
 * Retorna a quantidade de divergência em SKU Fechado (caixas/fardos inteiros).
 * Garante a integridade operacional com e sem ajustes ao alternar o filtro.
 */
export const getDivergenciaSkuFechado = (
  item: DashboardRankingItem,
  isSobra: boolean = false
): number => {
  if (typeof item.diferencaSkus === 'number') {
    return item.diferencaSkus;
  }
  if (item.diferencaRaw && item.diferencaRaw.includes('/')) {
    const rawSkus = item.diferencaRaw.split('/')[0].replace(/[^0-9]/g, '');
    const parsed = parseInt(rawSkus, 10);
    if (!isNaN(parsed)) return parsed;
  }
  const units = isSobra ? Math.max(0, item.diferencaUnits || 0) : Math.abs(item.diferencaUnits || 0);
  const factor = Math.max(1, item.fatorSku || 1);
  return Math.floor(units / factor);
};

export const RecontagemExportSheet: React.FC<RecontagemExportSheetProps> = ({
  exportFaltas,
  exportSobras,
  exportConciliados = [],
  displaySection = 'both',
  isFilteredView = false,
  totalDisplayFaltas,
  totalDisplaySobras,
  saldoFinalDisplay,
  totalGeralPrejuizoFaltas,
  totalGeralValorSobras,
  totalGeralSkusFaltas,
  totalGeralSkusSobras,
  saldoFinalGeral,
  saldoFinalSkusGeral,
  currentDepositoName,
  currentMode,
  selectedIds,
  onToggleSelect,
  isExportTarget = false,
  showFiscalFisico = false,
  onUpdateFisico,
  onEditItem,
}) => {
  const [editingFisicoId, setEditingFisicoId] = useState<string | null>(null);
  const [editingFisicoValue, setEditingFisicoValue] = useState<string>('');

  const handleSaveFisico = (itemId: string) => {
    if (onUpdateFisico && editingFisicoValue.trim() !== '') {
      onUpdateFisico(itemId, editingFisicoValue.trim());
    }
    setEditingFisicoId(null);
  };

  // Na exportação estática de ficha (isExportTarget), mantém layout lado a lado tradicional
  const effectiveSection: SheetDisplaySection = isExportTarget ? 'both' : displaySection;

  const showFaltasTable =
    effectiveSection === 'both' ||
    effectiveSection === 'faltas_only' ||
    effectiveSection === 'all_three';
  const showSobrasTable =
    effectiveSection === 'both' ||
    effectiveSection === 'sobras_only' ||
    effectiveSection === 'all_three';
  const showConciliadosTable =
    effectiveSection === 'conciliados_only' ||
    (effectiveSection === 'all_three' && exportConciliados.length > 0);

  const isSideBySideDivergence = showFaltasTable && showSobrasTable;

  // Simetria de linhas apenas quando ambas as tabelas (Faltas & Sobras) estão lado a lado
  const faltaRowCount = isSideBySideDivergence
    ? Math.max(exportFaltas.length, exportSobras.length, 1)
    : exportFaltas.length;
  const sobraRowCount = isSideBySideDivergence
    ? Math.max(exportFaltas.length, exportSobras.length, 1)
    : exportSobras.length;

  // Saldo Oficial Geral do Inventário (Equalizado centavo a centavo com o Dashboard)
  const finalSaldoGeral =
    typeof saldoFinalGeral === 'number'
      ? saldoFinalGeral
      : totalGeralValorSobras - totalGeralPrejuizoFaltas;

  const filteredSkusFaltas = exportFaltas.reduce(
    (acc, item) => acc + getDivergenciaSkuFechado(item, false),
    0
  );
  const filteredSkusSobras = exportSobras.reduce(
    (acc, item) => acc + getDivergenciaSkuFechado(item, true),
    0
  );

  const renderFisicoCell = (item: DashboardRankingItem) => {
    const isEditingThisFisico = editingFisicoId === item.id;
    return (
      <td
        className={`border border-slate-300 p-1 text-center font-mono tabular-nums text-[11px] ${
          isEditingThisFisico ? 'bg-amber-50' : ''
        }`}
      >
        {isEditingThisFisico ? (
          <div
            className="flex items-center justify-center space-x-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={editingFisicoValue}
              onChange={(e) => setEditingFisicoValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveFisico(item.id);
                else if (e.key === 'Escape') setEditingFisicoId(null);
              }}
              placeholder="ex: 16 ou 16/00"
              className="w-20 bg-white text-center px-1 py-0.5 rounded border border-emerald-500 font-mono text-[11px] font-bold text-slate-900 shadow-2xs focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => handleSaveFisico(item.id)}
              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-2xs"
              title="Confirmar novo estoque físico"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setEditingFisicoId(null)}
              className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 transition cursor-pointer shadow-2xs"
              title="Cancelar edição"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : onUpdateFisico ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setEditingFisicoId(item.id);
              setEditingFisicoValue(
                item.fisicoRaw ? item.fisicoRaw.replace(/^[+-]/, '').trim() : ''
              );
            }}
            className="group flex items-center justify-center space-x-1 px-1 py-0.5 rounded border border-dashed border-transparent hover:border-amber-400 hover:bg-amber-100/80 cursor-pointer transition"
            title="Clique para alterar a quantidade física deste produto"
          >
            <span className="font-mono tabular-nums text-slate-900 text-[11px] font-medium group-hover:font-bold">
              {item.fisicoRaw || '0/00'}
            </span>
            <Pencil className="w-2.5 h-2.5 text-slate-400 group-hover:text-amber-800 opacity-50 group-hover:opacity-100 transition" />
          </div>
        ) : (
          <span
            className="font-mono tabular-nums text-slate-800 text-[11px]"
            title={`Inventário Físico: ${item.fisicoRaw || '0/00'}`}
          >
            {item.fisicoRaw || '0/00'}
          </span>
        )}
      </td>
    );
  };

  const renderConciliadosTable = () => {
    const colSpanCount = currentMode === 'com_ajuste' ? 10 : 8;
    return (
      <div className="flex flex-col">
        <div className="bg-[#1d4ed8] text-white font-black text-sm uppercase py-2 px-3 text-center tracking-wider border border-slate-400 shadow-2xs flex items-center justify-center gap-2">
          <span>
            {currentMode === 'com_ajuste'
              ? `ITENS 100% EQUALIZADOS / SEM DIVERGÊNCIA (${exportConciliados.length})`
              : `ITENS 100% CONCILIADOS / SEM DIVERGÊNCIA (${exportConciliados.length})`}
          </span>
        </div>
        <table className="w-full text-xs border-collapse border border-slate-400 mt-1 shadow-2xs">
          <thead>
            <tr className="bg-[#2f3640] text-white text-[11px] font-bold uppercase tracking-wider">
              <th className="border border-slate-400 p-1.5 text-center w-9">#</th>
              <th className="border border-slate-400 p-1.5 text-center w-16">COD</th>
              <th className="border border-slate-400 p-1.5 text-left pl-2.5">DESCRIÇÃO</th>
              <th className="border border-slate-400 p-1.5 text-center w-14" title="Unidades por Caixa/Fardo">
                FATOR
              </th>
              <th className="border border-slate-400 p-1.5 text-center w-20" title="Saldo Fiscal 02.05.02">
                FISCAL
              </th>
              <th
                className="border border-slate-400 p-1.5 text-center w-22"
                title="Inventário Físico Contado (Clique para editar)"
              >
                FÍSICO {onUpdateFisico && <span className="text-[9px] text-amber-300">✎</span>}
              </th>
              {currentMode === 'com_ajuste' && (
                <>
                  <th
                    className="border border-slate-400 p-1.5 text-center w-18"
                    title="Desvios Operacionais Somados (Quebras + Vales + Trocas + Faltas)"
                  >
                    DESVIOS
                  </th>
                  <th
                    className="border border-slate-400 p-1.5 text-center w-20"
                    title="Saldo Final (Físico + Desvios)"
                  >
                    FINAL
                  </th>
                </>
              )}
              <th className="border border-slate-400 p-1.5 text-center w-16">DIF (CX)</th>
              <th className="border border-slate-400 p-1.5 text-center w-28">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {exportConciliados.length === 0 ? (
              <tr className="bg-white">
                <td
                  colSpan={colSpanCount}
                  className="border border-slate-300 py-8 text-center text-slate-500 text-xs"
                >
                  Nenhum item conciliado encontrado para o filtro selecionado.
                </td>
              </tr>
            ) : (
              exportConciliados.map((item, idx) => {
                const isSelected = selectedIds?.has(item.id);
                const isEditingThisFisico = editingFisicoId === item.id;
                const hasAmortization = currentMode === 'com_ajuste' && (item.totalDesviosUnits || 0) > 0;

                return (
                  <tr
                    key={`conciliado-row-${item.id}`}
                    onClick={() => {
                      if (!isEditingThisFisico && onToggleSelect) {
                        onToggleSelect(item.id);
                      }
                    }}
                    className={`transition ${
                      isSelected
                        ? 'bg-blue-100/70 font-semibold'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-blue-50/40'
                        : 'bg-[#f9fafb] hover:bg-blue-50/40'
                    } ${onToggleSelect && !isEditingThisFisico ? 'cursor-pointer' : ''}`}
                  >
                    <td className="border border-slate-300 p-1.5 text-center text-slate-700 text-[11px] font-mono tabular-nums">
                      {idx + 1}
                    </td>
                    <td
                      className="border border-slate-300 p-1.5 text-center font-mono tabular-nums font-bold text-slate-900 text-[11px] cursor-pointer hover:bg-blue-100 transition group"
                      title="Clique para Editar, Trocar por outro SKU ou Excluir este item"
                      onClick={(e) => {
                        if (onEditItem) {
                          e.stopPropagation();
                          onEditItem(item);
                        }
                      }}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {item.produto}
                        {onEditItem && (
                          <span className="text-[10px] text-blue-700 opacity-60 group-hover:opacity-100">
                            ✏️
                          </span>
                        )}
                      </span>
                    </td>
                    <td
                      className="border border-slate-300 p-1.5 pl-2.5 font-medium text-slate-900 text-[11px] truncate max-w-[360px]"
                      title={item.descricao}
                    >
                      {item.descricao}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono tabular-nums text-slate-600 text-[11px]">
                      {item.fatorSku}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono tabular-nums text-slate-800 text-[11px]">
                      {item.fiscalRaw || '0/00'}
                    </td>
                    {renderFisicoCell(item)}
                    {currentMode === 'com_ajuste' && (
                      <>
                        <td className="border border-slate-300 p-1.5 text-center font-mono tabular-nums text-[11px] text-amber-700 font-semibold">
                          {(item.totalDesviosUnits || 0) > 0 ? `+${item.desviosRaw}` : '0/00'}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono tabular-nums text-[11px] text-teal-800 font-bold">
                          {item.finalRaw || item.fisicoRaw || '0/00'}
                        </td>
                      </>
                    )}
                    <td className="border border-slate-300 p-1.5 text-center font-mono tabular-nums font-bold text-emerald-700 text-[11px]">
                      0 cx
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center text-[10px] font-bold">
                      <span
                        className={`px-2 py-0.5 rounded border inline-block ${
                          hasAmortization
                            ? 'bg-teal-50 text-teal-800 border-teal-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {hasAmortization ? '✓ EQUALIZADO' : '✓ CONCILIADO'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const gridLayoutClass = isExportTarget
    ? 'grid-cols-[1fr_1fr_370px]'
    : isSideBySideDivergence
    ? showFiscalFisico
      ? 'grid-cols-1 2xl:grid-cols-[1fr_1fr_360px]'
      : 'grid-cols-1 xl:grid-cols-[1fr_1fr_360px]'
    : 'grid-cols-1 xl:grid-cols-[1fr_360px]';

  const minWidthClass = isExportTarget || isSideBySideDivergence
    ? showFiscalFisico
      ? 'min-w-[1320px]'
      : 'min-w-[1100px]'
    : 'min-w-[820px]';

  const sheetBody = (
    <div className={`w-full ${minWidthClass}`}>
      <div className={`grid ${gridLayoutClass} gap-4 items-start w-full`}>
        {/* ================================================================= */}
        {/* COLUNA 1: TABELA RANKING DE FALTAS                                */}
        {/* ================================================================= */}
        {showFaltasTable && (
          <div className="flex flex-col">
            <div className="bg-[#ffc000] text-black font-black text-sm uppercase py-2 px-3 text-center tracking-wider border border-slate-400 shadow-2xs">
              RANKING DE FALTAS {!isExportTarget && `(${exportFaltas.length})`}
            </div>
            <table className="w-full text-xs border-collapse border border-slate-400 mt-1 shadow-2xs">
              <thead>
                <tr className="bg-[#2f3640] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="border border-slate-400 p-1.5 text-center w-8">#</th>
                  <th className="border border-slate-400 p-1.5 text-center w-14">COD</th>
                  <th className="border border-slate-400 p-1.5 text-left pl-2">DESCRIÇÃO</th>
                  {showFiscalFisico && (
                    <>
                      <th
                        className="border border-slate-400 p-1.5 text-center w-14"
                        title="Saldo Fiscal (WMS/Promax)"
                      >
                        FISCAL
                      </th>
                      <th
                        className="border border-slate-400 p-1.5 text-center w-20"
                        title="Inventário Físico Contado (Clique no valor para editar)"
                      >
                        FÍSICO {onUpdateFisico && <span className="text-[9px] text-amber-300">✎</span>}
                      </th>
                    </>
                  )}
                  <th
                    className="border border-slate-400 p-1.5 text-center w-14"
                    title="Quantidade de divergência (caixas/fardos inteiros)"
                  >
                    QTDE
                  </th>
                  {showFiscalFisico && (
                    <th
                      className="border border-slate-400 p-1.5 text-center w-14"
                      title="Saldo Final Apurado"
                    >
                      FINAL
                    </th>
                  )}
                  <th className="border border-slate-400 p-1.5 text-right pr-2.5 w-26">VALOR R$</th>
                  <th className="border border-slate-400 p-1.5 text-center w-12">PESO</th>
                </tr>
              </thead>
              <tbody>
                {!isSideBySideDivergence && exportFaltas.length === 0 ? (
                  <tr className="bg-white">
                    <td
                      colSpan={showFiscalFisico ? 9 : 6}
                      className="border border-slate-300 py-8 text-center text-slate-500 text-xs"
                    >
                      Nenhum item com falta encontrado para o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: faltaRowCount }).map((_, idx) => {
                    const item = exportFaltas[idx];
                    if (!item) {
                      return (
                        <tr
                          key={`empty-falta-${idx}`}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'}
                        >
                          <td className="border border-slate-300 p-1 text-center text-slate-400 text-[11px] font-mono tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 p-1"></td>
                          <td className="border border-slate-300 p-1"></td>
                          {showFiscalFisico && (
                            <>
                              <td className="border border-slate-300 p-1"></td>
                              <td className="border border-slate-300 p-1"></td>
                            </>
                          )}
                          <td className="border border-slate-300 p-1"></td>
                          {showFiscalFisico && <td className="border border-slate-300 p-1"></td>}
                          <td className="border border-slate-300 p-1"></td>
                          <td className="border border-slate-300 p-1"></td>
                        </tr>
                      );
                    }

                    const pct =
                      totalGeralPrejuizoFaltas > 0
                        ? Math.round((item.prejuizoFinanceiro / totalGeralPrejuizoFaltas) * 100)
                        : 0;
                    const pesoClass = getPesoStyle(pct, false);
                    const isSelected = selectedIds?.has(item.id);
                    const isEditingThisFisico = editingFisicoId === item.id;

                    return (
                      <tr
                        key={`falta-row-${item.id}`}
                        onClick={() => {
                          if (!isEditingThisFisico && onToggleSelect) {
                            onToggleSelect(item.id);
                          }
                        }}
                        className={`transition ${
                          isSelected
                            ? 'bg-amber-100/70 font-semibold'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-[#f9fafb] hover:bg-slate-50'
                        } ${onToggleSelect && !isEditingThisFisico ? 'cursor-pointer' : ''}`}
                        title={
                          onToggleSelect && !isEditingThisFisico
                            ? 'Clique para marcar/desmarcar item para recontagem'
                            : undefined
                        }
                      >
                        <td className="border border-slate-300 p-1.5 text-center text-slate-700 text-[11px] font-mono tabular-nums">
                          {idx + 1}
                        </td>
                        <td
                          className="border border-slate-300 p-1.5 text-center font-mono tabular-nums font-bold text-slate-900 text-[11px] cursor-pointer hover:bg-amber-100 transition relative group"
                          title="Clique para Editar, Trocar por outro SKU ou Excluir este item"
                          onClick={(e) => {
                            if (onEditItem) {
                              e.stopPropagation();
                              onEditItem(item);
                            }
                          }}
                        >
                          <span className="flex items-center justify-center gap-1">
                            {item.produto}
                            {onEditItem && (
                              <span className="text-[10px] text-amber-700 opacity-60 group-hover:opacity-100">
                                ✏️
                              </span>
                            )}
                          </span>
                        </td>
                        <td
                          className={`border border-slate-300 p-1.5 pl-2 font-medium text-slate-900 text-[11px] truncate ${
                            !isSideBySideDivergence
                              ? 'max-w-[380px]'
                              : showFiscalFisico
                              ? 'max-w-[200px]'
                              : 'max-w-[260px]'
                          }`}
                          title={item.descricao}
                        >
                          {item.descricao}
                        </td>

                        {showFiscalFisico && (
                          <>
                            <td
                              className="border border-slate-300 p-1.5 text-center font-mono tabular-nums text-slate-800 text-[11px]"
                              title={`Saldo Fiscal: ${item.fiscalRaw || '0/00'}`}
                            >
                              {item.fiscalRaw || '0/00'}
                            </td>
                            {renderFisicoCell(item)}
                          </>
                        )}

                        <td
                          className="border border-slate-300 p-1.5 text-center font-bold text-slate-900 text-[11px]"
                          title={`SKU Fechado: ${getDivergenciaSkuFechado(
                            item,
                            false
                          )} cx | Divergência Bruta: ${item.diferencaRaw || '0/00'}`}
                        >
                          <div className="font-bold font-mono tabular-nums text-slate-900 leading-tight">
                            {getDivergenciaSkuFechado(item, false).toLocaleString('pt-BR')}
                          </div>
                        </td>

                        {showFiscalFisico && (
                          <td
                            className="border border-slate-300 p-1.5 text-center font-mono tabular-nums text-slate-800 text-[11px]"
                            title={`Saldo Final: ${item.finalRaw || item.fisicoRaw || '0/00'}`}
                          >
                            {item.finalRaw || item.fisicoRaw || '0/00'}
                          </td>
                        )}

                        <td className="border border-slate-300 p-1.5 pr-2.5 text-right font-mono tabular-nums text-[11px] text-slate-900">
                          <div className="flex justify-between items-center w-full px-1">
                            <span className="text-slate-500 font-sans text-[10px]">R$</span>
                            <span>
                              {(Number.isFinite(item.prejuizoFinanceiro)
                                ? item.prejuizoFinanceiro
                                : 0
                              ).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`border border-slate-300 p-1.5 text-center font-mono tabular-nums text-[11px] ${pesoClass}`}
                        >
                          {pct}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================================================================= */}
        {/* COLUNA 2: TABELA RANKING DE SOBRAS                                */}
        {/* ================================================================= */}
        {showSobrasTable && (
          <div className="flex flex-col">
            <div className="bg-[#ffc000] text-black font-black text-sm uppercase py-2 px-3 text-center tracking-wider border border-slate-400 shadow-2xs">
              RANKING DE SOBRAS {!isExportTarget && `(${exportSobras.length})`}
            </div>
            <table className="w-full text-xs border-collapse border border-slate-400 mt-1 shadow-2xs">
              <thead>
                <tr className="bg-[#2f3640] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="border border-slate-400 p-1.5 text-center w-8">#</th>
                  <th className="border border-slate-400 p-1.5 text-center w-14">COD</th>
                  <th className="border border-slate-400 p-1.5 text-left pl-2">DESCRIÇÃO</th>
                  {showFiscalFisico && (
                    <>
                      <th
                        className="border border-slate-400 p-1.5 text-center w-14"
                        title="Saldo Fiscal (WMS/Promax)"
                      >
                        FISCAL
                      </th>
                      <th
                        className="border border-slate-400 p-1.5 text-center w-20"
                        title="Inventário Físico Contado (Clique no valor para editar)"
                      >
                        FÍSICO {onUpdateFisico && <span className="text-[9px] text-amber-300">✎</span>}
                      </th>
                    </>
                  )}
                  <th
                    className="border border-slate-400 p-1.5 text-center w-14"
                    title="Quantidade de divergência (caixas/fardos inteiros)"
                  >
                    QTDE
                  </th>
                  {showFiscalFisico && (
                    <th
                      className="border border-slate-400 p-1.5 text-center w-14"
                      title="Saldo Final Apurado"
                    >
                      FINAL
                    </th>
                  )}
                  <th className="border border-slate-400 p-1.5 text-right pr-2.5 w-26">VALOR R$</th>
                  <th className="border border-slate-400 p-1.5 text-center w-12">PESO</th>
                </tr>
              </thead>
              <tbody>
                {!isSideBySideDivergence && exportSobras.length === 0 ? (
                  <tr className="bg-white">
                    <td
                      colSpan={showFiscalFisico ? 9 : 6}
                      className="border border-slate-300 py-8 text-center text-slate-500 text-xs"
                    >
                      Nenhum item com sobra encontrado para o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: sobraRowCount }).map((_, idx) => {
                    const item = exportSobras[idx];
                    if (!item) {
                      return (
                        <tr
                          key={`empty-sobra-${idx}`}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'}
                        >
                          <td className="border border-slate-300 p-1 text-center text-slate-400 text-[11px] font-mono tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 p-1"></td>
                          <td className="border border-slate-300 p-1"></td>
                          {showFiscalFisico && (
                            <>
                              <td className="border border-slate-300 p-1"></td>
                              <td className="border border-slate-300 p-1"></td>
                            </>
                          )}
                          <td className="border border-slate-300 p-1"></td>
                          {showFiscalFisico && <td className="border border-slate-300 p-1"></td>}
                          <td className="border border-slate-300 p-1"></td>
                          <td className="border border-slate-300 p-1"></td>
                        </tr>
                      );
                    }

                    const pct =
                      totalGeralValorSobras > 0
                        ? Math.round((item.sobraFinanceira / totalGeralValorSobras) * 100)
                        : 0;
                    const pesoClass = getPesoStyle(pct, true);
                    const isSelected = selectedIds?.has(item.id);
                    const isEditingThisFisico = editingFisicoId === item.id;

                    return (
                      <tr
                        key={`sobra-row-${item.id}`}
                        onClick={() => {
                          if (!isEditingThisFisico && onToggleSelect) {
                            onToggleSelect(item.id);
                          }
                        }}
                        className={`transition ${
                          isSelected
                            ? 'bg-amber-100/70 font-semibold'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-[#f9fafb] hover:bg-slate-50'
                        } ${onToggleSelect && !isEditingThisFisico ? 'cursor-pointer' : ''}`}
                        title={
                          onToggleSelect && !isEditingThisFisico
                            ? 'Clique para marcar/desmarcar item para recontagem'
                            : undefined
                        }
                      >
                        <td className="border border-slate-300 p-1.5 text-center text-slate-700 text-[11px] font-mono tabular-nums">
                          {idx + 1}
                        </td>
                        <td
                          className="border border-slate-300 p-1.5 text-center font-mono tabular-nums font-bold text-slate-900 text-[11px] cursor-pointer hover:bg-emerald-100 transition relative group"
                          title="Clique para Editar, Trocar por outro SKU ou Excluir este item"
                          onClick={(e) => {
                            if (onEditItem) {
                              e.stopPropagation();
                              onEditItem(item);
                            }
                          }}
                        >
                          <span className="flex items-center justify-center gap-1">
                            {item.produto}
                            {onEditItem && (
                              <span className="text-[10px] text-emerald-700 opacity-60 group-hover:opacity-100">
                                ✏️
                              </span>
                            )}
                          </span>
                        </td>
                        <td
                          className={`border border-slate-300 p-1.5 pl-2 font-medium text-slate-900 text-[11px] truncate ${
                            !isSideBySideDivergence
                              ? 'max-w-[380px]'
                              : showFiscalFisico
                              ? 'max-w-[200px]'
                              : 'max-w-[260px]'
                          }`}
                          title={item.descricao}
                        >
                          {item.descricao}
                        </td>

                        {showFiscalFisico && (
                          <>
                            <td
                              className="border border-slate-300 p-1.5 text-center font-mono tabular-nums text-slate-800 text-[11px]"
                              title={`Saldo Fiscal: ${item.fiscalRaw || '0/00'}`}
                            >
                              {item.fiscalRaw || '0/00'}
                            </td>
                            {renderFisicoCell(item)}
                          </>
                        )}

                        <td
                          className="border border-slate-300 p-1.5 text-center font-bold text-slate-900 text-[11px]"
                          title={`SKU Fechado: ${getDivergenciaSkuFechado(
                            item,
                            true
                          )} cx | Divergência Bruta: ${item.diferencaRaw || '0/00'}`}
                        >
                          <div className="font-bold font-mono tabular-nums text-slate-900 leading-tight">
                            {getDivergenciaSkuFechado(item, true).toLocaleString('pt-BR')}
                          </div>
                        </td>

                        {showFiscalFisico && (
                          <td
                            className="border border-slate-300 p-1.5 text-center font-mono tabular-nums text-slate-800 text-[11px]"
                            title={`Saldo Final: ${item.finalRaw || item.fisicoRaw || '0/00'}`}
                          >
                            {item.finalRaw || item.fisicoRaw || '0/00'}
                          </td>
                        )}

                        <td className="border border-slate-300 p-1.5 pr-2.5 text-right font-mono tabular-nums text-[11px] text-slate-900">
                          <div className="flex justify-between items-center w-full px-1">
                            <span className="text-slate-500 font-sans text-[10px]">R$</span>
                            <span>
                              {Number.isFinite(item.sobraFinanceira) && item.sobraFinanceira > 0
                                ? item.sobraFinanceira.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : '0,00'}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`border border-slate-300 p-1.5 text-center font-mono tabular-nums text-[11px] ${pesoClass}`}
                        >
                          {pct}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Quando displaySection === 'conciliados_only', a tabela de Conciliados ocupa a coluna principal esquerda */}
        {effectiveSection === 'conciliados_only' && renderConciliadosTable()}

        {/* ================================================================= */}
        {/* COLUNA DIREITA: PAINEL DE TOTAIS E SALDO FINAL                    */}
        {/* ================================================================= */}
        <div className="flex flex-col space-y-3.5 pt-0.5">
          {/* Bloco de Informações Executivas do Armazém */}
          <div className="border border-slate-400 bg-slate-50 p-3.5 rounded shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                RELATÓRIO EXECUTIVO DE DIVERGÊNCIAS
              </div>
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                ✓ Padronizado
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm mt-1">{currentDepositoName}</div>
            <div className="text-xs text-slate-700 mt-1">
              Modo:{' '}
              <strong className={currentMode === 'com_ajuste' ? 'text-teal-700' : 'text-rose-700'}>
                {currentMode === 'com_ajuste' ? 'COM AJUSTES (Equalizado)' : 'SEM AJUSTE (Bruto)'}
              </strong>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Emissão: {new Date().toLocaleDateString('pt-BR')} às{' '}
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Subtotal do Filtro Ativo (quando usuário filtra SKU ou categoria específica) */}
          {!isExportTarget && isFilteredView && (
            <div className="border border-blue-300 bg-blue-50/70 p-3 rounded shadow-2xs space-y-2">
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-800">
                SUBTOTAL DOS ITENS EXIBIDOS NO FILTRO
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
                <div className="bg-white border border-rose-200 rounded p-2">
                  <div className="text-[10px] font-sans font-bold text-rose-700">Faltas Exibidas</div>
                  <div className="font-bold text-rose-700 mt-0.5">
                    -R${' '}
                    {totalDisplayFaltas.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {exportFaltas.length} SKU(s) · {filteredSkusFaltas} cx
                  </div>
                </div>
                <div className="bg-white border border-emerald-200 rounded p-2">
                  <div className="text-[10px] font-sans font-bold text-emerald-700">Sobras Exibidas</div>
                  <div className="font-bold text-emerald-700 mt-0.5">
                    +R${' '}
                    {totalDisplaySobras.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {exportSobras.length} SKU(s) · +{filteredSkusSobras} cx
                  </div>
                </div>
              </div>
              {exportConciliados.length > 0 && (
                <div className="text-[11px] font-mono tabular-nums text-blue-800 bg-white border border-blue-200 rounded px-2.5 py-1.5 flex items-center justify-between">
                  <span className="font-sans font-semibold">Sem Divergência (0 cx):</span>
                  <strong>{exportConciliados.length} SKU(s)</strong>
                </div>
              )}
              <div className="text-[11px] font-mono tabular-nums pt-1 border-t border-blue-200 flex items-center justify-between">
                <span className="font-sans font-bold text-slate-700">Saldo do Recorte:</span>
                <strong className={saldoFinalDisplay < 0 ? 'text-rose-700' : 'text-emerald-700'}>
                  {saldoFinalDisplay < 0 ? '-R$ ' : '+R$ '}
                  {Math.abs(saldoFinalDisplay).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </div>
            </div>
          )}

          {/* Boxes de TOTAL FALTAS e TOTAL SOBRAS lado a lado (Oficial Geral do Inventário) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="border border-slate-500 shadow-2xs">
              <div className="bg-[#2f3640] text-white text-center font-bold text-xs py-1.5 uppercase tracking-wider">
                TOTAL FALTAS
              </div>
              <div className="bg-white p-2.5 text-right font-mono tabular-nums font-bold text-xs text-slate-900 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-sans font-normal">R$</span>
                  <span>
                    {totalGeralPrejuizoFaltas.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {typeof totalGeralSkusFaltas === 'number' && totalGeralSkusFaltas > 0 && (
                  <div className="text-[10px] text-rose-700 font-medium mt-0.5">
                    {totalGeralSkusFaltas.toLocaleString('pt-BR')} cx
                  </div>
                )}
              </div>
            </div>

            <div className="border border-slate-500 shadow-2xs">
              <div className="bg-[#2f3640] text-white text-center font-bold text-xs py-1.5 uppercase tracking-wider">
                TOTAL SOBRAS
              </div>
              <div className="bg-white p-2.5 text-right font-mono tabular-nums font-bold text-xs text-slate-900 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-sans font-normal">R$</span>
                  <span>
                    {totalGeralValorSobras.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {typeof totalGeralSkusSobras === 'number' && totalGeralSkusSobras > 0 && (
                  <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                    +{totalGeralSkusSobras.toLocaleString('pt-BR')} cx
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Box Destaque: SALDO FINAL (Oficial Geral do Inventário) */}
          <div className="border-2 border-slate-700 shadow-sm">
            <div className="bg-[#2f3640] text-white text-center font-black text-sm py-2 uppercase tracking-widest flex items-center justify-center space-x-1">
              <span>SALDO FINAL</span>
              <span className="text-[10px] font-normal text-slate-300">(GERAL)</span>
            </div>
            <div
              className={`${
                finalSaldoGeral < 0
                  ? 'bg-[#fee2e2] text-[#b91c1c] border-t-2 border-[#b91c1c]'
                  : 'bg-[#dcfce7] text-[#15803d] border-t-2 border-[#15803d]'
              } py-5 px-3 flex flex-col items-center justify-center text-center`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black font-mono tabular-nums">
                  {finalSaldoGeral < 0 ? '-R$' : '+R$'}
                </span>
                <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums tracking-tight">
                  {Math.abs(finalSaldoGeral).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {typeof saldoFinalSkusGeral === 'number' && (
                <div className="text-xs font-bold font-mono tabular-nums mt-1 opacity-90">
                  {finalSaldoGeral === 0
                    ? '✓ Totalmente Amortizado'
                    : `Residual: ${saldoFinalSkusGeral.toLocaleString('pt-BR')} cx`}
                </div>
              )}
            </div>
          </div>

          {/* Assinaturas Operacionais */}
          <div className="border border-slate-300 bg-white p-3.5 rounded space-y-3.5 text-xs shadow-2xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">
                Conferente / Recontador:
              </div>
              <div className="border-b border-slate-400 pb-1 h-6"></div>
              <div className="text-[9px] text-slate-400 mt-0.5">Assinatura / Matrícula</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">
                Supervisor de Armazém:
              </div>
              <div className="border-b border-slate-400 pb-1 h-6"></div>
              <div className="text-[9px] text-slate-400 mt-0.5">Validação Física e Visto</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quando displaySection === 'all_three' ("Todos"), exibe a seção de Conciliados logo abaixo das Faltas & Sobras */}
      {effectiveSection === 'all_three' && showConciliadosTable && (
        <div className="mt-5 pt-4 border-t border-slate-300 w-full">
          {renderConciliadosTable()}
        </div>
      )}
    </div>
  );

  if (isExportTarget) {
    return (
      <div
        className={`font-sans text-slate-900 bg-white ${
          showFiscalFisico ? 'p-5 w-[1850px]' : 'p-5 w-[1680px]'
        }`}
      >
        {sheetBody}
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-900 bg-white rounded-lg border border-slate-200 w-full min-w-0">
      <TopSyncedScrollContainer className="p-3 sm:p-5">
        {sheetBody}
      </TopSyncedScrollContainer>
    </div>
  );
};
