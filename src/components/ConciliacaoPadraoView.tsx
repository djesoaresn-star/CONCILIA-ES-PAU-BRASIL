import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Search,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Download,
  Sparkles,
  Edit3,
  Check,
  X,
  FolderDown,
  Camera,
  Maximize2,
  Table2,
  PlusCircle,
} from 'lucide-react';
import {
  StockPositionItem,
  DepositoId,
  ProductMaster,
  QuebraItem,
  ValeItem,
  TrocaItem,
  FaltaMapeadaItem,
  ViewTab,
} from '../types';
import {
  formatCurrency,
  formatHectoliters,
  calcularDivergencia,
  normalizeSku,
} from '../utils/parsers';
import { DEPOSITOS } from '../data/initialData';
import { exportConciliacaoExcel } from '../utils/excelReconciliationExport';
import { RecontagemRankingsModal, DashboardRankingItem } from './RecontagemRankingsModal';
import { RecontagemExportSheet, SheetDisplaySection } from './RecontagemExportSheet';
import { EditConciliacaoItemModal } from './EditConciliacaoItemModal';
import { reconcileAllStock, ReconciledRow } from '../utils/reconciliationEngine';
import { ConciliacaoStatusChart, StatusChartSelection } from './ConciliacaoStatusChart';
import { MissingSkuRecoveryBanner } from './MissingSkuRecoveryBanner';
import { TopSyncedScrollContainer } from './TopSyncedScrollContainer';

export interface ConciliacaoPadraoViewProps {
  stockPositions: StockPositionItem[];
  setStockPositions: React.Dispatch<React.SetStateAction<StockPositionItem[]>>;
  selectedDeposito: DepositoId | 'ALL';
  setSelectedDeposito: (dep: DepositoId | 'ALL') => void;
  onOpenImportModal: (
    initialFile?: '020502' | '021101' | 'cadastro' | 'quebras' | 'vales' | 'trocas' | 'faltas'
  ) => void;
  onClearStockPositions?: () => void;
  productsMap: Map<string, ProductMaster>;
  isRecountApplied: boolean;
  quebras?: QuebraItem[];
  vales?: ValeItem[];
  trocas?: TrocaItem[];
  faltasMapeadas?: FaltaMapeadaItem[];
  subTab: 'padrao' | 'ajustes';
  onToggleSubTab: (tab: 'padrao' | 'ajustes') => void;
  onNavigateTab?: (tab: ViewTab) => void;
  onOpenSaveModal?: () => void;
  weeklyBillingStatus?: Record<string, 'PENDENTE' | 'OK'>;
}

type FilterDivergence = 'ALL' | 'DIVERGENT' | 'FALTAS' | 'SOBRAS' | 'OK' | 'RECOUNTED';

export const ConciliacaoPadraoView: React.FC<ConciliacaoPadraoViewProps> = ({
  stockPositions,
  setStockPositions,
  selectedDeposito,
  onOpenImportModal,
  productsMap,
  isRecountApplied,
  quebras = [],
  vales = [],
  trocas = [],
  faltasMapeadas = [],
  subTab,
  onToggleSubTab,
  onOpenSaveModal,
  weeklyBillingStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [divergenceFilter, setDivergenceFilter] = useState<FilterDivergence>('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'prejuizo' | 'sobra' | 'hl' | 'produto' | 'descricao'>('prejuizo');
  const [sortAsc, setSortAsc] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editSkuInput, setEditSkuInput] = useState('');
  const [isRecontagemModalOpen, setIsRecontagemModalOpen] = useState(false);
  const [selectedRecountIds, setSelectedRecountIds] = useState<Set<string>>(new Set());
  const [actionModalItem, setActionModalItem] = useState<StockPositionItem | null>(null);
  const [viewLayout, setViewLayout] = useState<'lado_a_lado' | 'tabela'>('lado_a_lado');
  const [showManualAddPanel, setShowManualAddPanel] = useState(false);
  const [exportErrorMsg, setExportErrorMsg] = useState<string | null>(null);

  // Motor Único Canônico de Conciliação (100% paridade com Dashboard Sem Ajustes)
  const reconciled = useMemo(() => {
    return reconcileAllStock({
      stockPositions,
      quebras,
      vales,
      trocas,
      faltasMapeadas,
      selectedDeposito,
      weeklyBillingStatus,
      productsMap,
    });
  }, [
    stockPositions,
    quebras,
    vales,
    trocas,
    faltasMapeadas,
    selectedDeposito,
    weeklyBillingStatus,
    productsMap,
  ]);

  const healedStockPositions = reconciled.healedStock;
  const allRankingFaltas = reconciled.rankingFaltasSemAjuste;
  const allRankingSobras = reconciled.rankingSobrasSemAjuste;

  const currentDepositoName = useMemo(() => {
    if (selectedDeposito === 'ALL') return 'Todos os Depósitos';
    const dep = DEPOSITOS.find((d) => d.id === selectedDeposito);
    return dep ? dep.nome : `Depósito ${selectedDeposito}`;
  }, [selectedDeposito]);

  const totalGeralPrejuizoFaltas = reconciled.totalsSemAjuste.totalFaltasValor;
  const totalGeralValorSobras = reconciled.totalsSemAjuste.totalSobrasValor;
  const totalGeralSkusFaltas = reconciled.totalsSemAjuste.totalFaltasSkus;
  const totalGeralSkusSobras = reconciled.totalsSemAjuste.totalSobrasSkus;
  const saldoFinalGeral = reconciled.totalsSemAjuste.saldoLiquidoValor;
  const saldoFinalSkusGeral = reconciled.totalsSemAjuste.saldoLiquidoSkus;

  // Contagens por categoria para exibir nos botões de filtro
  const filterCounts = useMemo(() => {
    let divergent = 0;
    let faltas = 0;
    let sobras = 0;
    let ok = 0;
    let recounted = 0;
    healedStockPositions.forEach((item) => {
      const isIgnored = Boolean(item.saldoNegativoDesconsiderado || item.disponivelTotalUnits < 0);
      const isOk = isIgnored || item.diferencaSkus === 0 || item.status === 'OK';
      if (isOk) {
        ok++;
      } else {
        divergent++;
        if (item.diferencaSkus < 0) faltas++;
        else if (item.diferencaSkus > 0) sobras++;
      }
      if (item.recontado) recounted++;
    });
    return {
      all: healedStockPositions.length,
      divergent,
      faltas,
      sobras,
      ok,
      recounted,
    };
  }, [healedStockPositions]);

  const handleToggleRecountId = (id: string) => {
    setSelectedRecountIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Busca inteligente de analista: se o usuário digitar um código numérico exato existente (ex: 347 ou 31766),
  // retorna estritamente aquele SKU para inspeção individual sem ruído de códigos parciais.
  const baseSearchAndGroupRows = useMemo(() => {
    const rawTerm = searchTerm.trim();
    const lowerTerm = rawTerm.toLowerCase();
    const isNumericQuery = /^\d+$/.test(rawTerm);
    const cleanNumericTerm = isNumericQuery ? normalizeSku(rawTerm) : '';

    const hasExactSkuMatch =
      isNumericQuery &&
      reconciled.rows.some(
        (r) =>
          (groupFilter === 'ALL' || r.stockItem.grupo === groupFilter) &&
          normalizeSku(r.stockItem.produto) === cleanNumericTerm
      );

    return reconciled.rows.filter((r) => {
      const item = r.stockItem;
      if (groupFilter !== 'ALL' && item.grupo !== groupFilter) return false;
      if (!rawTerm) return true;

      if (hasExactSkuMatch) {
        return normalizeSku(item.produto) === cleanNumericTerm;
      }

      const matchSku =
        item.produto.toLowerCase().includes(lowerTerm) ||
        normalizeSku(item.produto).toLowerCase().includes(lowerTerm);
      const matchDesc = item.descricao.toLowerCase().includes(lowerTerm);
      return matchSku || matchDesc;
    });
  }, [reconciled.rows, groupFilter, searchTerm]);

  const matchesDivergenceFilter = (r: ReconciledRow, filter: FilterDivergence): boolean => {
    const item = r.stockItem;
    const isItemOk = r.isIgnoredNegative || item.diferencaSkus === 0 || item.status === 'OK';
    if (filter === 'DIVERGENT') return !isItemOk;
    if (filter === 'FALTAS') return !isItemOk && item.diferencaSkus < 0;
    if (filter === 'SOBRAS') return !isItemOk && item.diferencaSkus > 0;
    if (filter === 'OK') return isItemOk;
    if (filter === 'RECOUNTED') return Boolean(item.recontado);
    return true;
  };

  // Se o usuário digitou um SKU específico na busca enquanto estava em uma aba restrita (ex: "Apenas Faltas"),
  // e o SKU na verdade está em Sobra ou Conciliado, exibe automaticamente o SKU na sua categoria real!
  const { effectiveRows, autoRevealedOutsideFilter } = useMemo(() => {
    const strictRows = baseSearchAndGroupRows.filter((r) =>
      matchesDivergenceFilter(r, divergenceFilter)
    );
    if (
      searchTerm.trim() !== '' &&
      strictRows.length === 0 &&
      baseSearchAndGroupRows.length > 0 &&
      divergenceFilter !== 'ALL'
    ) {
      return { effectiveRows: baseSearchAndGroupRows, autoRevealedOutsideFilter: true };
    }
    return { effectiveRows: strictRows, autoRevealedOutsideFilter: false };
  }, [baseSearchAndGroupRows, divergenceFilter, searchTerm]);

  // Ordenação unificada para ambas as visualizações (Lado a Lado e Tabela 02.05.02)
  const sortReconciledRows = (list: ReconciledRow[], defaultMode?: 'falta' | 'sobra' | 'ok') => {
    return [...list].sort((a, b) => {
      const ia = a.stockItem;
      const ib = b.stockItem;
      let comparison = 0;

      if (sortField === 'produto') {
        comparison = parseInt(ia.produto, 10) - parseInt(ib.produto, 10);
      } else if (sortField === 'descricao') {
        comparison = ia.descricao.localeCompare(ib.descricao);
      } else if (sortField === 'hl') {
        comparison = Math.abs(ib.impactoHl) - Math.abs(ia.impactoHl);
      } else if (sortField === 'sobra' || defaultMode === 'sobra') {
        comparison = ib.sobraFinanceira - ia.sobraFinanceira;
        if (comparison === 0) comparison = Math.abs(ib.diferencaTotalUnits) - Math.abs(ia.diferencaTotalUnits);
      } else if (defaultMode === 'ok') {
        comparison = ib.disponivelSkus * ib.valorCaixa - ia.disponivelSkus * ia.valorCaixa;
        if (comparison === 0) comparison = parseInt(ia.produto, 10) - parseInt(ib.produto, 10);
      } else {
        comparison = ib.prejuizoFinanceiro - ia.prejuizoFinanceiro;
        if (comparison === 0) comparison = Math.abs(ib.diferencaTotalUnits) - Math.abs(ia.diferencaTotalUnits);
      }

      return sortAsc ? -comparison : comparison;
    });
  };

  const sortedStock = useMemo(() => {
    return sortReconciledRows(effectiveRows).map((r) => r.stockItem);
  }, [effectiveRows, sortField, sortAsc]);

  // Listas filtradas para o componente visual de tabelas (Faltas / Sobras / Conciliados)
  const {
    sheetFaltas,
    sheetSobras,
    sheetConciliados,
    sheetDisplaySection,
    displayTotalFaltas,
    displayTotalSobras,
  } = useMemo(() => {
    const faltaRows = effectiveRows.filter(
      (r) => !r.isIgnoredNegative && r.stockItem.diferencaSkus < 0
    );
    const sobraRows = effectiveRows.filter(
      (r) => !r.isIgnoredNegative && r.stockItem.diferencaSkus > 0
    );
    const okRows = effectiveRows.filter(
      (r) => r.isIgnoredNegative || r.stockItem.diferencaSkus === 0
    );

    const faltasSorted: DashboardRankingItem[] = sortReconciledRows(
      faltaRows,
      sortField === 'prejuizo' ? 'falta' : undefined
    ).map((r) => r.rankingSemAjuste);

    const sobrasSorted: DashboardRankingItem[] = sortReconciledRows(
      sobraRows,
      sortField === 'prejuizo' ? 'sobra' : undefined
    ).map((r) => r.rankingSemAjuste);

    const conciliadosSorted: DashboardRankingItem[] = sortReconciledRows(
      okRows,
      sortField === 'prejuizo' ? 'ok' : undefined
    ).map((r) => r.rankingSemAjuste);

    const hasFaltas = faltasSorted.length > 0;
    const hasSobras = sobrasSorted.length > 0;
    const hasOk = conciliadosSorted.length > 0;

    let section: SheetDisplaySection = 'both';

    if (searchTerm.trim() !== '' || autoRevealedOutsideFilter) {
      // Quando filtrando SKU específico, exibe APENAS a tabela correspondente ao status real do SKU
      if (hasFaltas && !hasSobras && !hasOk) section = 'faltas_only';
      else if (hasSobras && !hasFaltas && !hasOk) section = 'sobras_only';
      else if (hasOk && !hasFaltas && !hasSobras) section = 'conciliados_only';
      else if (hasFaltas && hasSobras && !hasOk) section = 'both';
      else section = 'all_three';
    } else {
      if (divergenceFilter === 'FALTAS') section = 'faltas_only';
      else if (divergenceFilter === 'SOBRAS') section = 'sobras_only';
      else if (divergenceFilter === 'OK') section = 'conciliados_only';
      else if (divergenceFilter === 'DIVERGENT') section = 'both';
      else if (divergenceFilter === 'RECOUNTED') {
        if (hasFaltas && !hasSobras && !hasOk) section = 'faltas_only';
        else if (hasSobras && !hasFaltas && !hasOk) section = 'sobras_only';
        else if (hasOk && !hasFaltas && !hasSobras) section = 'conciliados_only';
        else if (!hasOk) section = 'both';
        else section = 'all_three';
      } else {
        // 'ALL' -> Exibe Faltas, Sobras e os 100% Conciliados
        section = 'all_three';
      }
    }

    const sumFaltas = faltasSorted.reduce((acc, i) => acc + (i.prejuizoFinanceiro || 0), 0);
    const sumSobras = sobrasSorted.reduce((acc, i) => acc + (i.sobraFinanceira || 0), 0);

    return {
      sheetFaltas: faltasSorted,
      sheetSobras: sobrasSorted,
      sheetConciliados: conciliadosSorted,
      sheetDisplaySection: section,
      displayTotalFaltas: sumFaltas,
      displayTotalSobras: sumSobras,
    };
  }, [effectiveRows, divergenceFilter, searchTerm, sortField, sortAsc, autoRevealedOutsideFilter]);

  const isFilteredActive =
    searchTerm.trim() !== '' || groupFilter !== 'ALL' || divergenceFilter !== 'ALL';

  // Distinct groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    healedStockPositions.forEach((s) => {
      if (s.grupo) set.add(s.grupo);
    });
    return Array.from(set).sort();
  }, [healedStockPositions]);

  // Live KPI Summary for current filter
  const summary = useMemo(() => {
    let totalDispSkus = 0;
    let totalInvSkus = 0;
    let totalPrejuizo = 0;
    let totalSobra = 0;
    let totalHl = 0;
    let valorTotalEstoqueFisico = 0;
    let valorTotalEstoqueDisponivel = 0;

    effectiveRows.forEach((r) => {
      if (r.isIgnoredNegative) return;
      const item = r.stockItem;
      totalDispSkus += item.disponivelSkus;
      totalInvSkus += item.inventarioSkus;
      valorTotalEstoqueFisico += item.inventarioSkus * item.valorCaixa;
      valorTotalEstoqueDisponivel += item.disponivelSkus * item.valorCaixa;

      if (item.status === 'FALTA') {
        totalPrejuizo += item.prejuizoFinanceiro;
        totalHl += item.impactoHl;
      } else if (item.status === 'SOBRA') {
        totalSobra += item.sobraFinanceira;
        totalHl += item.impactoHl;
      }
    });

    return {
      totalDispSkus,
      totalInvSkus,
      valorTotalEstoqueFisico,
      valorTotalEstoqueDisponivel,
      totalPrejuizo,
      totalSobra,
      totalHl,
      totalItems: effectiveRows.length,
    };
  }, [effectiveRows]);

  const chartActiveSelection: StatusChartSelection =
    divergenceFilter === 'FALTAS'
      ? 'FALTAS'
      : divergenceFilter === 'SOBRAS'
      ? 'SOBRAS'
      : divergenceFilter === 'OK'
      ? 'CONCILIADOS'
      : 'ALL';

  const handleSelectChartCategory = (cat: StatusChartSelection) => {
    if (cat === 'FALTAS') setDivergenceFilter('FALTAS');
    else if (cat === 'SOBRAS') setDivergenceFilter('SOBRAS');
    else if (cat === 'CONCILIADOS') setDivergenceFilter('OK');
    else setDivergenceFilter('ALL');
  };

  const handleAddMissingStockItem = (newItem: StockPositionItem) => {
    setStockPositions((prev) => {
      const existsIdx = prev.findIndex((p) => p.id === newItem.id);
      if (existsIdx >= 0) {
        const clone = [...prev];
        clone[existsIdx] = newItem;
        return clone;
      }
      return [...prev, newItem];
    });
    setShowManualAddPanel(false);
  };

  const handleStartEdit = (item: StockPositionItem) => {
    setEditingItemId(item.id);
    setEditSkuInput(item.inventarioRaw);
  };

  const handleSaveEdit = (item: StockPositionItem) => {
    const div = calcularDivergencia(
      item.disponivelRaw,
      editSkuInput,
      item.fatorSku,
      item.valorUnitario,
      item.fatorHl
    );

    setStockPositions((prev) =>
      prev.map((p) => {
        if (p.id !== item.id) return p;
        return {
          ...p,
          inventarioRaw: editSkuInput,
          inventarioSkus: div.invParsed.skus,
          inventarioLooseUnits: Math.abs(div.invParsed.looseUnits),
          inventarioTotalUnits: div.invParsed.totalUnits,
          diferencaTotalUnits: div.difUnidades,
          diferencaSkus: div.difSkus,
          diferencaLooseUnits: div.avulsas,
          diferencaRaw: div.diferencaRaw,
          status: div.status,
          impactoFinanceiro: div.impactoFinanceiro,
          prejuizoFinanceiro: div.prejuizoFinanceiro,
          sobraFinanceira: div.sobraFinanceira,
          impactoHl: div.impactoHl,
          recontado: true,
          saldoNegativoDesconsiderado: div.saldoNegativoDesconsiderado,
        };
      })
    );

    setEditingItemId(null);
  };

  const handleUpdateFisico = (itemId: string, newFisicoRaw: string) => {
    setStockPositions((prev) =>
      prev.map((p) => {
        if (p.id !== itemId) return p;
        const div = calcularDivergencia(
          p.disponivelRaw,
          newFisicoRaw,
          p.fatorSku,
          p.valorUnitario,
          p.fatorHl
        );
        return {
          ...p,
          inventarioRaw: newFisicoRaw,
          inventarioSkus: div.invParsed.skus,
          inventarioLooseUnits: Math.abs(div.invParsed.looseUnits),
          inventarioTotalUnits: div.invParsed.totalUnits,
          diferencaTotalUnits: div.difUnidades,
          diferencaSkus: div.difSkus,
          diferencaLooseUnits: div.avulsas,
          diferencaRaw: div.diferencaRaw,
          status: div.status,
          impactoFinanceiro: div.impactoFinanceiro,
          prejuizoFinanceiro: div.prejuizoFinanceiro,
          sobraFinanceira: div.sobraFinanceira,
          impactoHl: div.impactoHl,
          recontado: true,
          saldoNegativoDesconsiderado: div.saldoNegativoDesconsiderado,
        };
      })
    );
  };

  const handleSaveItemEdit = (itemId: string, updates: Partial<StockPositionItem>) => {
    setStockPositions((prev) =>
      prev.map((p) => {
        if (p.id !== itemId) return p;
        const updated = { ...p, ...updates };
        const div = calcularDivergencia(
          updated.disponivelRaw,
          updated.inventarioRaw,
          updated.fatorSku,
          updated.valorUnitario,
          updated.fatorHl
        );
        return {
          ...updated,
          inventarioSkus: div.invParsed.skus,
          inventarioLooseUnits: Math.abs(div.invParsed.looseUnits),
          inventarioTotalUnits: div.invParsed.totalUnits,
          diferencaTotalUnits: div.difUnidades,
          diferencaSkus: div.difSkus,
          diferencaLooseUnits: div.avulsas,
          diferencaRaw: div.diferencaRaw,
          status: div.status,
          impactoFinanceiro: div.impactoFinanceiro,
          prejuizoFinanceiro: div.prejuizoFinanceiro,
          sobraFinanceira: div.sobraFinanceira,
          impactoHl: div.impactoHl,
          recontado: true,
          saldoNegativoDesconsiderado: div.saldoNegativoDesconsiderado,
        };
      })
    );
    setActionModalItem(null);
  };

  const handleSwapItem = (
    itemId: string,
    newProductData: {
      sku: string;
      descricao: string;
      fatorSku: number;
      valorCaixa: number;
      valorUnitario: number;
      fatorHl: number;
      grupo: string;
      novoFisicoRaw?: string;
    }
  ) => {
    setStockPositions((prev) =>
      prev.map((p) => {
        if (p.id !== itemId) return p;
        const fisicoToUse =
          newProductData.novoFisicoRaw !== undefined && newProductData.novoFisicoRaw !== ''
            ? newProductData.novoFisicoRaw
            : p.inventarioRaw;

        const div = calcularDivergencia(
          p.disponivelRaw,
          fisicoToUse,
          newProductData.fatorSku,
          newProductData.valorUnitario,
          newProductData.fatorHl
        );

        return {
          ...p,
          produto: newProductData.sku,
          descricao: newProductData.descricao,
          fatorSku: newProductData.fatorSku,
          valorCaixa: newProductData.valorCaixa,
          valorUnitario: newProductData.valorUnitario,
          fatorHl: newProductData.fatorHl,
          inventarioRaw: fisicoToUse,
          inventarioSkus: div.invParsed.skus,
          inventarioLooseUnits: Math.abs(div.invParsed.looseUnits),
          inventarioTotalUnits: div.invParsed.totalUnits,
          diferencaTotalUnits: div.difUnidades,
          diferencaSkus: div.difSkus,
          diferencaLooseUnits: div.avulsas,
          diferencaRaw: div.diferencaRaw,
          status: div.status,
          impactoFinanceiro: div.impactoFinanceiro,
          prejuizoFinanceiro: div.prejuizoFinanceiro,
          sobraFinanceira: div.sobraFinanceira,
          impactoHl: div.impactoHl,
          recontado: true,
          saldoNegativoDesconsiderado: div.saldoNegativoDesconsiderado,
        };
      })
    );
    setActionModalItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    setStockPositions((prev) => prev.filter((p) => p.id !== itemId));
    setActionModalItem(null);
  };

  const handleExportExcel = async () => {
    try {
      setExportErrorMsg(null);
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const filename = `Conciliacao_Estoque_Ambev_Dep_${selectedDeposito}_${dateStr}_${timeStr}.xlsx`;

      await exportConciliacaoExcel({
        stockPositions: healedStockPositions,
        quebras,
        vales,
        trocas,
        faltasMapeadas,
        selectedDeposito,
        filename,
      });
    } catch (err) {
      console.error('Erro ao exportar planilha Excel:', err);
      setExportErrorMsg('Não foi possível gerar o arquivo Excel no momento. Tente novamente.');
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Seletor Unificado de Modo: Sem Ajustes vs Com Ajustes */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Visão:
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => onToggleSubTab('padrao')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                subTab === 'padrao'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Sem Ajustes (Padrão 02.05.02 vs Físico)</span>
            </button>

            <button
              onClick={() => onToggleSubTab('ajustes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                subTab === 'ajustes'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Com Ajustes (Físico + Desvios Equalizados)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Depósito Ativo:</span>
          <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-slate-100 text-slate-800 border border-slate-200">
            {selectedDeposito === 'ALL' ? 'Todos os Depósitos' : `Depósito ${selectedDeposito}`}
          </span>
        </div>
      </div>

      {/* Title & Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Conciliação 02.05.02
            </span>
            <span
              className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md"
              title="Suporta formato Promax de 2 ou 3 casas (ex: 448/06, 12/000 para CX200)"
            >
              Formato Promax (SKU/UN)
            </span>
            {isRecountApplied && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ✓ 02.11.01 Ativo
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            Posição de Estoque: Disponível (02.05.02) x Inventário Físico
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl mt-0.5">
            Divergências apuradas estritamente em SKUs fechados (caixas inteiras). Selecione qualquer filtro ou pesquise um SKU específico abaixo para visualizar isoladamente sua posição (Falta, Sobra ou Conciliado).
          </p>
        </div>

        {/* Primary Action Buttons & View Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 border border-slate-300 rounded-lg shadow-2xs">
            <button
              type="button"
              onClick={() => setViewLayout('lado_a_lado')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                viewLayout === 'lado_a_lado'
                  ? 'bg-[#FFC000] text-slate-950 shadow-xs border border-amber-500 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-3.5 h-3.5 text-slate-950" />
              <span>Painel Analítico</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('tabela')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                viewLayout === 'tabela'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tabela 02.05.02</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowManualAddPanel((v) => !v)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
            title="Incluir manualmente um SKU ausente na conciliação (ex: 31766 ASSOLAN)"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Incluir SKU</span>
          </button>

          {onOpenSaveModal && (
            <button
              onClick={onOpenSaveModal}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
              title="Salvar a conciliação do dia, registrar rankings e congelar"
            >
              <FolderDown className="w-3.5 h-3.5 text-indigo-100" />
              <span>Salvar & Congelar</span>
            </button>
          )}

          <button
            onClick={() => onOpenImportModal('020502')}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
            title="Importar novo arquivo 02.05.02 para atualizar posição"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Importar 02.05.02</span>
          </button>

          <button
            onClick={() => setIsRecontagemModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Abrir ficha de recontagem para o armazém"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ficha Recontagem</span>
            {selectedRecountIds.size > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                {selectedRecountIds.size}
              </span>
            )}
          </button>

          <button
            onClick={() => onOpenImportModal('021101')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
            title="Atualizar itens recontados com a base 02.11.01"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Recontagem</span> 02.11
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            title="Exportar planilha Excel completa"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {exportErrorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-xs text-rose-700 flex items-center justify-between">
          <span>{exportErrorMsg}</span>
          <button
            type="button"
            onClick={() => setExportErrorMsg(null)}
            className="font-bold hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {showManualAddPanel && (
        <MissingSkuRecoveryBanner
          searchTerm={searchTerm || '31766'}
          productsMap={productsMap}
          stockPositions={healedStockPositions}
          selectedDeposito={selectedDeposito}
          onAddStockItem={handleAddMissingStockItem}
          onOpenImportModal={() => onOpenImportModal('020502')}
        />
      )}

      {/* Live Financial & Volume Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">SKUs Exibidos</span>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
            {summary.totalItems}{' '}
            <span className="text-xs text-slate-400 font-normal">
              / {healedStockPositions.length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-blue-200/80 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-blue-700 font-semibold">Sistêmico (02.05.02)</span>
          <div
            className="text-base font-bold font-mono tabular-nums text-blue-800 mt-0.5 truncate"
            title={formatCurrency(summary.valorTotalEstoqueDisponivel)}
          >
            {formatCurrency(summary.valorTotalEstoqueDisponivel)}
          </div>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-emerald-700 font-semibold">Físico Inventariado</span>
          <div
            className="text-base font-bold font-mono tabular-nums text-emerald-800 mt-0.5 truncate"
            title={formatCurrency(summary.valorTotalEstoqueFisico)}
          >
            {formatCurrency(summary.valorTotalEstoqueFisico)}
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-rose-600 font-semibold">Prejuízo (Faltas)</span>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-rose-600 mt-0.5 truncate">
            -{formatCurrency(summary.totalPrejuizo)}
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-emerald-600 font-semibold">Sobras Físicas</span>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-600 mt-0.5 truncate">
            +{formatCurrency(summary.totalSobra)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Volume Diferença</span>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-800 mt-0.5">
            {formatHectoliters(Math.abs(summary.totalHl))}
          </div>
        </div>
      </div>

      {/* Gráfico Percentual de Itens com Falta, Sobras e Conciliados */}
      <ConciliacaoStatusChart
        totals={reconciled.totalsSemAjuste}
        mode="sem_ajuste"
        activeSelection={chartActiveSelection}
        onSelectCategory={handleSelectChartCategory}
      />

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar SKU específico (ex: 31766, 37450) ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Group and Sorting */}
          <div className="flex items-center space-x-2 text-xs">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos os Grupos</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
              <span className="text-[11px] text-slate-400 ml-1.5">Ordenar:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none py-1 px-1.5 cursor-pointer"
              >
                <option value="prejuizo">Maior Prejuízo</option>
                <option value="sobra">Maior Sobra</option>
                <option value="hl">Impacto em HL</option>
                <option value="produto">Cód. SKU</option>
                <option value="descricao">Descrição</option>
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title={sortAsc ? 'Ordem Crescente' : 'Ordem Decrescente'}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Divergence Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
          <button
            onClick={() => setDivergenceFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold font-mono tabular-nums transition cursor-pointer ${
              divergenceFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({filterCounts.all})
          </button>

          <button
            onClick={() => setDivergenceFilter('DIVERGENT')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
              divergenceFilter === 'DIVERGENT'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Divergências ({filterCounts.divergent})</span>
          </button>

          <button
            onClick={() => setDivergenceFilter('FALTAS')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
              divergenceFilter === 'FALTAS'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <TrendingDown className="w-3 h-3" />
            <span>Apenas Faltas ({filterCounts.faltas})</span>
          </button>

          <button
            onClick={() => setDivergenceFilter('SOBRAS')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
              divergenceFilter === 'SOBRAS'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Apenas Sobras ({filterCounts.sobras})</span>
          </button>

          <button
            onClick={() => setDivergenceFilter('OK')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
              divergenceFilter === 'OK'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Conciliados ({filterCounts.ok})</span>
          </button>

          <button
            onClick={() => setDivergenceFilter('RECOUNTED')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
              divergenceFilter === 'RECOUNTED'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Recontados 02.11 ({filterCounts.recounted})</span>
          </button>
        </div>
      </div>

      {/* Aviso Inteligente caso o SKU pesquisado esteja em outra categoria */}
      {autoRevealedOutsideFilter && effectiveRows.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            O filtro anterior não continha o item pesquisado (<strong>{searchTerm}</strong>) — exibindo automaticamente sua posição real:{' '}
            <strong>
              {sheetFaltas.length > 0
                ? 'EM FALTA'
                : sheetSobras.length > 0
                ? 'EM SOBRA'
                : '100% CONCILIADO (SEM DIVERGÊNCIA)'}
            </strong>
            .
          </div>
          <button
            type="button"
            onClick={() => setDivergenceFilter('ALL')}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer self-start sm:self-auto"
          >
            Mudar aba para Todos
          </button>
        </div>
      )}

      {/* Diagnóstico e Inclusão Rápida quando um SKU pesquisado (ex: 31766 ASSOLAN) está ausente da 02.05.02 */}
      {searchTerm.trim() !== '' && baseSearchAndGroupRows.length === 0 ? (
        <MissingSkuRecoveryBanner
          searchTerm={searchTerm}
          productsMap={productsMap}
          stockPositions={healedStockPositions}
          selectedDeposito={selectedDeposito}
          onAddStockItem={handleAddMissingStockItem}
          onOpenImportModal={() => onOpenImportModal('020502')}
        />
      ) : viewLayout === 'lado_a_lado' ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-5 min-w-0 w-full shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {sheetDisplaySection === 'faltas_only'
                    ? 'Lista Exclusiva de Faltas Físicas (02.05.02 vs Físico)'
                    : sheetDisplaySection === 'sobras_only'
                    ? 'Lista Exclusiva de Sobras Físicas (02.05.02 vs Físico)'
                    : sheetDisplaySection === 'conciliados_only'
                    ? 'Itens 100% Conciliados — Sem Divergência de Caixas (0 cx)'
                    : 'Análise de Conciliação: Faltas, Sobras e Itens Conciliados'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono tabular-nums font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  SEM AJUSTES · FALTAS ({sheetFaltas.length}) · SOBRAS ({sheetSobras.length}) · CONCILIADOS ({sheetConciliados.length})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Divergência física pura no <strong>{currentDepositoName}</strong> — 100% paritária com o modo Sem Ajustes do Dashboard & B.I.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => onToggleSubTab('padrao')}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer bg-rose-600 text-white shadow-xs"
                >
                  Sem Ajuste
                </button>
                <button
                  onClick={() => onToggleSubTab('ajustes')}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer text-slate-600 hover:text-slate-900"
                >
                  Com Ajustes
                </button>
              </div>

              <button
                onClick={() => setIsRecontagemModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                title="Maximizar tela e exportar imagem / imprimir ficha de recontagem"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
                <span>Maximizar / Exportar Imagem</span>
              </button>
            </div>
          </div>

          <RecontagemExportSheet
            exportFaltas={sheetFaltas}
            exportSobras={sheetSobras}
            exportConciliados={sheetConciliados}
            displaySection={sheetDisplaySection}
            isFilteredView={isFilteredActive}
            totalDisplayFaltas={displayTotalFaltas}
            totalDisplaySobras={displayTotalSobras}
            saldoFinalDisplay={displayTotalSobras - displayTotalFaltas}
            totalGeralPrejuizoFaltas={totalGeralPrejuizoFaltas}
            totalGeralValorSobras={totalGeralValorSobras}
            totalGeralSkusFaltas={totalGeralSkusFaltas}
            totalGeralSkusSobras={totalGeralSkusSobras}
            saldoFinalGeral={saldoFinalGeral}
            saldoFinalSkusGeral={saldoFinalSkusGeral}
            currentDepositoName={currentDepositoName}
            currentMode="sem_ajuste"
            selectedIds={selectedRecountIds}
            onToggleSelect={handleToggleRecountId}
            isExportTarget={false}
            showFiscalFisico={true}
            onUpdateFisico={handleUpdateFisico}
            onEditItem={(rankingItem) => {
              const found = stockPositions.find((s) => s.id === rankingItem.id);
              if (found) setActionModalItem(found);
            }}
          />
        </div>
      ) : (
        /* Main Reconciliation Table */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-w-0 w-full">
          <TopSyncedScrollContainer>
            <table className="w-full min-w-[1080px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Dep.</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 min-w-[220px]">Descrição do Produto</th>
                  <th className="py-3 px-2 text-center">Fator SKU</th>
                  <th className="py-3 px-3 text-right">Disponível (SKU)</th>
                  <th className="py-3 px-3 text-right">Inventário Físico (SKU)</th>
                  <th className="py-3 px-3 text-right">Diferença (SKU)</th>
                  <th className="py-3 px-3 text-right">Impacto Financeiro (R$)</th>
                  <th className="py-3 px-3 text-right">Impacto (HL)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Ajuste / Recontagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedStock.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500 text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                        <p className="font-medium text-slate-600">
                          Nenhum produto encontrado para o filtro selecionado.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedStock.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const isOk = item.diferencaSkus === 0;
                    const isFalta = item.diferencaSkus < 0;
                    const isSobra = item.diferencaSkus > 0;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 transition ${
                          isFalta ? 'bg-rose-50/20' : isSobra ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            {item.deposito}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-slate-900">
                          {item.produto}
                        </td>

                        <td className="py-2.5 px-3">
                          <div
                            className="font-semibold text-slate-800 truncate max-w-xs"
                            title={item.descricao}
                          >
                            {item.descricao}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                            <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] uppercase border border-slate-200">
                              {item.grupo}
                            </span>
                            <span>•</span>
                            <span>Unitário: {formatCurrency(item.valorUnitario)}</span>
                            {item.recontado && (
                              <>
                                <span>•</span>
                                <span className="text-purple-600 font-semibold flex items-center">
                                  <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Recontado
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-center font-mono tabular-nums text-slate-600">
                          {item.fatorSku}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-baseline justify-end space-x-1">
                            <span className="font-mono tabular-nums font-bold text-sm text-blue-700">
                              {item.disponivelSkus} cx
                            </span>
                            {item.disponivelLooseUnits > 0 && (
                              <span
                                className="text-[10px] text-slate-400 font-mono tabular-nums"
                                title="Unidades avulsas integradas ao saldo final"
                              >
                                ({item.disponivelLooseUnits} un)
                              </span>
                            )}
                          </div>
                          {(item.saldoNegativoDesconsiderado ||
                            item.disponivelTotalUnits < 0) && (
                            <span
                              className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 rounded mt-0.5 inline-block"
                              title="Saldo negativo do disponível desconsiderado"
                            >
                              Saldo Negativo
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end space-x-1">
                              <input
                                type="text"
                                value={editSkuInput}
                                onChange={(e) => setEditSkuInput(e.target.value)}
                                placeholder="ex: 16 ou 16/00"
                                className="w-20 bg-white text-right px-1.5 py-0.5 rounded border border-emerald-500 text-xs font-mono text-slate-900 focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(item)}
                                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                                title="Confirmar Contagem"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 transition cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-baseline justify-end space-x-1">
                              <span className="font-mono tabular-nums font-bold text-sm text-emerald-700">
                                {item.inventarioSkus} cx
                              </span>
                              {item.inventarioLooseUnits > 0 && (
                                <span
                                  className="text-[10px] text-slate-400 font-mono tabular-nums"
                                  title="Unidades avulsas integradas ao saldo final"
                                >
                                  ({item.inventarioLooseUnits} un)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                          {item.saldoNegativoDesconsiderado ||
                          item.disponivelTotalUnits < 0 ? (
                            <div>
                              <span
                                className="text-slate-400 font-normal text-xs"
                                title="Saldo disponível negativo - divergência zerada"
                              >
                                0 cx
                              </span>
                              <div className="text-[9px] text-amber-700 font-semibold">(Zerado)</div>
                            </div>
                          ) : isOk ? (
                            <span
                              className="text-emerald-700 font-bold text-sm"
                              title="100% Conciliado nos SKUs Fechados"
                            >
                              0 cx
                            </span>
                          ) : (
                            <div className="flex items-baseline justify-end space-x-1">
                              <span
                                className={`text-sm font-bold ${
                                  isFalta ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                                title="Divergência de SKUs fechados"
                              >
                                {isFalta ? `${item.diferencaSkus} cx` : `+${item.diferencaSkus} cx`}
                              </span>
                              {item.diferencaLooseUnits > 0 && (
                                <span
                                  className={`text-[10px] font-mono ${
                                    isFalta ? 'text-rose-400' : 'text-emerald-400'
                                  }`}
                                >
                                  ({item.diferencaLooseUnits} un)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                          {item.saldoNegativoDesconsiderado ||
                          item.disponivelTotalUnits < 0 ||
                          isOk ? (
                            <span className="text-slate-400 font-normal text-xs">R$ 0,00</span>
                          ) : (
                            <span
                              className={
                                isFalta
                                  ? 'text-rose-600'
                                  : isSobra
                                  ? 'text-emerald-600'
                                  : 'text-slate-400'
                              }
                            >
                              {isFalta
                                ? `-${formatCurrency(item.prejuizoFinanceiro)}`
                                : isSobra
                                ? `+${formatCurrency(item.sobraFinanceira)}`
                                : 'R$ 0,00'}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 text-[11px]">
                          {item.saldoNegativoDesconsiderado ||
                          item.disponivelTotalUnits < 0 ||
                          isOk ? (
                            <span className="text-slate-300">-</span>
                          ) : item.impactoHl !== 0 ? (
                            <span>
                              {item.impactoHl > 0 ? '+' : ''}
                              {formatHectoliters(item.impactoHl)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {item.saldoNegativoDesconsiderado ||
                          item.disponivelTotalUnits < 0 ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              ZERADO
                            </span>
                          ) : isOk ? (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ CONCILIADO
                            </span>
                          ) : isFalta ? (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              FALTA
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              SOBRA
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center flex items-center justify-center gap-1">
                          {!isEditing && (
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              title="Digitar Recontagem Físico (Formato X/YY)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setActionModalItem(item)}
                            className="p-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 transition cursor-pointer"
                            title="Opções avançadas: Trocar SKU, Editar Dados ou Excluir Item"
                          >
                            ⚙️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TopSyncedScrollContainer>

          <div className="p-3 bg-slate-50 border-t border-slate-200 rounded-b-xl text-slate-600 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              Exibindo <strong className="text-slate-800">{sortedStock.length}</strong> de{' '}
              <strong className="text-slate-800">{healedStockPositions.length}</strong> itens no
              depósito
            </span>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="inline-block w-2 h-2 rounded-xs bg-rose-500" />
              <span>Falta ({filterCounts.faltas})</span>
              <span className="inline-block w-2 h-2 rounded-xs bg-emerald-500 ml-2" />
              <span>Sobra ({filterCounts.sobras})</span>
              <span className="inline-block w-2 h-2 rounded-xs bg-blue-500 ml-2" />
              <span>Conciliado ({filterCounts.ok})</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Maximizado de Recontagem / Impressão / Exportar Imagem */}
      <RecontagemRankingsModal
        isOpen={isRecontagemModalOpen}
        onClose={() => setIsRecontagemModalOpen(false)}
        allRankingFaltas={allRankingFaltas}
        allRankingSobras={allRankingSobras}
        selectedDeposito={selectedDeposito}
        rankingAdjustmentMode="sem_ajuste"
        onToggleAdjustmentMode={(mode) =>
          onToggleSubTab(mode === 'com_ajuste' ? 'ajustes' : 'padrao')
        }
        onSelectRecountItem={(id) => handleToggleRecountId(id)}
        selectedRecountIds={selectedRecountIds}
        stockPositions={healedStockPositions}
        quebras={quebras}
        vales={vales}
        trocas={trocas}
        faltasMapeadas={faltasMapeadas}
        weeklyBillingStatus={weeklyBillingStatus}
        showFiscalFisico={true}
        onUpdateFisico={handleUpdateFisico}
      />

      {/* Modal de Edição, Troca ou Exclusão de Item */}
      <EditConciliacaoItemModal
        isOpen={!!actionModalItem}
        onClose={() => setActionModalItem(null)}
        item={actionModalItem}
        productsMap={productsMap}
        onSaveEdit={handleSaveItemEdit}
        onSwapItem={handleSwapItem}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  );
};
