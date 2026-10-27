import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Info,
  Eye,
  FolderDown,
  Camera,
  Maximize2,
  PlusCircle,
  Scale,
  Table2,
  X,
} from 'lucide-react';
import {
  StockPositionItem,
  DepositoId,
  ProductMaster,
  QuebraItem,
  ValeItem,
  TrocaItem,
  FaltaMapeadaItem,
  ItemConciliacaoAjustada,
  ViewTab,
} from '../types';
import {
  formatCurrency,
  formatHectoliters,
  formatNumber,
  calcularDivergencia,
  normalizeSku,
} from '../utils/parsers';
import { DEPOSITOS } from '../data/initialData';
import { ItemDesviosModal } from './ItemDesviosModal';
import { exportConciliacaoExcel } from '../utils/excelReconciliationExport';
import { RecontagemRankingsModal, DashboardRankingItem } from './RecontagemRankingsModal';
import { RecontagemExportSheet, SheetDisplaySection } from './RecontagemExportSheet';
import { EditConciliacaoItemModal } from './EditConciliacaoItemModal';
import { TopSyncedScrollContainer } from './TopSyncedScrollContainer';
import { reconcileAllStock, ReconciledRow } from '../utils/reconciliationEngine';
import { ConciliacaoStatusChart, StatusChartSelection } from './ConciliacaoStatusChart';
import { MissingSkuRecoveryBanner } from './MissingSkuRecoveryBanner';

interface ConciliacaoAjustesViewProps {
  stockPositions: StockPositionItem[];
  setStockPositions?: React.Dispatch<React.SetStateAction<StockPositionItem[]>>;
  quebras: QuebraItem[];
  vales: ValeItem[];
  trocas: TrocaItem[];
  faltasMapeadas: FaltaMapeadaItem[];
  selectedDeposito: DepositoId | 'ALL';
  setSelectedDeposito: (dep: DepositoId | 'ALL') => void;
  productsMap: Map<string, ProductMaster>;
  isRecountApplied: boolean;
  onNavigateTab: (tab: ViewTab) => void;
  onToggleSubTab?: (mode: 'padrao' | 'ajustes') => void;
  onOpenImportModal: (
    initialFile?: '020502' | '021101' | 'quebras' | 'vales' | 'trocas' | 'faltas'
  ) => void;
  onOpenSaveModal?: () => void;
  onOpenManualModal?: (type?: 'quebra' | 'vale' | 'troca' | 'falta') => void;
  weeklyBillingStatus?: Record<string, 'PENDENTE' | 'OK'>;
}

type FilterStatusAjustado =
  | 'ALL'
  | 'DIVERGENTES'
  | 'COM_DESVIOS'
  | 'FALTAS_RESIDUAIS'
  | 'SOBRAS_RESIDUAIS'
  | 'CONCILIADOS';

export const ConciliacaoAjustesView: React.FC<ConciliacaoAjustesViewProps> = ({
  stockPositions,
  setStockPositions,
  quebras,
  vales,
  trocas,
  faltasMapeadas,
  selectedDeposito,
  setSelectedDeposito,
  productsMap,
  onNavigateTab,
  onToggleSubTab,
  onOpenImportModal,
  onOpenSaveModal,
  onOpenManualModal,
  weeklyBillingStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatusAjustado>('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [sortField, setSortField] = useState<
    'prejuizo' | 'sobra' | 'desvios' | 'produto' | 'descricao' | 'hl'
  >('prejuizo');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedItemForOverview, setSelectedItemForOverview] =
    useState<ItemConciliacaoAjustada | null>(null);
  const [isRecontagemModalOpen, setIsRecontagemModalOpen] = useState(false);
  const [selectedRecountIds, setSelectedRecountIds] = useState<Set<string>>(new Set());
  const [actionModalItem, setActionModalItem] = useState<StockPositionItem | null>(null);
  const [viewLayout, setViewLayout] = useState<'lado_a_lado' | 'tabela'>('lado_a_lado');
  const [showManualAddSkuPanel, setShowManualAddSkuPanel] = useState(false);
  const [exportErrorMsg, setExportErrorMsg] = useState<string | null>(null);

  // Motor Único Canônico de Conciliação (100% paridade matemática com Dashboard & B.I)
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

  const adjustedItems = reconciled.adjustedItems;
  const allRankingFaltas = reconciled.rankingFaltasComAjuste;
  const allRankingSobras = reconciled.rankingSobrasComAjuste;

  const currentDepositoName = useMemo(() => {
    if (selectedDeposito === 'ALL') return 'Todos os Depósitos';
    const dep = DEPOSITOS.find((d) => d.id === selectedDeposito);
    return dep ? dep.nome : `Depósito ${selectedDeposito}`;
  }, [selectedDeposito]);

  const totalGeralPrejuizoFaltas = reconciled.totalsComAjuste.totalFaltasValor;
  const totalGeralValorSobras = reconciled.totalsComAjuste.totalSobrasValor;
  const totalGeralSkusFaltas = reconciled.totalsComAjuste.totalFaltasSkus;
  const totalGeralSkusSobras = reconciled.totalsComAjuste.totalSobrasSkus;
  const saldoFinalGeral = reconciled.totalsComAjuste.saldoLiquidoValor;
  const saldoFinalSkusGeral = reconciled.totalsComAjuste.saldoLiquidoSkus;

  const filterCounts = useMemo(() => {
    let faltas = 0;
    let sobras = 0;
    let conciliados = 0;
    let comDesvios = 0;
    reconciled.rows.forEach((r) => {
      const a = r.adjustedItem;
      if (a.desviosUnits > 0) comDesvios++;
      if (r.isIgnoredNegative || a.statusAjustado === 'CONCILIADO') {
        conciliados++;
      } else if (a.statusAjustado === 'FALTA_RESIDUAL') {
        faltas++;
      } else if (a.statusAjustado === 'SOBRA_RESIDUAL') {
        sobras++;
      }
    });
    return {
      all: adjustedItems.length,
      divergentes: faltas + sobras,
      faltas,
      sobras,
      conciliados,
      comDesvios,
    };
  }, [reconciled.rows, adjustedItems.length]);

  const handleToggleRecountId = (id: string) => {
    setSelectedRecountIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddMissingStockItem = (newItem: StockPositionItem) => {
    if (!setStockPositions) return;
    setStockPositions((prev) => {
      const existsIdx = prev.findIndex((p) => p.id === newItem.id);
      if (existsIdx >= 0) {
        const clone = [...prev];
        clone[existsIdx] = newItem;
        return clone;
      }
      return [...prev, newItem];
    });
    setShowManualAddSkuPanel(false);
  };

  const handleUpdateFisico = (itemId: string, newFisicoRaw: string) => {
    if (!setStockPositions) return;
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
    if (!setStockPositions) return;
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
    if (!setStockPositions) return;
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
    if (!setStockPositions) return;
    setStockPositions((prev) => prev.filter((p) => p.id !== itemId));
    setActionModalItem(null);
  };

  // Busca inteligente: prioriza igualdade exata de SKU numérico quando existente
  const baseSearchAndGroupRows = useMemo(() => {
    const rawTerm = searchTerm.trim();
    const lowerTerm = rawTerm.toLowerCase();
    const isNumericQuery = /^\d+$/.test(rawTerm);
    const cleanNumericTerm = isNumericQuery ? normalizeSku(rawTerm) : '';

    const hasExactSkuMatch =
      isNumericQuery &&
      reconciled.rows.some(
        (r) =>
          (groupFilter === 'ALL' || r.adjustedItem.grupo === groupFilter) &&
          normalizeSku(r.adjustedItem.produto) === cleanNumericTerm
      );

    return reconciled.rows.filter((r) => {
      const item = r.adjustedItem;
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

  const matchesStatusFilter = (r: ReconciledRow, filter: FilterStatusAjustado): boolean => {
    const item = r.adjustedItem;
    const isOk = r.isIgnoredNegative || item.statusAjustado === 'CONCILIADO';
    if (filter === 'COM_DESVIOS') return item.desviosUnits > 0;
    if (filter === 'DIVERGENTES') return !isOk;
    if (filter === 'FALTAS_RESIDUAIS') return !isOk && item.statusAjustado === 'FALTA_RESIDUAL';
    if (filter === 'SOBRAS_RESIDUAIS') return !isOk && item.statusAjustado === 'SOBRA_RESIDUAL';
    if (filter === 'CONCILIADOS') return isOk;
    return true;
  };

  const { effectiveRows, autoRevealedOutsideFilter } = useMemo(() => {
    const strictRows = baseSearchAndGroupRows.filter((r) =>
      matchesStatusFilter(r, statusFilter)
    );
    if (
      searchTerm.trim() !== '' &&
      strictRows.length === 0 &&
      baseSearchAndGroupRows.length > 0 &&
      statusFilter !== 'ALL'
    ) {
      return { effectiveRows: baseSearchAndGroupRows, autoRevealedOutsideFilter: true };
    }
    return { effectiveRows: strictRows, autoRevealedOutsideFilter: false };
  }, [baseSearchAndGroupRows, statusFilter, searchTerm]);

  const sortAdjustedRows = (list: ReconciledRow[], defaultMode?: 'falta' | 'sobra' | 'ok') => {
    return [...list].sort((a, b) => {
      const ia = a.adjustedItem;
      const ib = b.adjustedItem;
      let comp = 0;

      if (sortField === 'produto') {
        comp = parseInt(ia.produto, 10) - parseInt(ib.produto, 10);
      } else if (sortField === 'descricao') {
        comp = ia.descricao.localeCompare(ib.descricao);
      } else if (sortField === 'desvios') {
        comp = ib.desviosUnits - ia.desviosUnits;
      } else if (sortField === 'hl') {
        comp = Math.abs(ib.impactoHlResidual) - Math.abs(ia.impactoHlResidual);
      } else if (sortField === 'sobra' || defaultMode === 'sobra') {
        comp = ib.impactoFinanceiroResidual - ia.impactoFinanceiroResidual;
        if (comp === 0) {
          comp = Math.abs(ib.divergenciaResidualUnits) - Math.abs(ia.divergenciaResidualUnits);
        }
      } else if (defaultMode === 'ok') {
        comp = ib.valorFiscal - ia.valorFiscal;
        if (comp === 0) comp = parseInt(ia.produto, 10) - parseInt(ib.produto, 10);
      } else {
        comp = ia.impactoFinanceiroResidual - ib.impactoFinanceiroResidual;
        if (comp === 0) {
          comp = Math.abs(ib.divergenciaResidualUnits) - Math.abs(ia.divergenciaResidualUnits);
        }
      }

      return sortAsc ? -comp : comp;
    });
  };

  const sortedList = useMemo(() => {
    return sortAdjustedRows(effectiveRows).map((r) => r.adjustedItem);
  }, [effectiveRows, sortField, sortAsc]);

  const filteredList = useMemo(() => {
    return effectiveRows.map((r) => r.adjustedItem);
  }, [effectiveRows]);

  const {
    sheetFaltas,
    sheetSobras,
    sheetConciliados,
    sheetDisplaySection,
    displayTotalFaltas,
    displayTotalSobras,
  } = useMemo(() => {
    const faltaRows = effectiveRows.filter(
      (r) => !r.isIgnoredNegative && r.adjustedItem.statusAjustado === 'FALTA_RESIDUAL'
    );
    const sobraRows = effectiveRows.filter(
      (r) => !r.isIgnoredNegative && r.adjustedItem.statusAjustado === 'SOBRA_RESIDUAL'
    );
    const okRows = effectiveRows.filter(
      (r) => r.isIgnoredNegative || r.adjustedItem.statusAjustado === 'CONCILIADO'
    );

    const faltasSorted: DashboardRankingItem[] = sortAdjustedRows(
      faltaRows,
      sortField === 'prejuizo' ? 'falta' : undefined
    ).map((r) => r.rankingComAjuste);

    const sobrasSorted: DashboardRankingItem[] = sortAdjustedRows(
      sobraRows,
      sortField === 'prejuizo' ? 'sobra' : undefined
    ).map((r) => r.rankingComAjuste);

    const conciliadosSorted: DashboardRankingItem[] = sortAdjustedRows(
      okRows,
      sortField === 'prejuizo' ? 'ok' : undefined
    ).map((r) => r.rankingComAjuste);

    const hasFaltas = faltasSorted.length > 0;
    const hasSobras = sobrasSorted.length > 0;
    const hasOk = conciliadosSorted.length > 0;

    let section: SheetDisplaySection = 'both';

    if (searchTerm.trim() !== '' || autoRevealedOutsideFilter) {
      if (hasFaltas && !hasSobras && !hasOk) section = 'faltas_only';
      else if (hasSobras && !hasFaltas && !hasOk) section = 'sobras_only';
      else if (hasOk && !hasFaltas && !hasSobras) section = 'conciliados_only';
      else if (hasFaltas && hasSobras && !hasOk) section = 'both';
      else section = 'all_three';
    } else {
      if (statusFilter === 'FALTAS_RESIDUAIS') section = 'faltas_only';
      else if (statusFilter === 'SOBRAS_RESIDUAIS') section = 'sobras_only';
      else if (statusFilter === 'CONCILIADOS') section = 'conciliados_only';
      else if (statusFilter === 'DIVERGENTES') section = 'both';
      else if (statusFilter === 'COM_DESVIOS') {
        if (hasFaltas && !hasSobras && !hasOk) section = 'faltas_only';
        else if (hasSobras && !hasFaltas && !hasOk) section = 'sobras_only';
        else if (hasOk && !hasFaltas && !hasSobras) section = 'conciliados_only';
        else if (!hasOk) section = 'both';
        else section = 'all_three';
      } else {
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
  }, [effectiveRows, statusFilter, searchTerm, sortField, sortAsc, autoRevealedOutsideFilter]);

  const isFilteredActive =
    searchTerm.trim() !== '' || groupFilter !== 'ALL' || statusFilter !== 'ALL';

  // KPI Totals
  const kpis = useMemo(() => {
    const isUnfiltered = !isFilteredActive;

    if (isUnfiltered) {
      const ca = reconciled.totalsComAjuste;
      const sa = reconciled.totalsSemAjuste;
      const dv = reconciled.desviosSummary;

      const taxaAmortizacaoGlobal =
        sa.totalFaltasValor > 0
          ? Math.min(100, (dv.totalValorEfetivamenteAmortizado / sa.totalFaltasValor) * 100)
          : 100;

      return {
        totalItens: ca.totalItens,
        totalFiscalValor: ca.valorTotalFiscal,
        totalFisicoValor: ca.valorTotalFisico,
        totalDesviosValor: dv.totalDesviosValor,
        totalDesviosUnits: adjustedItems.reduce((acc, i) => acc + i.desviosUnits, 0),
        totalFinalValor: ca.valorTotalFinal,
        totalPrejuizoResidual: ca.totalFaltasValor,
        totalSobraResidual: ca.totalSobrasValor,
        saldoLiquidoResidual: ca.saldoLiquidoValor,
        totalHlResidual: ca.saldoLiquidoHl,
        countConciliados: ca.totalItensAcurados,
        countFaltas: ca.totalItensComFalta,
        countSobras: ca.totalItensComSobra,
        countComDesvios: adjustedItems.filter((i) => i.desviosUnits > 0).length,
        acuracidadeAjustada: ca.acuracidadePct,

        totalPrejuizoInicial: sa.totalFaltasValor,
        totalSobraInicial: sa.totalSobrasValor,
        totalValorAmortizado: dv.totalValorEfetivamenteAmortizado,
        totalSkusAmortizados: dv.totalSkusEfetivamenteAmortizados,
        countFaltasIniciais: sa.totalItensComFalta,
        taxaAmortizacaoGlobal,
      };
    }

    let totalFiscalValor = 0;
    let totalFisicoValor = 0;
    let totalDesviosValor = 0;
    let totalFinalValor = 0;
    let totalPrejuizoResidual = 0;
    let totalSobraResidual = 0;
    let totalHlResidual = 0;
    let countConciliados = 0;
    let countFaltas = 0;
    let countSobras = 0;
    let countComDesvios = 0;
    let totalDesviosUnits = 0;
    let totalPrejuizoInicial = 0;
    let totalSobraInicial = 0;
    let totalValorAmortizado = 0;
    let totalSkusAmortizados = 0;
    let countFaltasIniciais = 0;
    let countValidos = 0;

    filteredList.forEach((item) => {
      if (item.fiscalTotalUnits < 0) return;
      countValidos++;

      totalFiscalValor += item.valorFiscal;
      totalFisicoValor += item.valorFisico;
      totalDesviosValor += item.valorDesvios;
      totalFinalValor += item.valorFinal;
      totalDesviosUnits += item.desviosUnits;

      totalPrejuizoInicial += item.prejuizoInicial || 0;
      totalSobraInicial += item.sobraInicial || 0;
      totalValorAmortizado += item.valorAmortizado || 0;
      totalSkusAmortizados += item.skusAmortizados || 0;

      if ((item.prejuizoInicial || 0) > 0) countFaltasIniciais++;
      if (item.desviosUnits > 0) countComDesvios++;

      if (item.statusAjustado === 'FALTA_RESIDUAL') {
        totalPrejuizoResidual += Math.abs(item.impactoFinanceiroResidual);
        countFaltas++;
      } else if (item.statusAjustado === 'SOBRA_RESIDUAL') {
        totalSobraResidual += item.impactoFinanceiroResidual;
        countSobras++;
      } else {
        countConciliados++;
      }

      totalHlResidual += item.impactoHlResidual;
    });

    const acuracidadeAjustada =
      countValidos > 0 ? Math.max(0, Math.min(100, (countConciliados / countValidos) * 100)) : 100;

    const taxaAmortizacaoGlobal =
      totalPrejuizoInicial > 0
        ? Math.min(100, (totalValorAmortizado / totalPrejuizoInicial) * 100)
        : 100;

    return {
      totalItens: filteredList.length,
      totalFiscalValor,
      totalFisicoValor,
      totalDesviosValor,
      totalDesviosUnits,
      totalFinalValor,
      totalPrejuizoResidual,
      totalSobraResidual,
      saldoLiquidoResidual: totalSobraResidual - totalPrejuizoResidual,
      totalHlResidual,
      countConciliados,
      countFaltas,
      countSobras,
      countComDesvios,
      acuracidadeAjustada,

      totalPrejuizoInicial,
      totalSobraInicial,
      totalValorAmortizado,
      totalSkusAmortizados,
      countFaltasIniciais,
      taxaAmortizacaoGlobal,
    };
  }, [filteredList, adjustedItems, reconciled, isFilteredActive]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    reconciled.healedStock.forEach((s) => {
      if (s.grupo) set.add(s.grupo);
    });
    return Array.from(set).sort();
  }, [reconciled.healedStock]);

  const chartActiveSelection: StatusChartSelection =
    statusFilter === 'FALTAS_RESIDUAIS'
      ? 'FALTAS'
      : statusFilter === 'SOBRAS_RESIDUAIS'
      ? 'SOBRAS'
      : statusFilter === 'CONCILIADOS'
      ? 'CONCILIADOS'
      : 'ALL';

  const handleSelectChartCategory = (cat: StatusChartSelection) => {
    if (cat === 'FALTAS') setStatusFilter('FALTAS_RESIDUAIS');
    else if (cat === 'SOBRAS') setStatusFilter('SOBRAS_RESIDUAIS');
    else if (cat === 'CONCILIADOS') setStatusFilter('CONCILIADOS');
    else setStatusFilter('ALL');
  };

  const handleExportExcel = async () => {
    try {
      setExportErrorMsg(null);
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const filename = `Conciliacao_Estoque_Ambev_Com_Ajustes_Dep_${selectedDeposito}_${dateStr}_${timeStr}.xlsx`;

      await exportConciliacaoExcel({
        stockPositions: reconciled.healedStock,
        quebras,
        vales,
        trocas,
        faltasMapeadas,
        adjustedItems,
        selectedDeposito,
        filename,
      });
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
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
              onClick={() => {
                if (onToggleSubTab) onToggleSubTab('padrao');
                else onNavigateTab('conciliacao');
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>Sem Ajustes (Padrão 02.05.02 vs Físico)</span>
            </button>

            <button className="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 bg-teal-600 text-white shadow-xs cursor-pointer">
              <Sparkles className="w-4 h-4 text-teal-100" />
              <span>Com Ajustes (Físico + Desvios Equalizados)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Depósito Ativo:</span>
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['ALL', '01', '02', '03', '05', '06', '31'] as const).map((dep) => (
              <button
                key={dep}
                onClick={() => setSelectedDeposito(dep)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  selectedDeposito === dep
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dep === 'ALL' ? 'Todos' : dep === '31' ? '31 (PNC)' : dep}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-600" />
              Conciliação com Ajustes Equalizada
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono tabular-nums bg-slate-100 text-slate-700 border border-slate-300">
              {kpis.totalItens} SKUs Exibidos
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">
            Conciliação do Fiscal (02.05.02) x Soma do Físico com Desvios Congelados
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl mt-1">
            Somamos ao <strong>Inventário Físico</strong> todas as quantidades pendentes em{' '}
            <strong>Quebras</strong>, <strong>Vales de Rota</strong>, <strong>Trocas</strong> e{' '}
            <strong>Faltas Mapeadas</strong>, apurando a verdadeira divergência residual por SKU.
          </p>
        </div>

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
              <span>Tabela com Ajustes</span>
            </button>
          </div>

          {setStockPositions && (
            <button
              type="button"
              onClick={() => setShowManualAddSkuPanel((v) => !v)}
              className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              title="Incluir um SKU ausente na base 02.05.02 (ex: 31766 ASSOLAN)"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>+ Incluir SKU</span>
            </button>
          )}

          {onOpenManualModal && (
            <button
              onClick={() => onOpenManualModal('quebra')}
              className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
              title="Inserir lançamento manual de Quebra, Vale, Troca ou Falta"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>+ Inserir Desvio</span>
            </button>
          )}

          {onOpenSaveModal && (
            <button
              onClick={onOpenSaveModal}
              className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
            >
              <FolderDown className="w-4 h-4 text-indigo-100" />
              <span>Salvar & Congelar</span>
            </button>
          )}

          <button
            onClick={() => setIsRecontagemModalOpen(true)}
            className="px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Ficha Recontagem</span>
            {selectedRecountIds.size > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                {selectedRecountIds.size}
              </span>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold shadow-xs transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
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

      {showManualAddSkuPanel && setStockPositions && (
        <MissingSkuRecoveryBanner
          searchTerm={searchTerm || '31766'}
          productsMap={productsMap}
          stockPositions={reconciled.healedStock}
          selectedDeposito={selectedDeposito}
          onAddStockItem={handleAddMissingStockItem}
          onOpenImportModal={() => onOpenImportModal('020502')}
        />
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            1. Sistêmico (02.05.02)
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 font-mono tabular-nums mt-1 truncate">
            {formatCurrency(kpis.totalFiscalValor)}
          </div>
        </div>

        <div className="bg-white border border-blue-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            2. Estoque Físico
          </div>
          <div className="text-base sm:text-lg font-bold text-blue-800 font-mono tabular-nums mt-1 truncate">
            {formatCurrency(kpis.totalFisicoValor)}
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            3. (+) Amortizações
          </div>
          <div className="text-base sm:text-lg font-bold text-amber-700 font-mono tabular-nums mt-1 truncate">
            +{formatCurrency(kpis.totalDesviosValor)}
          </div>
        </div>

        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
            4. Faltas (Com Ajuste)
          </div>
          <div className="text-base sm:text-lg font-bold text-rose-600 font-mono tabular-nums mt-1 truncate">
            -{formatCurrency(kpis.totalPrejuizoResidual)}
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            5. Sobras (Com Ajuste)
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono tabular-nums mt-1 truncate">
            +{formatCurrency(kpis.totalSobraResidual)}
          </div>
        </div>

        <div className="bg-white border border-purple-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center justify-between">
            <span>6. Saldo Final</span>
            <span className="font-mono tabular-nums text-[10px] text-emerald-700">
              {formatNumber(kpis.acuracidadeAjustada, 1)}% acur.
            </span>
          </div>
          <div
            className={`text-base sm:text-lg font-bold font-mono tabular-nums mt-1 truncate ${
              kpis.saldoLiquidoResidual >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {kpis.saldoLiquidoResidual >= 0 ? '+' : ''}
            {formatCurrency(kpis.saldoLiquidoResidual)}
          </div>
        </div>
      </div>

      {/* PAINEL EXECUTIVO DE AMORTIZAÇÃO CONTÁBIL */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Auditoria de Amortização de Perdas & Impacto no Saldo Final</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                  PROMAX AMBEV
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Demonstrativo analítico de como as quantidades e valores dos desvios operacionais amortizam o saldo final contábil.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Taxa de Equalização
              </span>
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                {kpis.taxaAmortizacaoGlobal.toFixed(1)}%
              </span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 font-mono tabular-nums text-xs font-bold text-emerald-300">
              {kpis.countConciliados}/{kpis.totalItens}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                1. Falta Física Inicial
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                Sem Ajustes
              </span>
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-rose-400 my-1">
              -{formatCurrency(kpis.totalPrejuizoInicial)}
            </div>
            <span className="text-[10px] text-slate-400">
              Identificado em <strong>{kpis.countFaltasIniciais}</strong> SKUs com falta física
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                2. (-) Amortizado por Desvios
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Equalização
              </span>
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-amber-400 my-1">
              +{formatCurrency(kpis.totalValorAmortizado)}
            </div>
            <span className="text-[10px] text-slate-400">
              <strong>{kpis.totalSkusAmortizados}</strong> caixas amortizadas via desvios pendentes
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                3. (=) Prejuízo Residual
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                Com Ajustes
              </span>
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-white my-1">
              {kpis.totalPrejuizoResidual > 0
                ? `-${formatCurrency(kpis.totalPrejuizoResidual)}`
                : 'R$ 0,00'}
            </div>
            <span className="text-[10px] text-slate-400">
              Restam <strong>{kpis.countFaltas}</strong> SKUs com falta residual
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                4. Saldo Final Real
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Físico + Desvios
              </span>
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-purple-300 my-1">
              {formatCurrency(kpis.totalFinalValor)}
            </div>
            <span className="text-[10px] text-slate-400">
              Fiscal: {formatCurrency(kpis.totalFiscalValor)} · Dif Líquida:{' '}
              {formatCurrency(kpis.saldoLiquidoResidual)}
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico Percentual de Itens com Falta, Sobras e Equalizados */}
      <ConciliacaoStatusChart
        totals={reconciled.totalsComAjuste}
        mode="com_ajuste"
        activeSelection={chartActiveSelection}
        onSelectCategory={handleSelectChartCategory}
      />

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar SKU específico (ex: 31766, 37450) ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white placeholder-slate-400"
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

          {/* Group & Sort */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
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
                <option value="desvios">Desvios Congelados</option>
                <option value="hl">Impacto em HL</option>
                <option value="produto">Cód. SKU</option>
                <option value="descricao">Descrição</option>
              </select>
              <button
                type="button"
                onClick={() => setSortAsc(!sortAsc)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title={sortAsc ? 'Ordem Crescente' : 'Ordem Decrescente'}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono tabular-nums transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todos ({filterCounts.all})
          </button>

          <button
            onClick={() => setStatusFilter('DIVERGENTES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer ${
              statusFilter === 'DIVERGENTES'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Divergências ({filterCounts.divergentes})</span>
          </button>

          <button
            onClick={() => setStatusFilter('FALTAS_RESIDUAIS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer ${
              statusFilter === 'FALTAS_RESIDUAIS'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Apenas Faltas ({filterCounts.faltas})</span>
          </button>

          <button
            onClick={() => setStatusFilter('SOBRAS_RESIDUAIS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer ${
              statusFilter === 'SOBRAS_RESIDUAIS'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Apenas Sobras ({filterCounts.sobras})</span>
          </button>

          <button
            onClick={() => setStatusFilter('CONCILIADOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer ${
              statusFilter === 'CONCILIADOS'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Equalizados ({filterCounts.conciliados})</span>
          </button>

          <button
            onClick={() => setStatusFilter('COM_DESVIOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer ${
              statusFilter === 'COM_DESVIOS'
                ? 'bg-teal-700 text-white'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <span>Com Desvios Congelados ({filterCounts.comDesvios})</span>
          </button>
        </div>
      </div>

      {/* Aviso Inteligente caso o SKU pesquisado pertença a outro status */}
      {autoRevealedOutsideFilter && effectiveRows.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            O filtro anterior não continha o item pesquisado (<strong>{searchTerm}</strong>) — exibindo automaticamente sua posição real:{' '}
            <strong>
              {sheetFaltas.length > 0
                ? 'EM FALTA RESIDUAL'
                : sheetSobras.length > 0
                ? 'EM SOBRA RESIDUAL'
                : '100% EQUALIZADO / CONCILIADO'}
            </strong>
            .
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer self-start sm:self-auto"
          >
            Mudar aba para Todos
          </button>
        </div>
      )}

      {/* Diagnóstico e Inclusão Rápida quando SKU pesquisado (ex: 31766 ASSOLAN) está ausente da 02.05.02 */}
      {searchTerm.trim() !== '' && baseSearchAndGroupRows.length === 0 && setStockPositions ? (
        <MissingSkuRecoveryBanner
          searchTerm={searchTerm}
          productsMap={productsMap}
          stockPositions={reconciled.healedStock}
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
                    ? 'Lista Exclusiva de Faltas Residuais (Com Ajustes)'
                    : sheetDisplaySection === 'sobras_only'
                    ? 'Lista Exclusiva de Sobras Residuais (Com Ajustes)'
                    : sheetDisplaySection === 'conciliados_only'
                    ? 'Itens 100% Equalizados — Sem Divergência Residual (0 cx)'
                    : 'Análise Equalizada: Faltas Residuais, Sobras e Itens Equalizados'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono tabular-nums font-bold bg-teal-50 text-teal-800 border border-teal-300">
                  COM AJUSTES · FALTAS ({sheetFaltas.length}) · SOBRAS ({sheetSobras.length}) · EQUALIZADOS ({sheetConciliados.length})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Divergência equalizada (Físico + Desvios Pendentes vs 02.05.02) no{' '}
                <strong>{currentDepositoName}</strong> — 100% paritária com o Dashboard & B.I.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onToggleSubTab && (
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => onToggleSubTab('padrao')}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer text-slate-600 hover:text-slate-900"
                  >
                    Sem Ajuste
                  </button>
                  <button
                    onClick={() => onToggleSubTab('ajustes')}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer bg-teal-600 text-white shadow-xs"
                  >
                    Com Ajustes
                  </button>
                </div>
              )}

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
            currentMode="com_ajuste"
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
        /* Main Table: Resumo com Ajustes */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs min-w-0 w-full">
          <TopSyncedScrollContainer>
            <table className="w-full min-w-[1080px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  <th className="py-3 px-3 w-12 text-center">Dep.</th>
                  <th
                    onClick={() => {
                      if (sortField === 'produto') setSortAsc(!sortAsc);
                      else {
                        setSortField('produto');
                        setSortAsc(false);
                      }
                    }}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Código</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      if (sortField === 'descricao') setSortAsc(!sortAsc);
                      else {
                        setSortField('descricao');
                        setSortAsc(false);
                      }
                    }}
                    className="py-3 px-4 min-w-[260px] cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Descrição do Produto</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <span>Qtd Fiscal (02.05.02)</span>
                  </th>
                  <th
                    onClick={() => {
                      if (sortField === 'desvios') setSortAsc(!sortAsc);
                      else {
                        setSortField('desvios');
                        setSortAsc(false);
                      }
                    }}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-amber-100/50 bg-amber-50/40 text-amber-800 transition"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>(+) Desvios Congelados</span>
                      <ArrowUpDown className="w-3 h-3 text-amber-600" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <span>Conciliação Física</span>
                  </th>
                  <th className="py-3 px-3 text-right bg-teal-50/40 text-teal-800 font-semibold">
                    <span>(=) Físico + Desvios</span>
                  </th>
                  <th
                    onClick={() => {
                      if (sortField === 'prejuizo') setSortAsc(!sortAsc);
                      else {
                        setSortField('prejuizo');
                        setSortAsc(false);
                      }
                    }}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Divergência Residual</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <span>Valoração (R$)</span>
                  </th>
                  <th
                    onClick={() => {
                      if (sortField === 'hl') setSortAsc(!sortAsc);
                      else {
                        setSortField('hl');
                        setSortAsc(false);
                      }
                    }}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Valoração (HL)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-24">Overview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {sortedList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-500">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">
                        Nenhum produto localizado com estes filtros
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Tente ajustar a busca ou o depósito selecionado
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedList.map((item) => {
                    const hasDesvios = item.desviosSkus > 0 || item.desviosUnits > 0;
                    const isOk =
                      item.statusAjustado === 'CONCILIADO' || item.divergenciaResidualSkus === 0;
                    const isFalta = !isOk && item.statusAjustado === 'FALTA_RESIDUAL';
                    const isSobra = !isOk && item.statusAjustado === 'SOBRA_RESIDUAL';

                    return (
                      <tr
                        key={`${item.deposito}-${item.produto}`}
                        onClick={() => setSelectedItemForOverview(item)}
                        className={`hover:bg-teal-50/40 transition-colors cursor-pointer group ${
                          isFalta ? 'bg-rose-50/20' : isSobra ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-600 bg-slate-50/50">
                          {item.deposito}
                        </td>

                        <td className="py-3 px-3 font-mono tabular-nums font-bold text-slate-900">
                          {item.produto}
                        </td>

                        <td className="py-3 px-4">
                          <div
                            className="font-semibold text-slate-900 line-clamp-1"
                            title={item.descricao}
                          >
                            {item.descricao}
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                              {item.grupo}
                            </span>
                            <span>
                              • Fator: <strong>{item.fatorSku}</strong> cx
                            </span>
                            <span>
                              • Unit: <strong>{formatCurrency(item.valorUnitario)}</strong>
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <div className="flex items-baseline justify-end space-x-1">
                            <span className="font-bold text-sm text-blue-700">
                              {item.fiscalSkus} cx
                            </span>
                            {item.fiscalUnits % item.fatorSku > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({item.fiscalUnits % item.fatorSku} un)
                              </span>
                            )}
                          </div>
                        </td>

                        <td
                          className={`py-3 px-3 text-right font-mono tabular-nums relative ${
                            hasDesvios ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          {hasDesvios ? (
                            <div
                              className="cursor-pointer group inline-block"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItemForOverview(item);
                              }}
                            >
                              <div className="flex items-baseline justify-end space-x-1 font-bold text-amber-700">
                                <span className="text-sm">+{item.desviosSkus} cx</span>
                                {item.desviosUnits % item.fatorSku > 0 && (
                                  <span className="text-[10px] text-amber-600/70 font-mono">
                                    ({item.desviosUnits % item.fatorSku} un)
                                  </span>
                                )}
                                <Info className="w-3 h-3 text-amber-500 opacity-60 group-hover:opacity-100 ml-0.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-xs">
                              <span>0 cx</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <div className="flex items-baseline justify-end space-x-1">
                            <span className="font-bold text-sm text-slate-800">
                              {item.fisicoSkus} cx
                            </span>
                            {item.fisicoUnits % item.fatorSku > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({item.fisicoUnits % item.fatorSku} un)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums bg-teal-50/20">
                          <div className="flex items-baseline justify-end space-x-1">
                            <span className="font-bold text-sm text-teal-800">
                              {item.finalSkus} cx
                            </span>
                            {item.finalTotalUnits % item.fatorSku > 0 && (
                              <span className="text-[10px] text-teal-600/70 font-mono">
                                ({item.finalTotalUnits % item.fatorSku} un)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {isOk ? (
                            <div>
                              <div className="font-bold text-sm text-emerald-700">0 cx</div>
                              {item.desviosUnits > 0 && (
                                <div className="text-[10px] text-teal-600 font-sans font-semibold">
                                  ✓ Equalizado ({item.desviosSkus} cx)
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div
                                className={`font-bold text-sm ${
                                  isFalta ? 'text-rose-600' : 'text-emerald-700'
                                }`}
                              >
                                {isFalta
                                  ? `${item.divergenciaResidualSkus} cx`
                                  : `+${item.divergenciaResidualSkus} cx`}
                              </div>
                              {(item.skusAmortizados || 0) > 0 && (
                                <div className="text-[10px] text-amber-600 font-sans font-semibold">
                                  -{item.skusAmortizados} cx amortizadas
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <div
                            className={`font-bold ${
                              isOk
                                ? 'text-slate-300'
                                : isFalta
                                ? 'text-rose-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {isOk
                              ? 'R$ 0,00'
                              : isFalta
                              ? `-${formatCurrency(Math.abs(item.impactoFinanceiroResidual))}`
                              : `+${formatCurrency(item.impactoFinanceiroResidual)}`}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[11px] text-slate-600">
                          {isOk ? (
                            <span className="text-slate-300">-</span>
                          ) : (
                            formatHectoliters(item.impactoHlResidual)
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isOk && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              ✓ EQUALIZADO
                            </span>
                          )}
                          {isFalta && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                              FALTA RESIDUAL
                            </span>
                          )}
                          {isSobra && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                              SOBRA RESIDUAL
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemForOverview(item);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                            title="Detalhar desvios deste SKU"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const found = stockPositions.find(
                                (s) =>
                                  normalizeSku(s.produto) === normalizeSku(item.produto) &&
                                  s.deposito === item.deposito
                              );
                              if (found) setActionModalItem(found);
                            }}
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

          <div className="bg-slate-50 border-t border-slate-200 rounded-b-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Exibindo <strong>{sortedList.length}</strong> de{' '}
              <strong>{adjustedItems.length}</strong> produtos cadastrados.
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                <span>Equalizado ({filterCounts.conciliados})</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-rose-500" />
                <span>Falta ({filterCounts.faltas})</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-blue-500" />
                <span>Sobra ({filterCounts.sobras})</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Modal com Overview Completo das Origens e Quantidades */}
      <ItemDesviosModal
        item={selectedItemForOverview}
        isOpen={!!selectedItemForOverview}
        onClose={() => setSelectedItemForOverview(null)}
        quebras={quebras}
        vales={vales}
        trocas={trocas}
        faltasMapeadas={faltasMapeadas}
        selectedDeposito={selectedDeposito}
        onNavigateTab={onNavigateTab}
        weeklyBillingStatus={weeklyBillingStatus}
      />

      {/* Modal Maximizado de Recontagem / Impressão / Exportar Imagem */}
      <RecontagemRankingsModal
        isOpen={isRecontagemModalOpen}
        onClose={() => setIsRecontagemModalOpen(false)}
        allRankingFaltas={allRankingFaltas}
        allRankingSobras={allRankingSobras}
        selectedDeposito={selectedDeposito}
        rankingAdjustmentMode="com_ajuste"
        onToggleAdjustmentMode={(mode) =>
          onToggleSubTab?.(mode === 'com_ajuste' ? 'ajustes' : 'padrao')
        }
        onSelectRecountItem={(id) => handleToggleRecountId(id)}
        selectedRecountIds={selectedRecountIds}
        stockPositions={reconciled.healedStock}
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
