import React, { useMemo, useState } from 'react';
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
  FrozenReconciliation
} from '../types';
import { formatCurrency, formatHectoliters, formatNumber, formatSkuUnit } from '../utils/parsers';
import { 
  calculateSkuDeviations, 
  isQuebraPendente, 
  isQuebraFaturada, 
  isValePendente, 
  isTrocaPendente 
} from '../utils/desviosUtils';
import { DEPOSITOS } from '../data/initialData';
import { RecontagemRankingsModal } from './RecontagemRankingsModal';
import { RecontagemExportSheet, getDivergenciaSkuFechado } from './RecontagemExportSheet';
import { computeDashboardRankingItems } from '../utils/rankingUtils';

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
  const [dashboardFilterMode, setDashboardFilterMode] = useState<'com_ajustes' | 'sem_ajustes'>('com_ajustes');

  // Ranking view calculation mode: 'sem_ajuste' (bruto: físico vs fiscal) vs 'com_ajuste' (físico + soma de todos os desvios vs fiscal)
  const [rankingAdjustmentMode, setRankingAdjustmentMode] = useState<'com_ajuste' | 'sem_ajuste'>('com_ajuste');

  // Painel de Amortizações e Divergências Mapeadas Congeladas (Inicia MINIMIZADO por padrão)
  const [isAmortizacoesExpanded, setIsAmortizacoesExpanded] = useState<boolean>(false);
  const [selectedAmortizacaoTab, setSelectedAmortizacaoTab] = useState<'quebras' | 'vales' | 'trocas' | 'faltas' | null>(null);

  // Sincronização bidirecional completa entre Painel Geral e Ranking
  const handleToggleFilterMode = (mode: 'com_ajustes' | 'sem_ajustes') => {
    setDashboardFilterMode(mode);
    setRankingAdjustmentMode(mode === 'com_ajustes' ? 'com_ajuste' : 'sem_ajuste');
  };

  const handleToggleRankingMode = (mode: 'com_ajuste' | 'sem_ajuste') => {
    setRankingAdjustmentMode(mode);
    setDashboardFilterMode(mode === 'com_ajuste' ? 'com_ajustes' : 'sem_ajustes');
  };

  // Filter by selected depósito if applicable
  const filteredStock = useMemo(() => {
    if (selectedDeposito === 'ALL') return stockPositions;
    return stockPositions.filter(s => s.deposito === selectedDeposito);
  }, [stockPositions, selectedDeposito]);

  const filteredQuebras = useMemo(() => {
    if (selectedDeposito === 'ALL') return quebras;
    return quebras.filter(q => q.deposito === selectedDeposito);
  }, [quebras, selectedDeposito]);

  // REGRA DE NEGÓCIO CRÍTICA AMBEV:
  // Apenas desvios PENDENTES de faturamento amortizam as diferenças de estoque na conciliação.
  // As quebras, trocas e vales já faturados/baixados foram baixados contabilmente e não amortizam.
  const pendingQuebras = useMemo(() => {
    return filteredQuebras.filter(q => isQuebraPendente(q, weeklyBillingStatus));
  }, [filteredQuebras, weeklyBillingStatus]);

  const faturadasQuebras = useMemo(() => {
    return filteredQuebras.filter(q => isQuebraFaturada(q, weeklyBillingStatus));
  }, [filteredQuebras, weeklyBillingStatus]);

  const filteredVales = useMemo(() => {
    if (selectedDeposito === 'ALL') return vales;
    return vales.filter(v => v.deposito === selectedDeposito);
  }, [vales, selectedDeposito]);

  const pendingVales = useMemo(() => {
    return filteredVales.filter(v => isValePendente(v, weeklyBillingStatus));
  }, [filteredVales, weeklyBillingStatus]);

  const filteredTrocas = useMemo(() => {
    if (selectedDeposito === 'ALL') return trocas;
    return trocas.filter(t => t.deposito === selectedDeposito);
  }, [trocas, selectedDeposito]);

  const pendingTrocas = useMemo(() => {
    return filteredTrocas.filter(t => isTrocaPendente(t, weeklyBillingStatus));
  }, [filteredTrocas, weeklyBillingStatus]);

  const filteredFaltas = useMemo(() => {
    if (selectedDeposito === 'ALL') return faltasMapeadas;
    return faltasMapeadas.filter(f => !f.deposito || f.deposito === selectedDeposito);
  }, [faltasMapeadas, selectedDeposito]);

  // Cache de alta performance dos desvios calculados por SKU
  // Garante 100% de paridade instantânea entre Cards Executivos e Rankings
  const skuDeviationsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateSkuDeviations>>();
    filteredStock.forEach((item) => {
      const sku = String(item.produto).trim();
      const key = `${item.deposito}-${sku}`;
      if (!map.has(key)) {
        const fator = Math.max(1, item.fatorSku || 1);
        const dev = calculateSkuDeviations(
          sku,
          item.deposito,
          fator,
          item.valorUnitario,
          item.valorCaixa,
          item.fatorHl,
          pendingQuebras,
          pendingVales,
          pendingTrocas,
          filteredFaltas,
          weeklyBillingStatus
        );
        map.set(key, dev);
      }
    });
    return map;
  }, [filteredStock, pendingQuebras, pendingVales, pendingTrocas, filteredFaltas, weeklyBillingStatus]);

  // Financial and HL calculations
  const stats = useMemo(() => {
    // 1. Reconciliation Divergences
    let totalDisponivelUnits = 0;
    let totalInventarioUnits = 0;
    let totalDisponivelSkus = 0;
    let totalInventarioSkus = 0;
    let valorTotalEstoqueFisico = 0;
    let valorTotalEstoqueDisponivel = 0;
    let totalPrejuizoConciliacao = 0; // Faltas (R$)
    let totalSobraConciliacao = 0; // Sobras (R$)
    let totalSobraSkus = 0;
    let totalSobraHl = 0;
    let totalPrejuizoHl = 0;
    let totalPrejuizoSkusBruto = 0;
    let totalDiferencaHl = 0;
    let totalItensComFalta = 0;
    let totalItensComSobra = 0;
    let totalItensAcurados = 0;

    let totalItensSaldoNegativo = 0;

    filteredStock.forEach((item) => {
      // Itens com saldo negativo desconsiderado ficam fora dos totais de caixas, valor, HL e acurácia
      if (item.saldoNegativoDesconsiderado || item.disponivelTotalUnits < 0) {
        totalItensSaldoNegativo++;
        return;
      }

      totalDisponivelUnits += item.disponivelTotalUnits;
      totalInventarioUnits += item.inventarioTotalUnits;
      
      const dispSkus = item.disponivelSkus;
      const invSkus = item.inventarioSkus;
      totalDisponivelSkus += dispSkus;
      totalInventarioSkus += invSkus;

      // Valoração total em caixas/SKUs
      valorTotalEstoqueFisico += invSkus * item.valorCaixa;
      valorTotalEstoqueDisponivel += dispSkus * item.valorCaixa;
      
      if (item.status === 'FALTA') {
        totalPrejuizoConciliacao += item.prejuizoFinanceiro;
        totalItensComFalta++;
        totalPrejuizoSkusBruto += Math.abs(item.diferencaSkus);
        totalPrejuizoHl += Math.abs(item.impactoHl);
        totalDiferencaHl += item.impactoHl;
      } else if (item.status === 'SOBRA') {
        totalSobraConciliacao += item.sobraFinanceira;
        totalItensComSobra++;
        totalSobraSkus += item.diferencaSkus;
        totalSobraHl += item.impactoHl;
        totalDiferencaHl += item.impactoHl;
      } else {
        totalItensAcurados++;
      }
    });

    const totalItensValidos = filteredStock.length - totalItensSaldoNegativo;
    const acuracidadePct = totalItensValidos > 0 
      ? Math.max(0, Math.min(100, (totalItensAcurados / totalItensValidos) * 100))
      : 100;

    // 2. Quebras (Apenas PENDENTES amortizam o estoque físico na conciliação; faturadas já foram baixadas)
    const totalQuebrasValor = pendingQuebras.reduce((acc, q) => acc + (q.valorTotal || 0), 0);
    const totalQuebrasHl = pendingQuebras.reduce((acc, q) => acc + (q.volumeHl || 0), 0);
    const totalQuebrasQtd = pendingQuebras.reduce((acc, q) => acc + (q.quantidade || 0), 0);

    // Quebras Faturadas (Informativo de auditoria - baixadas no financeiro, NÃO amortizam o estoque)
    const totalQuebrasFaturadasValor = faturadasQuebras.reduce((acc, q) => acc + (q.valorTotal || 0), 0);
    const totalQuebrasFaturadasHl = faturadasQuebras.reduce((acc, q) => acc + (q.volumeHl || 0), 0);
    const totalQuebrasFaturadasQtd = faturadasQuebras.reduce((acc, q) => acc + (q.quantidade || 0), 0);
    const totalQuebrasFaturadasCount = faturadasQuebras.length;
    const totalQuebrasPendentesCount = pendingQuebras.length;

    // 3. Vales (Apenas PENDENTES)
    const totalValesValor = pendingVales.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
    const totalValesHl = pendingVales.reduce((acc, v) => acc + (v.volumeHl || 0), 0);
    const totalValesQtd = pendingVales.reduce((acc, v) => acc + (v.quantidade || 0), 0);

    // 4. Trocas & Reposições (Apenas PENDENTES)
    const totalTrocasValor = pendingTrocas.reduce((acc, t) => acc + (t.valorTotal || 0), 0);
    const totalTrocasHl = pendingTrocas.reduce((acc, t) => acc + (t.volumeHl || 0), 0);
    const totalTrocasQtd = pendingTrocas.reduce((acc, t) => acc + (t.quantidade || 0), 0);

    // 5. Faltas Mapeadas (SKU fechado)
    const totalFaltasValor = filteredFaltas.reduce((acc, f) => acc + (f.valorTotal || 0), 0);
    const totalFaltasHl = filteredFaltas.reduce((acc, f) => acc + (f.volumeHl || 0), 0);
    const totalFaltasQtd = filteredFaltas.reduce((acc, f) => acc + (f.quantidade || f.quantidadeSkus || 0), 0);

    // Consolidated Losses
    const prejuizoGeral = totalPrejuizoConciliacao + totalQuebrasValor + totalValesValor + totalTrocasValor + totalFaltasValor;
    const volumeHlGeral = Math.abs(totalDiferencaHl) + totalQuebrasHl + totalValesHl + totalTrocasHl + totalFaltasHl;

    // Fatores de Amortização das Divergências da Conciliação
    const totalPrejuizoConciliacaoBruto = totalPrejuizoConciliacao;
    const totalSobraConciliacaoBruto = totalSobraConciliacao;
    const totalAmortizadoValor = totalQuebrasValor + totalValesValor + totalTrocasValor + totalFaltasValor;
    const totalAmortizadoSkus = totalQuebrasQtd + totalValesQtd + totalTrocasQtd + totalFaltasQtd;

    // 6. Micro-Equalização Rigorosa SKU a SKU (Garante 100% de paridade com o Ranking de Faltas e Sobras)
    let totalPrejuizoResidual = 0;
    let totalSobraResidual = 0;
    let totalPrejuizoResidualSkus = 0;
    let totalSobraResidualSkus = 0;
    let totalPrejuizoResidualHl = 0;
    let totalSobraResidualHl = 0;
    let totalItensEqualizadosAcurados = 0;

    filteredStock.forEach((item) => {
      if (item.saldoNegativoDesconsiderado || item.disponivelTotalUnits < 0) {
        return;
      }

      const sku = String(item.produto).trim();
      const fator = Math.max(1, item.fatorSku || 1);
      const dev = skuDeviationsMap.get(`${item.deposito}-${sku}`) || calculateSkuDeviations(
        sku,
        item.deposito,
        fator,
        item.valorUnitario,
        item.valorCaixa,
        item.fatorHl,
        pendingQuebras,
        pendingVales,
        pendingTrocas,
        filteredFaltas,
        weeklyBillingStatus
      );

      const fisicoSkus = item.inventarioSkus;
      const desviosSkus = dev.total.boxesInt;
      const finalSkus = fisicoSkus + desviosSkus;
      const fiscalSkus = item.disponivelSkus;
      let diffSkus = finalSkus - fiscalSkus;

      if (diffSkus < 0) {
        totalPrejuizoResidual += Math.abs(diffSkus) * item.valorCaixa;
        totalPrejuizoResidualSkus += Math.abs(diffSkus);
        totalPrejuizoResidualHl += Math.abs(diffSkus) * item.fatorHl;
      } else if (diffSkus > 0) {
        totalSobraResidual += diffSkus * item.valorCaixa;
        totalSobraResidualSkus += diffSkus;
        totalSobraResidualHl += diffSkus * item.fatorHl;
      } else {
        totalItensEqualizadosAcurados++;
      }
    });

    const saldoResidualLiquido = totalSobraResidual - totalPrejuizoResidual;
    const divergenciaResidualLiquida = Math.max(0, totalPrejuizoResidual - totalSobraResidual);
    const divergenciaResidualSkus = Math.abs(totalPrejuizoResidualSkus - totalSobraResidualSkus);
    const superavitLiquido = Math.max(0, totalSobraResidual - totalPrejuizoResidual);
    const acuracidadeEqualizadaPct = totalItensValidos > 0 
      ? Math.max(0, Math.min(100, (totalItensEqualizadosAcurados / totalItensValidos) * 100))
      : 100;

    // Saldo Residual antes de sobras (apenas pós-fatores operacionais)
    const residualAposFatores = Math.max(0, totalPrejuizoConciliacaoBruto - totalAmortizadoValor);

    const percentualAmortizadoOperacional = totalPrejuizoConciliacaoBruto > 0 
      ? Math.min(100, (totalAmortizadoValor / totalPrejuizoConciliacaoBruto) * 100) 
      : 100;
    const percentualAmortizadoSobras = totalPrejuizoConciliacaoBruto > 0 
      ? Math.min(100, (totalSobraResidual / totalPrejuizoConciliacaoBruto) * 100) 
      : 0;
    const percentualAmortizadoTotal = totalPrejuizoConciliacaoBruto > 0 
      ? Math.min(100, ((totalPrejuizoConciliacaoBruto - divergenciaResidualLiquida) / totalPrejuizoConciliacaoBruto) * 100) 
      : 100;

    // Equalized Physical vs System units
    const totalPerdasOperacionaisUnits = totalQuebrasQtd + totalValesQtd + totalTrocasQtd + totalFaltasQtd;
    const estoqueEqualizadoUnits = totalDisponivelUnits - totalPerdasOperacionaisUnits;
    const divergenciaResidualUnits = totalInventarioUnits - estoqueEqualizadoUnits;

    return {
      totalItens: filteredStock.length,
      acuracidadePct,
      acuracidadeEqualizadaPct,
      totalDisponivelUnits,
      totalInventarioUnits,
      totalDisponivelSkus,
      totalInventarioSkus,
      valorTotalEstoqueFisico,
      valorTotalEstoqueDisponivel,
      totalPrejuizoConciliacao: totalPrejuizoConciliacaoBruto,
      totalSobraConciliacao: totalSobraConciliacaoBruto,
      totalSobraSkus,
      totalSobraHl,
      totalPrejuizoHl,
      totalDiferencaHl,
      totalItensComFalta,
      totalItensComSobra,
      totalItensAcurados,
      totalQuebrasValor,
      totalQuebrasHl,
      totalQuebrasQtd,
      totalQuebrasPendentesCount,
      totalQuebrasFaturadasValor,
      totalQuebrasFaturadasHl,
      totalQuebrasFaturadasQtd,
      totalQuebrasFaturadasCount,
      totalValesValor,
      totalValesHl,
      totalValesQtd,
      totalTrocasValor,
      totalTrocasHl,
      totalTrocasQtd,
      totalFaltasValor,
      totalFaltasHl,
      totalFaltasQtd,
      prejuizoGeral,
      volumeHlGeral,
      totalAmortizadoValor,
      totalAmortizadoSkus,
      totalCompensacaoGlobalValor: totalAmortizadoValor + totalSobraResidual,
      totalCompensacaoGlobalSkus: totalAmortizadoSkus + totalSobraResidualSkus,
      totalPrejuizoSkusBruto,
      totalPrejuizoResidual,
      totalSobraResidual,
      totalPrejuizoResidualSkus,
      totalSobraResidualSkus,
      totalPrejuizoResidualHl,
      totalSobraResidualHl,
      saldoResidualLiquido,
      residualAposFatores,
      divergenciaResidualLiquida,
      divergenciaResidualSkus,
      superavitLiquido,
      percentualAmortizadoOperacional,
      percentualAmortizadoSobras,
      percentualAmortizadoTotal,
      percentualAmortizado: percentualAmortizadoTotal,
      totalPerdasOperacionaisUnits,
      estoqueEqualizadoUnits,
      divergenciaResidualUnits,
    };
  }, [filteredStock, pendingQuebras, faturadasQuebras, filteredVales, filteredTrocas, filteredFaltas, weeklyBillingStatus]);

  // Computed ranking items reflecting either "Sem Ajuste" (físico bruto) or "Com Ajuste" (físico + soma de todos os desvios)
  const rankingItems = useMemo(() => {
    return filteredStock.map(item => {
      const sku = String(item.produto).trim();
      const fator = Math.max(1, item.fatorSku || 1);

      // Desvios obtidos do cache unificado (garantia de 100% de paridade com o Painel Geral)
      const dev = skuDeviationsMap.get(`${item.deposito}-${sku}`) || calculateSkuDeviations(
        sku,
        item.deposito,
        fator,
        item.valorUnitario,
        item.valorCaixa,
        item.fatorHl,
        pendingQuebras,
        pendingVales,
        pendingTrocas,
        filteredFaltas,
        weeklyBillingStatus
      );

      // Todas as guias somam uma quantidade de desvios unificada e coerente:
      const totalDesviosSkus = dev.total.skus;
      const totalDesviosUnits = dev.total.units;
      const desviosRaw = dev.total.raw;

      // Físico contado no inventário
      const fisicoUnits = item.inventarioTotalUnits;
      const fisicoRaw = item.inventarioRaw || formatSkuUnit(fisicoUnits, fator);

      // Quantidade Final: o estoque físico soma todos os desvios
      const finalUnits = fisicoUnits + totalDesviosUnits;
      const finalRaw = formatSkuUnit(finalUnits, fator);

      // Fiscal (Disponível 02.05.02)
      const fiscalUnits = item.disponivelTotalUnits;
      const fiscalRaw = item.disponivelRaw || formatSkuUnit(fiscalUnits, fator);

      // Divergência conforme o modo selecionado no botão dos rankings:
      let diferencaUnits = 0;
      let diferencaRaw = '0/00';
      let diferencaSkus = 0;
      let prejuizoFinanceiro = 0;
      let sobraFinanceira = 0;
      let impactoHl = 0;

      if (rankingAdjustmentMode === 'com_ajuste') {
        // COM AJUSTE: (Físico + Desvios) - Fiscal
        let diff = finalUnits - fiscalUnits;
        if (item.saldoNegativoDesconsiderado || fiscalUnits < 0) {
          diff = 0;
        }
        const wholeSkus = Math.trunc(diff / fator);

        // REGRA AMBEV: A conciliação financeira é realizada em cima dos SKUs fechados.
        // As divergências físicas preservam e exibem tanto os SKUs fechados quanto as Unidades avulsas.
        if (wholeSkus === 0) {
          diferencaUnits = diff;
          diferencaSkus = 0;
          diferencaRaw = diff === 0 ? '0/00' : formatSkuUnit(Math.abs(diff), fator);
          prejuizoFinanceiro = 0;
          sobraFinanceira = 0;
          impactoHl = 0;
        } else {
          diferencaUnits = diff;
          diferencaSkus = Math.abs(wholeSkus);
          diferencaRaw = formatSkuUnit(Math.abs(diff), fator);
          impactoHl = wholeSkus * item.fatorHl;

          if (wholeSkus < 0) {
            prejuizoFinanceiro = Math.abs(wholeSkus) * item.valorCaixa;
            sobraFinanceira = 0;
          } else {
            prejuizoFinanceiro = 0;
            sobraFinanceira = wholeSkus * item.valorCaixa;
          }
        }
      } else {
        // SEM AJUSTE: Reflete rigorosamente o relatório 02.05.02 importado
        const skus = Math.abs(item.diferencaSkus || 0);
        diferencaUnits = item.diferencaTotalUnits;
        diferencaSkus = skus;
        const rawClean = (item.diferencaRaw || '').replace(/^[+-]/, '').trim();
        diferencaRaw = rawClean && rawClean !== '0/00'
          ? rawClean
          : (item.diferencaTotalUnits !== 0 ? formatSkuUnit(Math.abs(item.diferencaTotalUnits), fator) : '0/00');
        prejuizoFinanceiro = item.prejuizoFinanceiro;
        sobraFinanceira = item.sobraFinanceira;
        impactoHl = item.impactoHl;
      }

      return {
        id: item.id,
        produto: item.produto,
        descricao: item.descricao,
        fatorSku: fator,
        fatorHl: item.fatorHl,
        valorUnitario: item.valorUnitario,
        deposito: item.deposito,

        fisicoUnits,
        fisicoRaw,

        totalDesviosSkus,
        totalDesviosUnits,
        desviosRaw,
        quebrasSkus: dev.quebras.skus,
        valesSkus: dev.vales.skus,
        trocasSkus: dev.trocas.skus,
        faltasSkus: dev.faltas.skus,

        finalUnits,
        finalRaw,

        fiscalUnits,
        fiscalRaw,

        diferencaUnits,
        diferencaRaw,
        diferencaSkus,
        prejuizoFinanceiro,
        sobraFinanceira,
        impactoHl,
      };
    });
  }, [filteredStock, skuDeviationsMap, rankingAdjustmentMode, pendingQuebras, pendingVales, pendingTrocas, filteredFaltas, weeklyBillingStatus]);

  // Ranking Top Faltas (Prejuízo) e Sobras de acordo com rankingLimit e rankingAdjustmentMode
  // REGRA DO USUÁRIO: Exibir estritamente SKUs fechados (sem avulsas na listagem), mas os valores financeiros refletem 100% da conciliação
  const allRankingFaltas = useMemo(() => {
    return [...rankingItems]
      .filter(item => (item.diferencaUnits < 0 || item.prejuizoFinanceiro > 0) && (item.diferencaSkus > 0 || getDivergenciaSkuFechado(item, false) > 0))
      .sort((a, b) => {
        if (b.prejuizoFinanceiro !== a.prejuizoFinanceiro) {
          return b.prejuizoFinanceiro - a.prejuizoFinanceiro;
        }
        return Math.abs(b.diferencaUnits) - Math.abs(a.diferencaUnits);
      });
  }, [rankingItems]);

  const allRankingSobras = useMemo(() => {
    return [...rankingItems]
      .filter(item => (item.diferencaUnits > 0 || item.sobraFinanceira > 0) && (item.diferencaSkus > 0 || getDivergenciaSkuFechado(item, true) > 0))
      .sort((a, b) => {
        if (b.sobraFinanceira !== a.sobraFinanceira) {
          return b.sobraFinanceira - a.sobraFinanceira;
        }
        return Math.abs(b.diferencaUnits) - Math.abs(a.diferencaUnits);
      });
  }, [rankingItems]);

  const rankingFaltas = useMemo(() => {
    return rankingLimit === 'ALL' ? allRankingFaltas : allRankingFaltas.slice(0, rankingLimit);
  }, [allRankingFaltas, rankingLimit]);

  const rankingSobras = useMemo(() => {
    return rankingLimit === 'ALL' ? allRankingSobras : allRankingSobras.slice(0, rankingLimit);
  }, [allRankingSobras, rankingLimit]);

  // REGRA DO USUÁRIO: Independente da quantidade de itens filtrados (Top 10, Top 15 ou seleção),
  // o valor final é o mesmo como se TODOS os itens tivessem entrado na conciliação.
  const totalPrejuizoGeralFaltas = useMemo(() => {
    return rankingAdjustmentMode === 'com_ajuste'
      ? stats.totalPrejuizoResidual
      : stats.totalPrejuizoConciliacao;
  }, [rankingAdjustmentMode, stats.totalPrejuizoResidual, stats.totalPrejuizoConciliacao]);

  const totalValorGeralSobras = useMemo(() => {
    return rankingAdjustmentMode === 'com_ajuste'
      ? stats.totalSobraResidual
      : stats.totalSobraConciliacao;
  }, [rankingAdjustmentMode, stats.totalSobraResidual, stats.totalSobraConciliacao]);

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

        {/* KPI 6: Divergência Residual */}
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Divergência Residual</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className={`text-xl font-bold font-mono tracking-tight truncate ${stats.divergenciaResidualLiquida > 0 ? 'text-purple-800' : 'text-emerald-600'}`}>
              {formatCurrency(stats.divergenciaResidualLiquida)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Saldo Pós-Fatores & Sobras
            </p>
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
                  {filteredFaltas.length} reg.
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
                  filteredFaltas.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Nenhum registro de falta mapeada neste depósito.</p>
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
                        {filteredFaltas.map((f) => (
                          <tr key={f.id} className="hover:bg-indigo-50/30 text-slate-700">
                            <td className="py-1.5 px-2 text-[11px]">{f.data ? new Date(f.data).toLocaleDateString('pt-BR') : '-'}</td>
                            <td className="py-1.5 px-2 font-bold">{f.deposito || selectedDeposito}</td>
                            <td className="py-1.5 px-2 font-bold text-slate-900">{f.produto || f.codigo}</td>
                            <td className="py-1.5 px-2 font-sans truncate max-w-xs">{f.descricao}</td>
                            <td className="py-1.5 px-2 text-center font-bold text-indigo-800">{f.quantidade}</td>
                            <td className="py-1.5 px-2 text-right font-bold text-indigo-800">R$ {(f.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-1.5 px-2 font-sans text-slate-600 text-[11px] truncate max-w-xs">{f.motivo || f.observacao || f.origem || '-'}</td>
                          </tr>
                        ))}
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
              onClick={() => onNavigateTab(rankingAdjustmentMode === 'com_ajuste' ? 'conciliacao_ajustes' : 'conciliacao')}
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
              saldoFinalGeral={totalValorGeralSobras - totalPrejuizoGeralFaltas}
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
