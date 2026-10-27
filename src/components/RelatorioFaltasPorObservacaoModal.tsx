import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Layers, 
  Package, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Loader2,
  Filter,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { FaltaMapeadaItem, DepositoId, ProductMaster } from '../types';
import { formatCurrency, formatHectoliters } from '../utils/parsers';
import { getFaltaItemCalculatedValues, isFaltaPendente } from '../utils/desviosUtils';
import { exportElementToPdf } from '../utils/pdfExport';

interface RelatorioFaltasPorObservacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  faltas: FaltaMapeadaItem[];
  selectedDeposito: DepositoId | 'ALL';
  selectedIds?: Set<string>;
  weeklyBillingStatus?: Record<string, 'PENDENTE' | 'OK'>;
  productsMap?: Map<string, ProductMaster>;
}

interface ObservacaoGroup {
  observacao: string;
  items: FaltaMapeadaItem[];
  totalQuantidade: number;
  totalValor: number;
  totalHl: number;
  pendentesCount: number;
  baixadosCount: number;
}

export const RelatorioFaltasPorObservacaoModal: React.FC<RelatorioFaltasPorObservacaoModalProps> = ({
  isOpen,
  onClose,
  faltas,
  selectedDeposito,
  selectedIds = new Set(),
  weeklyBillingStatus,
  productsMap,
}) => {
  const [scope, setScope] = useState<'ALL' | 'SELECTED'>(() => (selectedIds.size > 0 ? 'SELECTED' : 'ALL'));
  const [searchTerm, setSearchTerm] = useState('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDENTE' | 'BAIXADO'>('ALL');

  // Ajusta o escopo inicial quando abrir com itens selecionados
  React.useEffect(() => {
    if (isOpen) {
      if (selectedIds.size > 0) {
        setScope('SELECTED');
      } else {
        setScope('ALL');
      }
    }
  }, [isOpen, selectedIds.size]);

  // Filtra itens com base no depósito, escopo e status
  const baseItems = useMemo(() => {
    return faltas.filter((item) => {
      // Filtro de Depósito
      if (selectedDeposito !== 'ALL' && item.deposito && item.deposito !== selectedDeposito) {
        return false;
      }
      // Filtro de Escopo (Apenas Selecionados vs Todos)
      if (scope === 'SELECTED') {
        if (!selectedIds.has(item.id)) return false;
      }
      // Filtro de Status de Baixa
      if (statusFilter !== 'ALL') {
        const pendente = isFaltaPendente(item, weeklyBillingStatus);
        if (statusFilter === 'PENDENTE' && !pendente) return false;
        if (statusFilter === 'BAIXADO' && pendente) return false;
      }
      return true;
    });
  }, [faltas, selectedDeposito, scope, selectedIds, statusFilter, weeklyBillingStatus]);

  // Agrupamento por Observação
  const groups: ObservacaoGroup[] = useMemo(() => {
    const map = new Map<string, FaltaMapeadaItem[]>();

    baseItems.forEach((item) => {
      const rawObs = (item.observacao || '').trim();
      const obsKey = rawObs.length > 0 ? rawObs.toUpperCase() : 'SEM OBSERVAÇÃO DEFINIDA / OUTROS';

      const list = map.get(obsKey) || [];
      list.push(item);
      map.set(obsKey, list);
    });

    const result: ObservacaoGroup[] = [];

    map.forEach((items, observacao) => {
      // Ordena itens dentro do grupo por descrição ou código
      items.sort((a, b) => {
        const codA = a.codigo || a.produto || '';
        const codB = b.codigo || b.produto || '';
        return codA.localeCompare(codB);
      });

      let totalQuantidade = 0;
      let totalValor = 0;
      let totalHl = 0;
      let pendentesCount = 0;
      let baixadosCount = 0;

      items.forEach((it) => {
        const qty = it.quantidade || it.quantidadeSkus || 0;
        const vals = getFaltaItemCalculatedValues(it, productsMap);
        totalQuantidade += qty;
        totalValor += vals.valorTotal;
        totalHl += vals.volumeHl;

        if (isFaltaPendente(it, weeklyBillingStatus)) {
          pendentesCount++;
        } else {
          baixadosCount++;
        }
      });

      result.push({
        observacao,
        items,
        totalQuantidade,
        totalValor,
        totalHl,
        pendentesCount,
        baixadosCount,
      });
    });

    // Ordena os grupos alfabeticamente pela observação, mantendo "SEM OBSERVAÇÃO" no final
    result.sort((a, b) => {
      if (a.observacao.includes('SEM OBSERVAÇÃO')) return 1;
      if (b.observacao.includes('SEM OBSERVAÇÃO')) return -1;
      return a.observacao.localeCompare(b.observacao);
    });

    // Aplica filtro de busca (se houver)
    if (!searchTerm.trim()) return result;

    const term = searchTerm.toLowerCase();
    return result.filter((grp) => {
      if (grp.observacao.toLowerCase().includes(term)) return true;
      return grp.items.some((it) => {
        const cod = (it.codigo || it.produto || '').toLowerCase();
        const desc = (it.descricao || '').toLowerCase();
        return cod.includes(term) || desc.includes(term);
      });
    });
  }, [baseItems, productsMap, weeklyBillingStatus, searchTerm]);

  // Totais Gerais
  const totals = useMemo(() => {
    let totalItems = 0;
    let totalQuantidade = 0;
    let totalValor = 0;
    let totalHl = 0;

    groups.forEach((g) => {
      totalItems += g.items.length;
      totalQuantidade += g.totalQuantidade;
      totalValor += g.totalValor;
      totalHl += g.totalHl;
    });

    return {
      totalGroups: groups.length,
      totalItems,
      totalQuantidade,
      totalValor,
      totalHl,
    };
  }, [groups]);

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    const el = document.getElementById('report-faltas-obs-print');
    if (!el) return;

    setIsExporting(true);
    try {
      const depName = selectedDeposito === 'ALL' ? 'Todos os Depósitos' : `Depósito ${selectedDeposito}`;
      const escopoText = scope === 'SELECTED' ? `Itens Selecionados (${totals.totalItems})` : `Base Geral (${totals.totalItems} itens)`;

      await exportElementToPdf(el, {
        fileName: `relatorio-faltas-por-observacao-${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation,
        title: 'RELATÓRIO DE FALTAS MAPEADAS POR OBSERVAÇÃO',
        subtitle: `Detalhamento de Itens, Códigos, Quantidades e Justificativas • ${escopoText}`,
        depositoName: depName,
        periodo: `Emissão: ${new Date().toLocaleDateString('pt-BR')}`,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF de faltas por observação:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const depLabel = selectedDeposito === 'ALL' ? 'Todos os Depósitos' : `Depósito ${selectedDeposito}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col w-full max-w-6xl max-h-[94vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Relatório de Faltas por Observação
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                  PDF & Ambev DPO
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Itens agrupados por observação/justificativa com código, descrição, quantidade física e impacto.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              title="Imprimir visualização"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting || totals.totalItems === 0}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exportar PDF Oficial</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Preferences Toolbar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* Scope toggle */}
            {selectedIds.size > 0 && (
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setScope('SELECTED')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    scope === 'SELECTED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Apenas Selecionados ({selectedIds.size})
                </button>
                <button
                  type="button"
                  onClick={() => setScope('ALL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    scope === 'ALL'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos os Registros ({faltas.length})
                </button>
              </div>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">Status: Todos</option>
              <option value="PENDENTE">Apenas Pendentes (Amortiza)</option>
              <option value="BAIXADO">Apenas Baixadas (Liquidadas)</option>
            </select>

            {/* Orientation */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  orientation === 'portrait' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Retrato (A4)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                  orientation === 'landscape' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Paisagem
              </button>
            </div>

            {/* Depósito badge */}
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{depLabel}</span>
            </span>
          </div>

          {/* Search bar inside modal */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar observação ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Scrollable Content Container (also used as print target) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          <div 
            id="report-faltas-obs-print" 
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6 max-w-5xl mx-auto"
          >
            {/* Report Header for PDF and Screen */}
            <div className="border-b-2 border-slate-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                    AMBEV DPO • CONTROLE OPERACIONAL DE FALTAS & ESTOQUE
                  </div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                    RELATÓRIO DE FALTAS MAPEADAS POR OBSERVAÇÃO
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consolidado analítico das justificativas de faltas com listagem detalhada de códigos, descrições e quantidades.
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-600 font-mono space-y-0.5">
                  <div><strong>Depósito:</strong> {depLabel}</div>
                  <div><strong>Escopo:</strong> {scope === 'SELECTED' ? `Selecionados (${totals.totalItems})` : 'Geral'}</div>
                  <div><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>

            {/* KPI Executive Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="p-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Agrupamentos / Observações
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {totals.totalGroups}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">justificativas registradas</p>
              </div>

              <div className="p-2 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Quantidade Total em Falta
                </span>
                <div className="text-xl font-bold font-mono text-rose-700 mt-0.5">
                  {totals.totalQuantidade.toLocaleString('pt-BR')} <span className="text-xs font-normal text-rose-500">cx</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{totals.totalItems} linhas / SKUs</p>
              </div>

              <div className="p-2 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Impacto Financeiro Total
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {formatCurrency(totals.totalValor)}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">custo base DPO</p>
              </div>

              <div className="p-2 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Volume Total Acumulado
                </span>
                <div className="text-xl font-bold font-mono text-amber-700 mt-0.5">
                  {formatHectoliters(totals.totalHl)}
                </div>
                <p className="text-[10px] text-amber-600 mt-0.5">{(totals.totalHl * 100).toFixed(0)} litros</p>
              </div>
            </div>

            {/* Observation Groups */}
            {groups.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Nenhum item encontrado com os filtros atuais.</p>
                <p className="text-xs text-slate-400">Verifique os filtros de depósito, escopo ou termo de pesquisa.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((group, groupIndex) => (
                  <div
                    key={`${group.observacao}-${groupIndex}`}
                    className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white"
                  >
                    {/* Observation Group Title Header */}
                    <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-md bg-rose-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                          {groupIndex + 1}
                        </span>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-rose-300 font-bold">
                            OBSERVAÇÃO / JUSTIFICATIVA:
                          </div>
                          <div className="text-sm font-black text-white tracking-wide">
                            {group.observacao}
                          </div>
                        </div>
                      </div>

                      {/* Group summary badges */}
                      <div className="flex items-center space-x-2 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-800 font-bold">
                          Qtd: {group.totalQuantidade.toLocaleString('pt-BR')} cx
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700 font-semibold">
                          {formatCurrency(group.totalValor)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {formatHectoliters(group.totalHl)}
                        </span>
                      </div>
                    </div>

                    {/* Table of items belonging to this observation */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
                            <th className="py-2.5 px-3 w-28 font-mono">Código (SKU)</th>
                            <th className="py-2.5 px-3">Descrição do Produto</th>
                            <th className="py-2.5 px-3 text-right w-28 text-slate-900">Quantidade</th>
                            <th className="py-2.5 px-3 text-right w-28">Valor Total</th>
                            <th className="py-2.5 px-3 text-right w-24">Volume (HL)</th>
                            <th className="py-2.5 px-3 text-center w-32">Status da Baixa</th>
                            <th className="py-2.5 px-3 text-center w-24">Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {group.items.map((item, itemIdx) => {
                            const code = item.codigo || item.produto || '-';
                            const qty = item.quantidade || item.quantidadeSkus || 0;
                            const vals = getFaltaItemCalculatedValues(item, productsMap);
                            const pendente = isFaltaPendente(item, weeklyBillingStatus);

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2 px-3 text-center text-[10px] text-slate-400 font-mono">
                                  {itemIdx + 1}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                    {code}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-800 font-medium leading-snug">
                                  {item.descricao || 'Produto sem descrição cadastrada'}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-black text-rose-700 text-sm">
                                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                                    {qty.toLocaleString('pt-BR')} cx
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-800">
                                  {formatCurrency(vals.valorTotal)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-600">
                                  {formatHectoliters(vals.volumeHl)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {pendente ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      <Clock className="w-3 h-3 mr-1 text-amber-500" />
                                      Pendente (Amortiza)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                                      Baixada / Liquidada
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center text-[11px] text-slate-500 font-mono">
                                  {item.data || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Subtotal row */}
                        <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs text-slate-800">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-600">
                              Subtotal ({group.observacao}):
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-700 text-xs font-black">
                              {group.totalQuantidade.toLocaleString('pt-BR')} cx
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-900 text-xs">
                              {formatCurrency(group.totalValor)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-amber-700 text-xs">
                              {formatHectoliters(group.totalHl)}
                            </td>
                            <td colSpan={2} className="py-2.5 px-3 text-center text-[10px] text-slate-500 font-normal">
                              {group.pendentesCount} pendentes • {group.baixadosCount} baixadas
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Consolidation Summary Table */}
            {groups.length > 0 && (
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-700 pb-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-rose-400 tracking-wider">
                      TOTALIZAÇÃO GERAL DO RELATÓRIO
                    </div>
                    <div className="text-base font-black text-white">
                      Consolidação de {totals.totalGroups} Grupos de Observação
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-right font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Quantidade Total</div>
                      <div className="text-lg font-black text-rose-400">
                        {totals.totalQuantidade.toLocaleString('pt-BR')} cx
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Valor Total</div>
                      <div className="text-lg font-black text-emerald-400">
                        {formatCurrency(totals.totalValor)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Volume Total</div>
                      <div className="text-lg font-black text-amber-400">
                        {formatHectoliters(totals.totalHl)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures block for formal physical documentation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-center text-xs text-slate-400">
                  <div className="border-t border-slate-700 pt-2">
                    <p className="font-semibold text-slate-300">Conferente / Responsável</p>
                    <p className="text-[10px] text-slate-500">Mapeamento Físico de Faltas</p>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <p className="font-semibold text-slate-300">Supervisor de Armazém / DPO</p>
                    <p className="text-[10px] text-slate-500">Validação de Justificativas</p>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <p className="font-semibold text-slate-300">Gerência de Operações & Estoque</p>
                    <p className="text-[10px] text-slate-500">Aprovação & Liquidação</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Padrão Ambev DPO • Alta resolução e paginação contínua</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting || totals.totalItems === 0}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
