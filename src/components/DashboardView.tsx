import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingDown, 
  TrendingUp,
  AlertOctagon, 
  Boxes, 
  Droplet, 
  ShieldCheck, 
  Scale, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  CircleDollarSign,
  Filter,
  FileSpreadsheet,
  Table2,
  Maximize2,
  Camera,
  ImageDown,
  CheckSquare,
  Printer,
  X,
  FileText,
  CheckCircle2,
  PlusCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  PackageX,
  Receipt,
  ArrowLeftRight,
  Truck
} from 'lucide-react';
import { 
  StockPositionItem, 
  QuebraItem, 
  ValeItem, 
  TrocaItem, 
  FaltaMapeadaItem, 
  DepositoId,
  ViewTab,
  FrozenReconciliation,
  ProductMaster
} from '../types';
import { formatCurrency, formatNumber } from '../utils/parsers';
import { getFaltaItemCalculatedValues } from '../utils/desviosUtils';
import { DEPOSITOS } from '../data/initialData';
import { RecontagemRankingsModal } from './RecontagemRankingsModal';
import { RecontagemExportSheet, getDivergenciaSkuFechado } from './RecontagemExportSheet';
import { reconcileAllStock, ReconciliationMode } from '../utils/reconciliationEngine';

interface DashboardViewProps {
  stockPositions: StockPositionItem[];
  quebras: QuebraItem[];
  vales: ValeItem[];
  trocas: TrocaItem[];
  faltasMapeadas: FaltaMapeadaItem[];
  selectedDeposito: DepositoId | 'ALL';
  onNavigateTab: (tab: ViewTab) => void;
  onOpenManualFaltaModal: () => void;
  onOpenManualModal?: (type?: 'quebra' | 'vale' | 'troca' | 'falta') => void;
  weeklyBillingStatus?: Record<string, 'PENDENTE' | 'OK'>;
  frozenReconciliations?: FrozenReconciliation[];
  productsMap?: Map<string, ProductMaster>;
  reconciliationMode?: ReconciliationMode;
  onChangeReconciliationMode?: (mode: ReconciliationMode) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stockPositions,
  quebras,
  vales,
  trocas,
  faltasMapeadas,
  selectedDeposito,
  onNavigateTab,
  onOpenManualFaltaModal,
  onOpenManualModal,
  weeklyBillingStatus,
  frozenReconciliations = [],
  productsMap,
  reconciliationMode,
  onChangeReconciliationMode,
}) => {
  // Obter o congelamento mais recente para exibição de status conectado
  const latestFrozen = useMemo(() => {
    if (!frozenReconciliations || frozenReconciliations.length === 0) return null;
    const depFrozens = selectedDeposito === 'ALL'
      ? frozenReconciliations
      : frozenReconciliations.filter(f => f.deposito === selectedDeposito);
    const found = depFrozens[0] || frozenReconciliations[0];
    if (!found) return null;

    const dateObj = found.dataCongelamento ? new Date(found.dataCongelamento) : null;
    const dateFormatted = dateObj && !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('pt-BR')
      : (found.date || '16/09/2026');
    const timeFormatted = dateObj && !isNaN(dateObj.getTime())
      ? dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : (found.time || '18:00');

    return {
      ...found,
      name: found.nome || found.name || `Conciliação Congelada Dep. ${found.deposito}`,
      date: dateFormatted,
      time: timeFormatted,
      totalItems: found.totalSkus || found.totalItems || found.itensSemAjustes?.length || 0,
      totalPrejuizo: found.totalFaltasSemAjustesValor ?? found.totalPrejuizo ?? 0,
      totalSobras: found.totalSobrasSemAjustesValor ?? found.totalSobras ?? 0,
      acuraciaInventario: found.acuraciaInventario ?? null
    };
  }, [frozenReconciliations, selectedDeposito]);

  // Configurable ranking limit (Top 10, Top 20, Top 30, Top 50, ALL) - Default to ALL (Todas as Faltas e Sobras)
  const [rankingLimit, setRankingLimit] = useState<number | 'ALL'>('ALL');
  const [rankingsDisplayFormat, setRankingsDisplayFormat] = useState<'planilha' | 'cards'>('planilha');

  // Modal maximizado e ficha de recontagem
  const [isRecontagemModalOpen, setIsRecontagemModalOpen] = useState(false);
  const [selectedRecountIds, setSelectedRecountIds] = useState<Set<string>>(new Set());

  const handleToggleRecountId = (id: string) => {
    setSelectedRecountIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectTopFaltas = (count: number) => {
    setSelectedRecountIds(prev => {
      const next = new Set(prev);
      allRankingFaltas.slice(0, count).forEach(item => next.add(item.id));
      return next;
    });
  };

  const handleSelectTopSobras = (count: number) => {
    setSelectedRecountIds(prev => {
      const next = new Set(prev);
      allRankingSobras.slice(0, count).forEach(item => next.add(item.id));
      return next;
    });
  };

  const handleClearRecountSelection = () => {
    setSelectedRecountIds(new Set());
  };

  // Filter mode requested by user: Com Ajustes (Equalizado) vs Sem Ajustes (Bruto)
  const initialMode: ReconciliationMode = reconciliationMode || 'com_ajuste';
  const [dashboardFilterMode, setDashboardFilterMode] = useState<'com_ajustes' | 'sem_ajustes'>(
    initialMode === 'com_ajuste' ? 'com_ajustes' : 'sem_ajustes'
  );
  const [rankingAdjustmentMode, setRankingAdjustmentMode] = useState<ReconciliationMode>(initialMode);

  useEffect(() => {
    if (reconciliationMode) {
      setRankingAdjustmentMode(reconciliationMode);
      setDashboardFilterMode(reconciliationMode === 'com_ajuste' ? 'com_ajustes' : 'sem_ajustes');
    }
  }, [reconciliationMode]);

  // Painel de Amortizações e Divergências Mapeadas Congeladas (Inicia MINIMIZADO por padrão)
  const [isAmortizacoesExpanded, setIsAmortizacoesExpanded] = useState<boolean>(false);
  const [selectedAmortizacaoTab, setSelectedAmortizacaoTab] = useState<'quebras' | 'vales' | 'trocas' | 'faltas' | null>(null);

  // Sincronização bidirecional completa entre Painel Geral, Ranking e Tela de Conciliação
  const handleToggleFilterMode = (mode: 'com_ajustes' | 'sem_ajustes') => {
    const canonical: ReconciliationMode = mode === 'com_ajustes' ? 'com_ajuste' : 'sem_ajuste';
    setDashboardFilterMode(mode);
    setRankingAdjustmentMode(canonical);
    onChangeReconciliationMode?.(canonical);
  };

  const handleToggleRankingMode = (mode: ReconciliationMode) => {
    setRankingAdjustmentMode(mode);
    setDashboardFilterMode(mode === 'com_ajuste' ? 'com_ajustes' : 'sem_ajustes');
    onChangeReconciliationMode?.(mode);
  };

  // Motor Único Canônico de Conciliação (100% paridade entre Dashboard, Conciliação, Modais e Excel)
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
  }, [stockPositions, quebras, vales, trocas, faltasMapeadas, selectedDeposito, weeklyBillingStatus, productsMap]);

  const filteredStock = reconciled.healedStock;
  const pendingQuebras = reconciled.desviosSummary.pendingQuebras;
  const pendingVales = reconciled.desviosSummary.pendingVales;
  const pendingTrocas = reconciled.desviosSummary.pendingTrocas;
  const pendingFaltas = reconciled.desviosSummary.pendingFaltas;

  const stats = useMemo(() => {
    const sa = reconciled.totalsSemAjuste;
    const ca = reconciled.totalsComAjuste;
    const dv = reconciled.desviosSummary;

    const totalAmortizadoValor = dv.totalDesviosValor;
    const totalAmortizadoSkus = dv.totalQuebrasQtd + dv.totalValesQtd + dv.totalTrocasQtd + dv.totalFaltasMapeadasQtd;
    const residualAposFatores = Math.max(0, sa.totalFaltasValor - totalAmortizadoValor);

    const percentualAmortizadoOperacional = sa.totalFaltasValor > 0
      ? Math.min(100, (totalAmortizadoValor / sa.totalFaltasValor) * 100)
      : 100;
    const percentualAmortizadoSobras = sa.totalFaltasValor > 0
      ? Math.min(100, (ca.totalSobrasValor / sa.totalFaltasValor) * 100)
      : 0;
    const percentualAmortizadoTotal = sa.totalFaltasValor > 0
      ? Math.min(100, ((sa.totalFaltasValor - ca.divergenciaLiquidaFalta) / sa.totalFaltasValor) * 100)
      : 100;

    return {
      totalItens: sa.totalItens,
      acuracidadePct: sa.acuracidadePct,
      acuracidadeEqualizadaPct: ca.acuracidadePct,
      totalDisponivelUnits: sa.totalFiscalUnits,
      totalInventarioUnits: sa.totalFisicoUnits,
      totalDisponivelSkus: sa.totalFiscalSkus,
      totalInventarioSkus: sa.totalFisicoSkus,
      valorTotalEstoqueFisico: sa.valorTotalFisico,
      valorTotalEstoqueDisponivel: sa.valorTotalFiscal,
      totalPrejuizoConciliacao: sa.totalFaltasValor,
      totalSobraConciliacao: sa.totalSobrasValor,
      totalSobraSkus: sa.totalSobrasSkus,
      totalSobraHl: sa.totalSobrasHl,
      totalPrejuizoHl: sa.totalFaltasHl,
      totalDiferencaHl: sa.saldoLiquidoHl,
      totalItensComFalta: sa.totalItensComFalta,
      totalItensComSobra: sa.totalItensComSobra,
      totalItensAcurados: sa.totalItensAcurados,
      totalQuebrasValor: dv.totalQuebrasValor,
      totalQuebrasHl: dv.totalQuebrasHl,
      totalQuebrasQtd: dv.totalQuebrasQtd,
      totalQuebrasPendentesCount: dv.totalQuebrasPendentesCount,
      totalQuebrasFaturadasValor: dv.totalQuebrasFaturadasValor,
      totalQuebrasFaturadasHl: dv.totalQuebrasFaturadasHl,
      totalQuebrasFaturadasQtd: dv.totalQuebrasFaturadasQtd,
      totalQuebrasFaturadasCount: dv.totalQuebrasFaturadasCount,
      totalValesValor: dv.totalValesValor,
      totalValesHl: dv.totalValesHl,
      totalValesQtd: dv.totalValesQtd,
      totalTrocasValor: dv.totalTrocasValor,
      totalTrocasHl: dv.totalTrocasHl,
      totalTrocasQtd: dv.totalTrocasQtd,
      totalFaltasValor: dv.totalFaltasMapeadasValor,
      totalFaltasHl: dv.totalFaltasMapeadasHl,
      totalFaltasQtd: dv.totalFaltasMapeadasQtd,
      prejuizoGeral: sa.totalFaltasValor + totalAmortizadoValor,
      volumeHlGeral: Math.abs(sa.saldoLiquidoHl) + dv.totalQuebrasHl + dv.totalValesHl + dv.totalTrocasHl + dv.totalFaltasMapeadasHl,
      totalAmortizadoValor,
      totalAmortizadoSkus,
      totalCompensacaoGlobalValor: totalAmortizadoValor + ca.totalSobrasValor,
      totalCompensacaoGlobalSkus: totalAmortizadoSkus + ca.totalSobrasSkus,
      totalPrejuizoSkusBruto: sa.totalFaltasSkus,
      totalPrejuizoResidual: ca.totalFaltasValor,
      totalSobraResidual: ca.totalSobrasValor,
      totalPrejuizoResidualSkus: ca.totalFaltasSkus,
      totalSobraResidualSkus: ca.totalSobrasSkus,
      totalPrejuizoResidualHl: ca.totalFaltasHl,
      totalSobraResidualHl: ca.totalSobrasHl,
      saldoResidualLiquido: ca.saldoLiquidoValor,
      saldoSemAjusteLiquido: sa.saldoLiquidoValor,
      divergenciaSemAjusteLiquida: sa.divergenciaLiquidaFalta,
      residualAposFatores,
      divergenciaResidualLiquida: ca.divergenciaLiquidaFalta,
      divergenciaResidualSkus: Math.abs(ca.saldoLiquidoSkus),
      superavitLiquido: ca.superavitLiquido,
      percentualAmortizadoOperacional,
      percentualAmortizadoSobras,
      percentualAmortizadoTotal,
      percentualAmortizado: percentualAmortizadoTotal,
      totalPerdasOperacionaisUnits: totalAmortizadoSkus,
      estoqueEqualizadoUnits: sa.totalFiscalUnits - totalAmortizadoSkus,
      divergenciaResidualUnits: sa.totalFisicoUnits - (sa.totalFiscalUnits - totalAmortizadoSkus),
    };
  }, [reconciled]);

  const allRankingFaltas = useMemo(() => {
    return rankingAdjustmentMode === 'com_ajuste'
      ? reconciled.rankingFaltasComAjuste
      : reconciled.rankingFaltasSemAjuste;
  }, [reconciled, rankingAdjustmentMode]);

  const allRankingSobras = useMemo(() => {
    return rankingAdjustmentMode === 'com_ajuste'
      ? reconciled.rankingSobrasComAjuste
      : reconciled.rankingSobrasSemAjuste;
  }, [reconciled, rankingAdjustmentMode]);

  const rankingFaltas = useMemo(() => {
    return rankingLimit === 'ALL' ? allRankingFaltas : allRankingFaltas.slice(0, rankingLimit);
  }, [allRankingFaltas, rankingLimit]);

  const rankingSobras = useMemo(() => {
    return rankingLimit === 'ALL' ? allRankingSobras : allRankingSobras.slice(0, rankingLimit);
  }, [allRankingSobras, rankingLimit]);

  const totalPrejuizoGeralFaltas = useMemo(() => {
    return rankingAdjustmentMode === 'com_ajuste'
      ? reconciled.totalsComAjuste.totalFaltasValor
      : reconciled.totalsSemAjuste.totalFaltasValor;
  }, [rankingAdjustmentMode, reconciled]);

  const totalValorGeralSobras = useMemo(() => {
    return rankingAdjustmentMode === 'com_ajuste'
      ? reconciled.totalsComAjuste.totalSobrasValor
      : reconciled.totalsSemAjuste.totalSobrasValor;
  }, [rankingAdjustmentMode, reconciled]);

  const totalGeralSkusFaltas = useMemo(() => {
    return rankingAdjustmentMode === 'com_ajuste'
      ? reconciled.totalsComAjuste.totalFaltasSkus
      : reconciled.totalsSemAjuste.totalFaltasSkus;
  }, [rankingAdjustmentMode, reconciled]);

  const totalGeralSkusSobras = useMemo(() => {
    return rankingAdjustmentMode === 'com_ajuste'
      ? reconciled.totalsComAjuste.totalSobrasSkus
      : reconciled.totalsSemAjuste.totalSobrasSkus;
  }, [rankingAdjustmentMode, reconciled]);

  const currentDepositoName = useMemo(() => {
    if (selectedDeposito === 'ALL') return 'Todos os Depósitos';
    const dep = DEPOSITOS.find(d => d.id === selectedDeposito);
    return dep ? dep.nome : `Depósito ${selectedDeposito}`;
  }, [selectedDeposito]);

  const totalDisplayFaltas = useMemo(() => {
    return rankingFaltas.reduce((acc, f) => acc + (f.prejuizoFinanceiro || 0), 0);
  }, [rankingFaltas]);

  const totalDisplaySobras = useMemo(() => {
    return rankingSobras.reduce((acc, s) => acc + (s.sobraFinanceira || 0), 0);
  }, [rankingSobras]);

  const saldoFinalDisplay = useMemo(() => {
    return totalDisplaySobras - totalDisplayFaltas;
  }, [totalDisplaySobras, totalDisplayFaltas]);

  const getPercentualImpactoFalta = (prejuizo: number) => {
    if (!totalPrejuizoGeralFaltas || totalPrejuizoGeralFaltas <= 0) return '0,0%';
    const pct = (prejuizo / totalPrejuizoGeralFaltas) * 100;
    return `${pct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  };

  const getPercentualImpactoSobra = (sobra: number) => {
    if (!totalValorGeralSobras || totalValorGeralSobras <= 0) return '0,0%';
    const pct = (sobra / totalValorGeralSobras) * 100;
    return `${pct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  };

  // Deposit comparison stats
  const depositBreakdown = useMemo(() => {
    return DEPOSITOS.map(dep => {
      const depStock = stockPositions.filter(s => s.deposito === dep.id);
      const faltas = depStock.reduce((acc, s) => acc + (s.prejuizoFinanceiro || 0), 0);
      const sobras = depStock.reduce((acc, s) => acc + (s.sobraFinanceira || 0), 0);
      const hlDivergencia = depStock.reduce((acc, s) => acc + Math.abs(s.impactoHl || 0), 0);
      const totalDisp = depStock.reduce((acc, s) => acc + (s.disponivelSkus !== undefined ? s.disponivelSkus : Math.floor(s.disponivelTotalUnits / (s.fatorSku || 1))), 0);
      return {
        ...dep,
        totalItens: depStock.length,
        faltas,
        sobras,
        hlDivergencia,
        totalDisp,
      };
    });
  }, [stockPositions]);

  // Status color badge
  const healthStatus = stats.acuracidadePct >= 98 
    ? { label: 'Excelente', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    : stats.acuracidadePct >= 92 
    ? { label: 'Atenção Operacional', color: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
    : { label: 'Crítico / Recontagem Urgente', color: 'rose', bg: 'bg-rose-50 text-rose-700 border-rose-200' };

  return (
    <div className="space-y-6 pb-8">
      
      {/* Top Header Strip: Status, Acurácia e Seletor de Modo (Sem Ajustes vs Com Ajustes) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Painel Geral de Conciliação
          </h2>
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${healthStatus.bg}`}>
            ● Saúde: {healthStatus.label}
          </span>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Acuracidade: <strong className="text-slate-800 font-mono font-bold">
              {dashboardFilterMode === 'com_ajustes' 
                ? `${formatNumber(stats.acuracidadeEqualizadaPct, 1)}%` 
                : `${formatNumber(stats.acuracidadePct, 1)}%`}
            </strong>
          </span>
        </div>

        {/* Seletor Unificado: Sem Ajustes vs Com Ajustes */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg shadow-2xs">
          <button
            onClick={() => handleToggleFilterMode('sem_ajustes')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              dashboardFilterMode === 'sem_ajustes'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visão bruta: divergência direta entre o relatório 02.05.02 e o inventário físico"
          >
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            <span>Sem Ajustes</span>
          </button>

          <button
            onClick={() => handleToggleFilterMode('com_ajustes')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              dashboardFilterMode === 'com_ajustes'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visão equalizada: inventário somado aos desvios congelados e amortizado por sobras"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Com Ajustes</span>
          </button>
        </div>
      </div>

      {/* 6 Executive KPI Cards (Diretos, Claros e sem Informações Redundantes no Rodapé) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        {/* KPI 1: Estoque Físico Total */}
        <div className="bg-gradient-to-br from-emerald-50/60 via-white to-white border border-emerald-500/30 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Estoque Físico Total</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-emerald-700 font-mono tracking-tight truncate" title={formatCurrency(stats.valorTotalEstoqueFisico)}>
              {formatCurrency(stats.valorTotalEstoqueFisico)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Valor Físico Inventariado
            </p>
          </div>
        </div>

        {/* KPI 2: Sistêmico 02.05.02 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Sistêmico (02.05.02)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-blue-700 font-mono tracking-tight truncate" title={formatCurrency(stats.valorTotalEstoqueDisponivel)}>
              {formatCurrency(stats.valorTotalEstoqueDisponivel)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              WMS Disponível Puro
            </p>
          </div>
        </div>

        {/* KPI 3: Divergência / Faltas */}
        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              {dashboardFilterMode === 'com_ajustes' ? 'Faltas (Com Ajuste)' : 'Faltas (Sem Ajuste)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-rose-600 font-mono tracking-tight truncate" title={formatCurrency(dashboardFilterMode === 'com_ajustes' ? stats.totalPrejuizoResidual : stats.totalPrejuizoConciliacao)}>
              -{formatCurrency(dashboardFilterMode === 'com_ajustes' ? stats.totalPrejuizoResidual : stats.totalPrejuizoConciliacao)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {dashboardFilterMode === 'com_ajustes' ? 'Físico + Desvios vs Fiscal' : 'Faltas Físicas vs 02.05.02'}
            </p>
          </div>
        </div>

        {/* KPI 4: Sobras de Estoque */}
        <div 
          onClick={() => onNavigateTab('conciliacao')}
          className="bg-emerald-50/40 hover:bg-emerald-50/80 border border-emerald-300 rounded-xl p-4 shadow-xs cursor-pointer transition group"
          title="Clique para detalhar as sobras na tela de Conciliação"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
              <span>{dashboardFilterMode === 'com_ajustes' ? 'Sobras (Com Ajuste)' : 'Sobras (Sem Ajuste)'}</span>
              <ChevronRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition" />
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-emerald-700 font-mono tracking-tight truncate" title={formatCurrency(dashboardFilterMode === 'com_ajustes' ? stats.totalSobraResidual : stats.totalSobraConciliacao)}>
              +{formatCurrency(dashboardFilterMode === 'com_ajustes' ? stats.totalSobraResidual : stats.totalSobraConciliacao)}
            </div>
            <p className="text-[11px] text-emerald-700/80 font-medium truncate mt-0.5">
              {dashboardFilterMode === 'com_ajustes' ? 'Excedente Físico Equalizado' : 'Excedente Físico Puro'}
            </p>
          </div>
        </div>

        {/* KPI 5: Amortizações Operacionais (Divergências Mapeadas Congeladas) */}
        <div 
          onClick={() => {
            setIsAmortizacoesExpanded(!isAmortizacoesExpanded);
            if (!isAmortizacoesExpanded && !selectedAmortizacaoTab) {
              setSelectedAmortizacaoTab('quebras');
            }
          }}
          className={`border rounded-xl p-4 shadow-xs transition cursor-pointer group ${
            isAmortizacoesExpanded 
              ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-300' 
              : 'bg-white border-amber-200 hover:bg-amber-50/40'
          }`}
          title="Clique para expandir/minimizar os cards de divergências congeladas (Quebras, Vales, Trocas e Doca)"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center space-x-1">
              <span>Amortizações</span>
              {isAmortizacoesExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-600 group-hover:translate-y-0.5 transition" />
              )}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold text-amber-600 font-mono tracking-tight truncate">
              +{formatCurrency(stats.totalAmortizadoValor)}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[11px] text-slate-500 truncate">
                Quebras, Trocas, Vales & Doca
              </p>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200/80">
                {isAmortizacoesExpanded ? 'Minimizar ▲' : 'Expandir ▼'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 6: Divergência / Saldo Final (Sincronizado com o Modo Ativo) */}
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
              {dashboardFilterMode === 'com_ajustes' ? 'Divergência Residual' : 'Divergência Líquida'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            {(() => {
              const activeDivLiquida = dashboardFilterMode === 'com_ajustes'
                ? stats.divergenciaResidualLiquida
                : stats.divergenciaSemAjusteLiquida;
              const activeSaldoLiquido = dashboardFilterMode === 'com_ajustes'
                ? stats.saldoResidualLiquido
                : stats.saldoSemAjusteLiquido;
              return (
                <>
                  <div className={`text-xl font-bold font-mono tracking-tight truncate ${activeDivLiquida > 0 ? 'text-purple-800' : 'text-emerald-600'}`}>
                    {formatCurrency(activeDivLiquida)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-purple-100">
                    <span className="text-slate-500 font-medium">Saldo Final:</span>
                    <span className={`font-mono font-bold ${activeSaldoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {activeSaldoLiquido >= 0 ? '+' : ''}{formatCurrency(activeSaldoLiquido)}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

      </div>

      {/* Painel Expansível: Divergências Mapeadas & Desvios Congelados (Inicia MINIMIZADO por padrão) */}
      {isAmortizacoesExpanded && (
        <div className="bg-slate-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 animate-fadeIn">
          {/* Header do Painel de Amortizações */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Divergências Mapeadas & Amortizações Operacionais (Congeladas)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  TOTAL: +{formatCurrency(stats.totalAmortizadoValor)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Valores e lançamentos operacionais congelados no armazém. Clique em cada card abaixo para ver ou ocultar os itens congelados.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAmortizacoesExpanded(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Minimizar Cards</span>
              </button>
            </div>
          </div>

          {/* Cards Individuais por Categoria de Divergência Congelada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Card 1: Quebras Congeladas */}
            <div
              onClick={() => setSelectedAmortizacaoTab(selectedAmortizacaoTab === 'quebras' ? null : 'quebras')}
              className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
                selectedAmortizacaoTab === 'quebras'
                  ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-300'
                  : 'bg-white hover:bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <PackageX className="w-4 h-4 text-amber-600" />
                  <span>1. Quebras (Avarias)</span>
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
                  {pendingQuebras.length} reg.
                </span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono text-amber-800">
                  +{formatCurrency(stats.totalQuebrasValor)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                  <span>{stats.totalQuebrasQtd.toLocaleString('pt-BR')} cx</span>
                  <span className="text-amber-700 font-semibold hover:underline">
                    {selectedAmortizacaoTab === 'quebras' ? 'Ocultar itens ▲' : 'Ver itens ▼'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Vales Pendentes */}
            <div
              onClick={() => setSelectedAmortizacaoTab(selectedAmortizacaoTab === 'vales' ? null : 'vales')}
              className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
                selectedAmortizacaoTab === 'vales'
                  ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-300'
                  : 'bg-white hover:bg-blue-50/60 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span>2. Vales Motorista</span>
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-200/80 text-blue-900 border border-blue-300">
                  {pendingVales.length} reg.
                </span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono text-blue-800">
                  +{formatCurrency(stats.totalValesValor)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                  <span>{stats.totalValesQtd.toLocaleString('pt-BR')} cx</span>
                  <span className="text-blue-700 font-semibold hover:underline">
                    {selectedAmortizacaoTab === 'vales' ? 'Ocultar itens ▲' : 'Ver itens ▼'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Trocas Pendentes */}
            <div
              onClick={() => setSelectedAmortizacaoTab(selectedAmortizacaoTab === 'trocas' ? null : 'trocas')}
              className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
                selectedAmortizacaoTab === 'trocas'
                  ? 'bg-purple-100/90 border-purple-500 ring-2 ring-purple-300'
                  : 'bg-white hover:bg-purple-50/60 border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                  <span>3. Trocas Mercado</span>
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-200/80 text-purple-900 border border-purple-300">
                  {pendingTrocas.length} reg.
                </span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono text-purple-800">
                  +{formatCurrency(stats.totalTrocasValor)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                  <span>{stats.totalTrocasQtd.toLocaleString('pt-BR')} cx</span>
                  <span className="text-purple-700 font-semibold hover:underline">
                    {selectedAmortizacaoTab === 'trocas' ? 'Ocultar itens ▲' : 'Ver itens ▼'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Faltas Mapeadas (Doca) */}
            <div
              onClick={() => setSelectedAmortizacaoTab(selectedAmortizacaoTab === 'faltas' ? null : 'faltas')}
              className={`p-4 rounded-xl border transition cursor-pointer shadow-xs ${
                selectedAmortizacaoTab === 'faltas'
                  ? 'bg-indigo-100/90 border-indigo-500 ring-2 ring-indigo-300'
                  : 'bg-white hover:bg-indigo-50/60 border-indigo-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>4. Faltas Mapeadas (Doca)</span>
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-200/80 text-indigo-900 border border-indigo-300">
                  {pendingFaltas.length} reg.
                </span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono text-indigo-800">
                  +{formatCurrency(stats.totalFaltasValor)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                  <span>{stats.totalFaltasQtd.toLocaleString('pt-BR')} cx</span>
                  <span className="text-indigo-700 font-semibold hover:underline">
                    {selectedAmortizacaoTab === 'faltas' ? 'Ocultar itens ▲' : 'Ver itens ▼'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Tabela de Itens Congelados (Aparece ao clicar em um dos cards de amortização) */}
          {selectedAmortizacaoTab && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 mt-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {selectedAmortizacaoTab === 'quebras' && '📋 Itens Congelados: Quebras e Avarias de Armazém'}
                    {selectedAmortizacaoTab === 'vales' && '📋 Itens Congelados: Vales Motorista e Funcionários'}
                    {selectedAmortizacaoTab === 'trocas' && '📋 Itens Congelados: Trocas Mercado e Devoluções'}
                    {selectedAmortizacaoTab === 'faltas' && '📋 Itens Congelados: Faltas Mapeadas / Recebimento Doca'}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedAmortizacaoTab(null)}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
                  title="Fechar tabela de itens"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabela de Itens */}
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                {selectedAmortizacaoTab === 'quebras' && (
                  pendingQuebras.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Nenhum registro de quebra pendente neste depósito.</p>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-amber-50 text-amber-900 font-bold border-b border-amber-200 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-2">Data</th>
                          <th className="py-2 px-2">Dep.</th>
                          <th className="py-2 px-2">SKU</th>
                          <th className="py-2 px-2">Descrição</th>
                          <th className="py-2 px-2 text-center">Qtd (cx)</th>
                          <th className="py-2 px-2 text-right">Valor R$</th>
                          <th className="py-2 px-2">Motivo / Área</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {pendingQuebras.map((q) => (
                          <tr key={q.id} className="hover:bg-amber-50/30 text-slate-700">
                            <td className="py-1.5 px-2 text-[11px]">{q.data ? new Date(q.data).toLocaleDateString('pt-BR') : '-'}</td>
                            <td className="py-1.5 px-2 font-bold">{q.deposito || selectedDeposito}</td>
                            <td className="py-1.5 px-2 font-bold text-slate-900">{q.sku}</td>
                            <td className="py-1.5 px-2 font-sans truncate max-w-xs">{q.descricao}</td>
                            <td className="py-1.5 px-2 text-center font-bold text-amber-800">{q.quantidade}</td>
                            <td className="py-1.5 px-2 text-right font-bold text-amber-800">R$ {(q.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-1.5 px-2 font-sans text-slate-500 text-[11px] truncate max-w-xs">{q.motivo || q.area || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}

                {selectedAmortizacaoTab === 'vales' && (
                  pendingVales.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Nenhum registro de vale pendente neste depósito.</p>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-blue-50 text-blue-900 font-bold border-b border-blue-200 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-2">Data</th>
                          <th className="py-2 px-2">Dep.</th>
                          <th className="py-2 px-2">SKU</th>
                          <th className="py-2 px-2">Descrição</th>
                          <th className="py-2 px-2 text-center">Qtd (cx)</th>
                          <th className="py-2 px-2 text-right">Valor R$</th>
                          <th className="py-2 px-2">Motorista / Equipe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {pendingVales.map((v) => (
                          <tr key={v.id} className="hover:bg-blue-50/30 text-slate-700">
                            <td className="py-1.5 px-2 text-[11px]">{v.data ? new Date(v.data).toLocaleDateString('pt-BR') : '-'}</td>
                            <td className="py-1.5 px-2 font-bold">{v.deposito || selectedDeposito}</td>
                            <td className="py-1.5 px-2 font-bold text-slate-900">{v.codigo}</td>
                            <td className="py-1.5 px-2 font-sans truncate max-w-xs">{v.descricao}</td>
                            <td className="py-1.5 px-2 text-center font-bold text-blue-800">{v.quantidade}</td>
                            <td className="py-1.5 px-2 text-right font-bold text-blue-800">R$ {(v.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-1.5 px-2 font-sans text-slate-600 text-[11px] truncate max-w-xs">{v.motorista || v.cliente || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}

                {selectedAmortizacaoTab === 'trocas' && (
                  pendingTrocas.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Nenhum registro de troca pendente neste depósito.</p>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-purple-50 text-purple-900 font-bold border-b border-purple-200 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-2">Data</th>
                          <th className="py-2 px-2">Dep.</th>
                          <th className="py-2 px-2">SKU</th>
                          <th className="py-2 px-2">Descrição</th>
                          <th className="py-2 px-2 text-center">Qtd (cx)</th>
                          <th className="py-2 px-2 text-right">Valor R$</th>
                          <th className="py-2 px-2">Cliente / Motivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {pendingTrocas.map((t) => (
                          <tr key={t.id} className="hover:bg-purple-50/30 text-slate-700">
                            <td className="py-1.5 px-2 text-[11px]">{t.data ? new Date(t.data).toLocaleDateString('pt-BR') : '-'}</td>
                            <td className="py-1.5 px-2 font-bold">{t.deposito || selectedDeposito}</td>
                            <td className="py-1.5 px-2 font-bold text-slate-900">{t.sku || t.codigos}</td>
                            <td className="py-1.5 px-2 font-sans truncate max-w-xs">{t.descricao}</td>
                            <td className="py-1.5 px-2 text-center font-bold text-purple-800">{t.quantidade}</td>
                            <td className="py-1.5 px-2 text-right font-bold text-purple-800">R$ {(t.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-1.5 px-2 font-sans text-slate-600 text-[11px] truncate max-w-xs">{t.cliente || t.motivoDeclarado || t.motivo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}

                {selectedAmortizacaoTab === 'faltas' && (
                  pendingFaltas.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Nenhum registro de falta mapeada pendente neste depósito.</p>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-indigo-50 text-indigo-900 font-bold border-b border-indigo-200 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-2">Data</th>
                          <th className="py-2 px-2">Dep.</th>
                          <th className="py-2 px-2">SKU</th>
                          <th className="py-2 px-2">Descrição</th>
                          <th className="py-2 px-2 text-center">Qtd (cx)</th>
                          <th className="py-2 px-2 text-right">Valor R$</th>
                          <th className="py-2 px-2">Motivo / Origem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {pendingFaltas.map((f) => {
                          const vals = getFaltaItemCalculatedValues(f, productsMap, filteredStock);
                          return (
                            <tr key={f.id} className="hover:bg-indigo-50/30 text-slate-700">
                              <td className="py-1.5 px-2 text-[11px]">{f.data ? new Date(f.data).toLocaleDateString('pt-BR') : '-'}</td>
                              <td className="py-1.5 px-2 font-bold">{f.deposito || selectedDeposito}</td>
                              <td className="py-1.5 px-2 font-bold text-slate-900">{f.produto || f.codigo}</td>
                              <td className="py-1.5 px-2 font-sans truncate max-w-xs">{f.descricao}</td>
                              <td className="py-1.5 px-2 text-center font-bold text-indigo-800">{vals.quantidadeSkus || f.quantidade}</td>
                              <td className="py-1.5 px-2 text-right font-bold text-indigo-800">
                                R$ {vals.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-1.5 px-2 font-sans text-slate-600 text-[11px] truncate max-w-xs">{f.motivo || f.observacao || f.origem || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Rankings Section: Padrão Oficial de Planilha / Fichas de Recontagem */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Unified Control Bar for Rankings */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                Rankings de Divergências & Recontagem (Faltas & Sobras)
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                rankingAdjustmentMode === 'com_ajuste' 
                  ? 'bg-teal-50 text-teal-700 border-teal-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {rankingAdjustmentMode === 'com_ajuste' ? 'COM AJUSTES' : 'SEM AJUSTES'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Exibição padronizada das maiores divergências de estoque por SKU no depósito <strong>{currentDepositoName}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Alternador de Formato (Planilha vs Cards) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setRankingsDisplayFormat('planilha')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  rankingsDisplayFormat === 'planilha'
                    ? 'bg-amber-400 text-black shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visualização padronizada de tabela lado a lado com Faltas, Sobras e Resumo de Saldo"
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Planilha (Padrão Maximizado)</span>
              </button>
              <button
                onClick={() => setRankingsDisplayFormat('cards')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  rankingsDisplayFormat === 'cards'
                    ? 'bg-slate-800 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visualização em cartões individuais verticais"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Fichas Detalhadas</span>
              </button>
            </div>

            {/* Alternador de Modo (Sem Ajuste vs Com Ajuste) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => handleToggleRankingMode('sem_ajuste')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  rankingAdjustmentMode === 'sem_ajuste'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sem Ajuste
              </button>
              <button
                onClick={() => handleToggleRankingMode('com_ajuste')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  rankingAdjustmentMode === 'com_ajuste'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Com Ajustes
              </button>
            </div>

            {/* Seletor de Profundidade (Top Itens) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 px-1.5">Itens:</span>
              {([10, 20, 30, 50, 'ALL'] as const).map((opt) => (
                <button
                  key={String(opt)}
                  onClick={() => setRankingLimit(opt)}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition ${
                    rankingLimit === opt
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt === 'ALL' ? 'Todos' : opt}
                </button>
              ))}
            </div>

            {/* Botão Maximizar (Abre modal em tela cheia) */}
            <button
              onClick={() => setIsRecontagemModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              title="Maximizar tela e exportar imagem / imprimir ficha de recontagem"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
              <span>Maximizar</span>
            </button>

            {/* Botão Ver Tabela */}
            <button 
              onClick={() => onNavigateTab('conciliacao')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-200 cursor-pointer"
            >
              Ver Conciliação
            </button>
          </div>
        </div>

        {/* Exibição: Formato Planilha (Mesmo Padrão da Tela Maximizada) */}
        {rankingsDisplayFormat === 'planilha' ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-4 overflow-x-auto">
            <RecontagemExportSheet
              exportFaltas={rankingFaltas}
              exportSobras={rankingSobras}
              totalDisplayFaltas={totalDisplayFaltas}
              totalDisplaySobras={totalDisplaySobras}
              saldoFinalDisplay={saldoFinalDisplay}
              totalGeralPrejuizoFaltas={totalPrejuizoGeralFaltas}
              totalGeralValorSobras={totalValorGeralSobras}
              totalGeralSkusFaltas={totalGeralSkusFaltas}
              totalGeralSkusSobras={totalGeralSkusSobras}
              saldoFinalGeral={totalValorGeralSobras - totalPrejuizoGeralFaltas}
              saldoFinalSkusGeral={totalGeralSkusSobras - totalGeralSkusFaltas}
              currentDepositoName={currentDepositoName}
              currentMode={rankingAdjustmentMode}
              selectedIds={selectedRecountIds}
              onToggleSelect={handleToggleRecountId}
              isExportTarget={false}
              showFiscalFisico={false}
            />
          </div>
        ) : (
          /* Exibição: Formato de Fichas em Cards em 2 Colunas */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Faltas (Maior Prejuízo) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-xs">
                    ↓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Ranking de Faltas {rankingLimit === 'ALL' ? '(Todos)' : `(Top ${rankingLimit})`}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {rankingAdjustmentMode === 'com_ajuste' 
                        ? 'Faltas residuais equalizadas após desvios operacionais' 
                        : 'Maior divergência negativa no inventário físico'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {rankingFaltas.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100 p-4">
                      {rankingAdjustmentMode === 'com_ajuste' 
                        ? '✓ Nenhuma falta residual no depósito selecionado.'
                        : 'Nenhuma falta identificada no depósito selecionado.'}
                    </div>
                  ) : (
                    rankingFaltas.map((item, index) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          handleToggleRecountId(item.id);
                          setIsRecontagemModalOpen(true);
                        }}
                        className="p-2.5 rounded-lg border flex items-center justify-between transition text-xs cursor-pointer bg-rose-50/40 hover:bg-rose-50/90 border-rose-100 group"
                        title="Clique para ver detalhes do item"
                      >
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate" title={item.descricao}>
                              {item.descricao}
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span>SKU: <strong className="text-slate-700">{item.produto}</strong></span>
                              <span>•</span>
                              <span>Fator: {item.fatorSku}</span>
                              <span>•</span>
                              <span className="text-rose-600 font-mono font-semibold">
                                Falta: -{getDivergenciaSkuFechado(item, false)} cx
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5 flex-shrink-0 pl-2">
                          <div className="text-right flex-shrink-0 flex flex-col items-end">
                            <div className="text-sm font-bold font-mono text-rose-600">
                              -{formatCurrency(item.prejuizoFinanceiro)}
                            </div>
                          </div>
                          <Camera className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Top Sobras (Maior Sobra) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                    ↑
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Ranking de Sobras {rankingLimit === 'ALL' ? '(Todos)' : `(Top ${rankingLimit})`}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {rankingAdjustmentMode === 'com_ajuste' 
                        ? 'Sobras excedentes equalizadas após desvios' 
                        : 'Produtos físicos excedentes em relação ao WMS'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {rankingSobras.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100 p-4">
                      Nenhuma sobra identificada no depósito selecionado.
                    </div>
                  ) : (
                    rankingSobras.map((item, index) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          handleToggleRecountId(item.id);
                          setIsRecontagemModalOpen(true);
                        }}
                        className="p-2.5 rounded-lg border flex items-center justify-between transition text-xs cursor-pointer bg-emerald-50/40 hover:bg-emerald-50/90 border-emerald-100 group"
                        title="Clique para ver detalhes do item"
                      >
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate" title={item.descricao}>
                              {item.descricao}
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span>SKU: <strong className="text-slate-700">{item.produto}</strong></span>
                              <span>•</span>
                              <span>Fator: {item.fatorSku}</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-mono font-semibold">
                                Sobra: +{getDivergenciaSkuFechado(item, true)} cx
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5 flex-shrink-0 pl-2">
                          <div className="text-right flex-shrink-0 flex flex-col items-end">
                            <div className="text-sm font-bold font-mono text-emerald-600">
                              +{formatCurrency(item.sobraFinanceira)}
                            </div>
                          </div>
                          <Camera className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Maximizado de Recontagem / Impressão / Exportar Imagem */}
      <RecontagemRankingsModal
        isOpen={isRecontagemModalOpen}
        onClose={() => setIsRecontagemModalOpen(false)}
        allRankingFaltas={allRankingFaltas}
        allRankingSobras={allRankingSobras}
        selectedDeposito={selectedDeposito}
        rankingAdjustmentMode={rankingAdjustmentMode}
        onToggleAdjustmentMode={handleToggleRankingMode}
        onSelectRecountItem={(id) => handleToggleRecountId(id)}
        selectedRecountIds={selectedRecountIds}
        stockPositions={stockPositions}
        quebras={quebras}
        vales={vales}
        trocas={trocas}
        faltasMapeadas={faltasMapeadas}
        weeklyBillingStatus={weeklyBillingStatus}
        showFiscalFisico={false}
      />
    </div>
  );
};
