import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp,
  Download,
  Building2,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Info,
  HelpCircle,
  Clock,
  ShieldCheck,
  Eye,
  FolderDown,
  Camera,
  Maximize2,
  PlusCircle,
  Scale,
  Table2
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
  ViewTab
} from '../types';
import { formatCurrency, formatHectoliters, formatSkuUnit, formatPromaxSkuDiff, formatNumber, calcularDivergencia } from '../utils/parsers';
import { calculateSkuDeviations } from '../utils/desviosUtils';
import { DEPOSITOS } from '../data/initialData';
import { ItemDesviosModal } from './ItemDesviosModal';
import { exportConciliacaoExcel } from '../utils/excelReconciliationExport';
import { RecontagemRankingsModal } from './RecontagemRankingsModal';
import { RecontagemExportSheet } from './RecontagemExportSheet';
import { computeDashboardRankingItems } from '../utils/rankingUtils';

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
  onOpenImportModal: (initialFile?: '020502' | '021101' | 'quebras' | 'vales' | 'trocas' | 'faltas') => void;
  onOpenSaveModal?: () => void;
  onOpenManualModal?: (type?: 'quebra' | 'vale' | 'troca' | 'falta') => void;
  weeklyBillingStatus?: Record<string, 'PENDENTE' | 'OK'>;
}

type FilterStatusAjustado = 'ALL' | 'COM_DESVIOS' | 'FALTAS_RESIDUAIS' | 'SOBRAS_RESIDUAIS' | 'CONCILIADOS';

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
  isRecountApplied,
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
  const [sortField, setSortField] = useState<'prejuizo' | 'sobra' | 'desvios' | 'produto' | 'descricao' | 'hl'>('prejuizo');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeTooltipSku, setActiveTooltipSku] = useState<string | null>(null);
  const [selectedItemForOverview, setSelectedItemForOverview] = useState<ItemConciliacaoAjustada | null>(null);
  const [isRecontagemModalOpen, setIsRecontagemModalOpen] = useState(false);
  const [selectedRecountIds, setSelectedRecountIds] = useState<Set<string>>(new Set());
  // Alternador de layout: 'lado_a_lado' (Faltas na esquerda e Sobras na direita - todas) vs 'tabela' (tabela detalhada com ajustes)
  const [viewLayout, setViewLayout] = useState<'lado_a_lado' | 'tabela'>('lado_a_lado');

  const rankingItems = useMemo(() => {
    return computeDashboardRankingItems(
      stockPositions,
      quebras,
      vales,
      trocas,
      faltasMapeadas,
      'com_ajuste',
      selectedDeposito,
      weeklyBillingStatus
    );
  }, [stockPositions, quebras, vales, trocas, faltasMapeadas, selectedDeposito, weeklyBillingStatus]);

  // TODAS AS FALTAS COM AJUSTES (sem limitação de corte, ordenadas por maior prejuízo residual)
  const allRankingFaltas = useMemo(() => {
    return [...rankingItems]
      .filter(item => (item.diferencaUnits < 0 || item.prejuizoFinanceiro > 0) && (item.diferencaSkus > 0 || Math.abs(item.diferencaUnits) > 0))
      .sort((a, b) => b.prejuizoFinanceiro - a.prejuizoFinanceiro);
  }, [rankingItems]);

  // TODAS AS SOBRAS COM AJUSTES (sem limitação de corte, ordenadas por maior sobra residual)
  const allRankingSobras = useMemo(() => {
    return [...rankingItems]
      .filter(item => (item.diferencaUnits > 0 || item.sobraFinanceira > 0) && (item.diferencaSkus > 0 || Math.abs(item.diferencaUnits) > 0))
      .sort((a, b) => b.sobraFinanceira - a.sobraFinanceira);
  }, [rankingItems]);

  const currentDepositoName = useMemo(() => {
    if (selectedDeposito === 'ALL') return 'Todos os Depósitos';
    const dep = DEPOSITOS.find(d => d.id === selectedDeposito);
    return dep ? dep.nome : `Depósito ${selectedDeposito}`;
  }, [selectedDeposito]);

  const totalGeralPrejuizoFaltas = useMemo(() => {
    return allRankingFaltas.reduce((acc, f) => acc + (f.prejuizoFinanceiro || 0), 0);
  }, [allRankingFaltas]);

  const totalGeralValorSobras = useMemo(() => {
    return allRankingSobras.reduce((acc, s) => acc + (s.sobraFinanceira || 0), 0);
  }, [allRankingSobras]);

  const totalGeralSkusFaltas = useMemo(() => {
    return allRankingFaltas.reduce((acc, f) => acc + (f.diferencaSkus || 0), 0);
  }, [allRankingFaltas]);

  const totalGeralSkusSobras = useMemo(() => {
    return allRankingSobras.reduce((acc, s) => acc + (s.diferencaSkus || 0), 0);
  }, [allRankingSobras]);

  const saldoFinalGeral = totalGeralValorSobras - totalGeralPrejuizoFaltas;
  const saldoFinalSkusGeral = totalGeralSkusSobras - totalGeralSkusFaltas;

  const handleToggleRecountId = (id: string) => {
    setSelectedRecountIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUpdateFisico = (itemId: string, newFisicoRaw: string) => {
    if (!setStockPositions) return;
    setStockPositions(prev => prev.map(p => {
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
    }));
  };

  // 1. Build adjusted inventory items aggregating Quebras, Vales, Trocas and Faltas Mapeadas per SKU
  const adjustedItems = useMemo<ItemConciliacaoAjustada[]>(() => {
    return stockPositions.map(stockItem => {
      const dep = stockItem.deposito;
      const sku = String(stockItem.produto).trim();
      const fator = Math.max(1, stockItem.fatorSku || 1);

      // Cálculo unificado e coerente das origens dos desvios (Quebras em unidades, Trocas, Vales e Faltas)
      const dev = calculateSkuDeviations(
        sku,
        dep,
        fator,
        stockItem.valorUnitario,
        stockItem.valorCaixa,
        stockItem.fatorHl,
        quebras,
        vales,
        trocas,
        faltasMapeadas,
        weeklyBillingStatus
      );

      // Total de Desvios Congelados apurados em SKUs
      const desviosSkus = dev.total.boxesInt;
      const totalDesviosUnits = dev.total.units;
      const desviosRaw = dev.total.raw;
      const valorDesvios = dev.total.valor;
      const hlDesvios = dev.total.volumeHl;

      // 3. Físico Apurado (em SKUs e Unidades)
      const fisicoUnits = stockItem.inventarioTotalUnits;
      const fisicoSkus = stockItem.inventarioSkus !== undefined && stockItem.inventarioSkus !== null
        ? stockItem.inventarioSkus
        : Math.floor(fisicoUnits / fator);
      const valorFisico = (fisicoUnits * (stockItem.valorUnitario || stockItem.valorCaixa / fator));

      // 4. Quantidade Final Real (Físico + Desvios Congelados em SKUs e Unidades)
      const finalTotalUnits = fisicoUnits + totalDesviosUnits;
      const finalSkus = Math.floor(finalTotalUnits / fator);
      const finalRaw = formatSkuUnit(finalTotalUnits, fator);
      const valorFinal = (finalTotalUnits * (stockItem.valorUnitario || stockItem.valorCaixa / fator));

      // 5. Quantidade Fiscal Sistêmica (02.05.02)
      const fiscalUnits = stockItem.disponivelTotalUnits;
      const fiscalSkus = stockItem.disponivelSkus !== undefined && stockItem.disponivelSkus !== null
        ? stockItem.disponivelSkus
        : Math.floor(fiscalUnits / fator);
      const valorFiscal = (fiscalUnits * (stockItem.valorUnitario || stockItem.valorCaixa / fator));

      // REGRA AMBEV PROMAX: Divergência Residual = Quantidade Final (SKUs) - Quantidade Fiscal (SKUs)
      let totalDifResidualUnits = finalTotalUnits - fiscalUnits;
      if (stockItem.saldoNegativoDesconsiderado || fiscalUnits < 0) {
        totalDifResidualUnits = 0;
      }
      let divergenciaResidualSkus = finalSkus - fiscalSkus;
      if (stockItem.saldoNegativoDesconsiderado || fiscalUnits < 0) {
        divergenciaResidualSkus = 0;
      }
      const divergenciaResidualRaw = formatPromaxSkuDiff(totalDifResidualUnits, fator);

      let statusAjustado: 'CONCILIADO' | 'FALTA_RESIDUAL' | 'SOBRA_RESIDUAL' = 'CONCILIADO';
      let impactoFinanceiroResidual = 0;
      let impactoHlResidual = 0;

      if (divergenciaResidualSkus === 0) {
        statusAjustado = 'CONCILIADO';
        impactoFinanceiroResidual = 0;
        impactoHlResidual = 0;
      } else {
        statusAjustado = divergenciaResidualSkus > 0 ? 'SOBRA_RESIDUAL' : 'FALTA_RESIDUAL';
        impactoFinanceiroResidual = divergenciaResidualSkus * stockItem.valorCaixa;
        impactoHlResidual = divergenciaResidualSkus * (stockItem.fatorHl || 0);
      }

      // Análise Contábil Especializada de Amortização (Físico vs Fiscal vs Desvios)
      const difInicialUnits = fisicoUnits - fiscalUnits;
      const difInicialSkus = fisicoSkus - fiscalSkus;
      const diferencaInicialRaw = formatPromaxSkuDiff(difInicialUnits, fator);
      const uPrice = stockItem.valorUnitario || (stockItem.valorCaixa / fator);
      const prejuizoInicial = difInicialUnits < 0 ? Math.abs(difInicialUnits * uPrice) : 0;
      const sobraInicial = difInicialUnits > 0 ? (difInicialUnits * uPrice) : 0;

      // Amortização: quanto a incorporação dos desvios operacionais reduziu a perda inicial
      let skusAmortizados = 0;
      let valorAmortizado = 0;
      if (difInicialSkus < 0 && desviosSkus > 0) {
        skusAmortizados = Math.min(Math.abs(difInicialSkus), desviosSkus);
        valorAmortizado = Math.min(prejuizoInicial, valorDesvios);
      } else if (difInicialUnits < 0 && totalDesviosUnits > 0) {
        const unitsAmortizadas = Math.min(Math.abs(difInicialUnits), totalDesviosUnits);
        skusAmortizados = Math.floor(unitsAmortizadas / fator);
        valorAmortizado = Math.min(prejuizoInicial, unitsAmortizadas * uPrice);
      }

      return {
        deposito: dep,
        produto: sku,
        descricao: stockItem.descricao,
        grupo: stockItem.grupo || 'GERAL',
        fatorSku: fator,
        fatorHl: stockItem.fatorHl,
        valorUnitario: stockItem.valorUnitario,
        valorCaixa: stockItem.valorCaixa,

        fiscalRaw: stockItem.disponivelRaw,
        fiscalSkus,
        fiscalUnits,
        fiscalTotalUnits: fiscalUnits,
        valorFiscal,

        desviosRaw,
        desviosSkus,
        desviosUnits: totalDesviosUnits,
        valorDesvios,
        hlDesvios,
        detalheDesvios: {
          quebrasSkus: dev.quebras.boxesInt,
          quebrasUnits: dev.quebras.units,
          quebrasValor: dev.quebras.valor,
          quebrasRaw: dev.quebras.raw,

          valesSkus: dev.vales.boxesInt,
          valesUnits: dev.vales.units,
          valesValor: dev.vales.valor,
          valesRaw: dev.vales.raw,

          trocasSkus: dev.trocas.boxesInt,
          trocasUnits: dev.trocas.units,
          trocasValor: dev.trocas.valor,
          trocasRaw: dev.trocas.raw,

          faltasSkus: dev.faltas.boxesInt,
          faltasUnits: dev.faltas.units,
          faltasValor: dev.faltas.valor,
          faltasRaw: dev.faltas.raw,
        },

        fisicoRaw: stockItem.inventarioRaw,
        fisicoSkus,
        fisicoUnits,
        fisicoTotalUnits: fisicoUnits,
        valorFisico,

        finalRaw,
        finalTotalUnits,
        finalSkus,
        valorFinal,

        divergenciaResidualUnits: totalDifResidualUnits,
        divergenciaResidualSkus,
        divergenciaResidualRaw,
        statusAjustado,

        impactoFinanceiroResidual,
        impactoHlResidual,
        recontado: stockItem.recontado,

        // Métricas de amortização
        diferencaInicialSkus: difInicialSkus,
        diferencaInicialRaw,
        prejuizoInicial,
        sobraInicial,
        skusAmortizados,
        valorAmortizado,
      };
    });
  }, [stockPositions, quebras, vales, trocas, faltasMapeadas, selectedDeposito, weeklyBillingStatus]);

  // 2. Filter list
  const filteredList = useMemo(() => {
    return adjustedItems.filter(item => {
      // Deposito filter
      if (selectedDeposito !== 'ALL' && item.deposito !== selectedDeposito) {
        return false;
      }

      // Status filter
      if (statusFilter === 'COM_DESVIOS' && item.desviosUnits === 0) return false;
      if (statusFilter === 'FALTAS_RESIDUAIS' && item.statusAjustado !== 'FALTA_RESIDUAL') return false;
      if (statusFilter === 'SOBRAS_RESIDUAIS' && item.statusAjustado !== 'SOBRA_RESIDUAL') return false;
      if (statusFilter === 'CONCILIADOS' && item.statusAjustado !== 'CONCILIADO') return false;

      // Group filter
      if (groupFilter !== 'ALL' && item.grupo !== groupFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSku = item.produto.toLowerCase().includes(term);
        const matchDesc = item.descricao.toLowerCase().includes(term);
        if (!matchSku && !matchDesc) return false;
      }

      return true;
    });
  }, [adjustedItems, selectedDeposito, statusFilter, groupFilter, searchTerm]);

  // 3. Sort list
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      let comp = 0;
      if (sortField === 'prejuizo') {
        // Most negative impact first
        comp = a.impactoFinanceiroResidual - b.impactoFinanceiroResidual;
      } else if (sortField === 'sobra') {
        // Most positive impact first
        comp = b.impactoFinanceiroResidual - a.impactoFinanceiroResidual;
      } else if (sortField === 'desvios') {
        comp = b.desviosUnits - a.desviosUnits;
      } else if (sortField === 'hl') {
        comp = Math.abs(b.impactoHlResidual) - Math.abs(a.impactoHlResidual);
      } else if (sortField === 'produto') {
        comp = parseInt(a.produto, 10) - parseInt(b.produto, 10);
      } else if (sortField === 'descricao') {
        comp = a.descricao.localeCompare(b.descricao);
      }
      return sortAsc ? -comp : comp;
    });
  }, [filteredList, sortField, sortAsc]);

  // 4. KPI Totals
  const kpis = useMemo(() => {
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

    let totalFiscalUnits = 0;
    let totalFinalUnits = 0;
    let totalDesviosUnits = 0;

    // Métricas de Amortização
    let totalPrejuizoInicial = 0;
    let totalSobraInicial = 0;
    let totalValorAmortizado = 0;
    let totalSkusAmortizados = 0;
    let countFaltasIniciais = 0;

    filteredList.forEach(item => {
      totalFiscalValor += item.valorFiscal;
      totalFisicoValor += item.valorFisico;
      totalDesviosValor += item.valorDesvios;
      totalFinalValor += item.valorFinal;

      totalFiscalUnits += item.fiscalTotalUnits;
      totalFinalUnits += item.finalTotalUnits;
      totalDesviosUnits += item.desviosUnits;

      totalPrejuizoInicial += (item.prejuizoInicial || 0);
      totalSobraInicial += (item.sobraInicial || 0);
      totalValorAmortizado += (item.valorAmortizado || 0);
      totalSkusAmortizados += (item.skusAmortizados || 0);

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

    const acuracidadeAjustada = totalFiscalUnits > 0 
      ? Math.min(100, (totalFinalUnits / totalFiscalUnits) * 100) 
      : 100;

    const taxaAmortizacaoGlobal = totalPrejuizoInicial > 0 
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

      // Amortização analítica
      totalPrejuizoInicial,
      totalSobraInicial,
      totalValorAmortizado,
      totalSkusAmortizados,
      countFaltasIniciais,
      taxaAmortizacaoGlobal,
    };
  }, [filteredList]);

  // Distinct groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    stockPositions.forEach(s => { if (s.grupo) set.add(s.grupo); });
    return Array.from(set).sort();
  }, [stockPositions]);

  // Exportação oficial em Excel com guia Sem Ajustes e Com Ajustes
  const handleExportExcel = async () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `Conciliacao_Estoque_Ambev_Com_Ajustes_Dep_${selectedDeposito}_${dateStr}_${timeStr}.xlsx`;

      await exportConciliacaoExcel({
        stockPositions,
        quebras,
        vales,
        trocas,
        faltasMapeadas,
        adjustedItems,
        selectedDeposito,
        filename
      });
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
      alert('Ocorreu um erro ao gerar a planilha Excel da conciliação.');
    }
  };

  return (
    <div className="space-y-5 pb-8">

      {/* Seletor Unificado de Modo: Sem Ajustes vs Com Ajustes */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Visão:</span>
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

            <button
              className="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 bg-teal-600 text-white shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-100" />
              <span>Com Ajustes (Físico + Desvios Equalizados)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Depósito Ativo:</span>
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['ALL', '01', '02', '03', '05', '06', '31'] as const).map(dep => (
              <button
                key={dep}
                onClick={() => setSelectedDeposito(dep)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
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
              Guia: Conciliação com Ajustes Equalizada
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
              {kpis.totalItens} SKUs Analisados
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">
            Conciliação do Fiscal (02.05.02) x Soma do Físico com Desvios Congelados
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl mt-1">
            Nesta visão com ajustes, somamos ao <strong>Inventário Físico</strong> todas as quantidades congeladas em <strong>Quebras</strong>, <strong>Vales de Rota</strong>, <strong>Trocas e Reposições</strong> e <strong>Faltas Mapeadas de Doca</strong>, obtendo a <strong>Quantidade Final Real</strong> e apurando a verdadeira <strong>Divergência Residual</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor Lado a Lado vs Tabela */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-300 rounded-lg shadow-2xs">
            <button
              type="button"
              onClick={() => setViewLayout('lado_a_lado')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                viewLayout === 'lado_a_lado'
                  ? 'bg-[#FFC000] text-slate-950 shadow-xs border border-amber-500 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização lado a lado: Faltas na esquerda e Sobras na direita com todas as sobras e faltas equalizadas"
            >
              <Table2 className="w-3.5 h-3.5 text-slate-950" />
              <span>Lado a Lado (Faltas & Sobras - Todas)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('tabela')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                viewLayout === 'tabela'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tabela detalhada com colunas de desvios e divergência residual"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tabela com Ajustes</span>
            </button>
          </div>

          {onOpenManualModal && (
            <button
              onClick={() => onOpenManualModal('quebra')}
              className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
              title="Inserir lançamento manual de Quebra, Vale, Troca ou Falta"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>+ Inserção Manual</span>
            </button>
          )}

          {onOpenSaveModal && (
            <button
              onClick={onOpenSaveModal}
              className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
              title="Salvar e congelar conciliação do dia, calcular rankings de sobras/faltas e exportar Excel"
            >
              <FolderDown className="w-4 h-4 text-indigo-100" />
              <span>Salvar & Congelar Conciliação</span>
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('congeladas')}
              className="px-3.5 py-2 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center space-x-1.5"
              title="Visualizar Rankings de Sobras e Faltas (com e sem ajustes) e conciliações salvas"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Rankings & Congeladas</span>
            </button>
          )}

          <button
            onClick={() => setIsRecontagemModalOpen(true)}
            className="px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Maximizar Rankings Top 20 de Faltas/Sobras e Exportar Imagem de Recontagem"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Top 20 / Recontagem</span>
            {selectedRecountIds.size > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                {selectedRecountIds.size}
              </span>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold shadow-xs transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
            title="Exportar Planilha Excel com Guia Sem Ajustes e Com Ajustes (Código, Descrição, Qtd Fiscal, Qtd Física e Diferença)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip - Pipeline de Equalização Contábil */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Card 1: Fiscal Sistêmico */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            1. Saldo Fiscal
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-1 truncate">
            {formatCurrency(kpis.totalFiscalValor)}
          </div>
        </div>

        {/* Card 2: Físico Contado */}
        <div className="bg-white border border-blue-200/80 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            2. Físico Contado
          </div>
          <div className="text-base sm:text-lg font-bold text-blue-800 font-mono mt-1 truncate">
            {formatCurrency(kpis.totalFisicoValor)}
          </div>
        </div>

        {/* Card 3: Desvios Rastreados */}
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>3. (+) Desvios</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-amber-700 font-mono mt-1 truncate">
            +{formatCurrency(kpis.totalDesviosValor)}
          </div>
        </div>

        {/* Card 4: Físico + Desvios (Quantidade Final) */}
        <div className="bg-teal-50/40 border border-teal-300 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
            4. (=) Físico + Desvios
          </div>
          <div className="text-base sm:text-lg font-bold text-teal-800 font-mono mt-1 truncate">
            {formatCurrency(kpis.totalFinalValor)}
          </div>
        </div>

        {/* Card 5: Divergência Residual */}
        <div className={`border rounded-xl p-3.5 shadow-2xs ${
          kpis.totalPrejuizoResidual > 0 
            ? 'bg-rose-50/50 border-rose-200' 
            : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>5. Divergência Residual</span>
          </div>
          <div className={`text-base sm:text-lg font-bold font-mono mt-1 truncate ${
            kpis.totalPrejuizoResidual > 0 ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            {kpis.totalPrejuizoResidual > 0 ? `-${formatCurrency(kpis.totalPrejuizoResidual)}` : 'R$ 0,00'}
          </div>
        </div>

        {/* Card 6: Acuracidade Equalizada */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>6. Acuracidade</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono mt-1 truncate">
            {formatNumber(kpis.acuracidadeAjustada, 1)}%
          </div>
        </div>
      </div>

      {/* PAINEL EXECUTIVO DE AMORTIZAÇÃO CONTÁBIL & EQUALIZAÇÃO DO SALDO FINAL */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-700/80 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Auditoria de Amortização de Perdas & Impacto no Saldo Final</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
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
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Taxa de Equalização</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {kpis.taxaAmortizacaoGlobal.toFixed(1)}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center font-mono text-xs font-bold text-emerald-300">
              {kpis.countConciliados}/{kpis.totalItens}
            </div>
          </div>
        </div>

        {/* Pipeline de Amortização Financeira */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Prejuízo Físico Inicial */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                1. Falta Física Inicial
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                Sem Ajustes
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-rose-400 my-1">
              -{formatCurrency(kpis.totalPrejuizoInicial)}
            </div>
            <span className="text-[10px] text-slate-400">
              Identificado em <strong>{kpis.countFaltasIniciais}</strong> SKUs com falta física no depósito
            </span>
          </div>

          {/* 2. Amortização por Desvios Operacionais */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                2. (-) Amortizado por Desvios
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Equalização
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-400 my-1">
              +{formatCurrency(kpis.totalValorAmortizado)}
            </div>
            <span className="text-[10px] text-slate-400">
              <strong>{kpis.totalSkusAmortizados}</strong> caixas amortizadas via Quebras, Vales, Trocas e Faltas
            </span>
          </div>

          {/* 3. Prejuízo Residual Final */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                3. (=) Prejuízo Residual
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                Com Ajustes
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-white my-1">
              {kpis.totalPrejuizoResidual > 0 ? `-${formatCurrency(kpis.totalPrejuizoResidual)}` : 'R$ 0,00'}
            </div>
            <span className="text-[10px] text-slate-400">
              Restam apenas <strong>{kpis.countFaltas}</strong> SKUs com divergência real não justificada
            </span>
          </div>

          {/* 4. Amortização no Saldo Final do Estoque */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                4. Saldo Final Real
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Físico + Desvios
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-purple-300 my-1">
              {formatCurrency(kpis.totalFinalValor)}
            </div>
            <span className="text-[10px] text-slate-400">
              Saldo Fiscal: {formatCurrency(kpis.totalFiscalValor)} • Dif Líquida: {formatCurrency(kpis.saldoLiquidoResidual)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todos ({adjustedItems.length})
          </button>

          <button
            onClick={() => setStatusFilter('COM_DESVIOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              statusFilter === 'COM_DESVIOS'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            <span>Com Desvios Congelados</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-mono">
              {adjustedItems.filter(i => i.desviosUnits > 0).length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('FALTAS_RESIDUAIS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              statusFilter === 'FALTAS_RESIDUAIS'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            <span>Faltas Residuais</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 text-rose-900 font-mono">
              {adjustedItems.filter(i => i.statusAjustado === 'FALTA_RESIDUAL').length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('SOBRAS_RESIDUAIS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              statusFilter === 'SOBRAS_RESIDUAIS'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            <span>Sobras Residuais</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 text-emerald-900 font-mono">
              {adjustedItems.filter(i => i.statusAjustado === 'SOBRA_RESIDUAL').length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('CONCILIADOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              statusFilter === 'CONCILIADOS'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            <span>100% Equalizados</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-200 text-blue-900 font-mono">
              {adjustedItems.filter(i => i.statusAjustado === 'CONCILIADO').length}
            </span>
          </button>
        </div>

        {/* Search and Group dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">Todos os Grupos</option>
            {groups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar SKU ou Descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Condicional de Exibição: Lado a Lado (Faltas na Esquerda & Sobras na Direita - Todas) vs Tabela Completa com Ajustes */}
      {viewLayout === 'lado_a_lado' ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-5 overflow-x-auto shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Divergências Lado a Lado: Faltas (Lado Esquerdo) & Sobras (Lado Direito)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-teal-50 text-teal-800 border border-teal-300">
                  COM AJUSTES: TODAS AS FALTAS ({allRankingFaltas.length}) & SOBRAS ({allRankingSobras.length})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Exibição integral e padronizada lado a lado de 100% das divergências residuais equalizadas no <strong>{currentDepositoName}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
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
            exportFaltas={allRankingFaltas}
            exportSobras={allRankingSobras}
            totalDisplayFaltas={totalGeralPrejuizoFaltas}
            totalDisplaySobras={totalGeralValorSobras}
            saldoFinalDisplay={saldoFinalGeral}
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
          />
        </div>
      ) : (
        /* Main Table: Resumo com Ajustes */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                <th className="py-3 px-3 w-12 text-center">Dep.</th>
                <th 
                  onClick={() => {
                    if (sortField === 'produto') setSortAsc(!sortAsc);
                    else { setSortField('produto'); setSortAsc(false); }
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
                    else { setSortField('descricao'); setSortAsc(false); }
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
                    else { setSortField('desvios'); setSortAsc(false); }
                  }}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-amber-100/50 bg-amber-50/40 text-amber-800 transition"
                  title="Soma de Quebras + Vales + Trocas + Faltas Mapeadas em formato 01/00"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>(+) Desvios Congelados</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-600" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">
                  <span>Conciliação Física</span>
                </th>
                <th className="py-3 px-3 text-right bg-teal-50/40 text-teal-800 font-semibold" title="Soma do Físico com os Desvios Congelados">
                  <span>(=) Físico + Desvios</span>
                </th>
                <th 
                  onClick={() => {
                    if (sortField === 'prejuizo') setSortAsc(!sortAsc);
                    else { setSortField('prejuizo'); setSortAsc(false); }
                  }}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition"
                  title="Divergência entre o fiscal e a soma do físico com os desvios"
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
                    else { setSortField('hl'); setSortAsc(false); }
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
                    <p className="font-semibold text-slate-700">Nenhum produto localizado com estes filtros</p>
                    <p className="text-xs text-slate-400 mt-1">Tente ajustar a busca ou o depósito selecionado</p>
                  </td>
                </tr>
              ) : (
                sortedList.map(item => {
                  const hasDesvios = item.desviosSkus > 0;
                  const isOk = item.statusAjustado === 'CONCILIADO' || item.divergenciaResidualSkus === 0;
                  const isFalta = !isOk && item.statusAjustado === 'FALTA_RESIDUAL';
                  const isSobra = !isOk && item.statusAjustado === 'SOBRA_RESIDUAL';

                  return (
                    <tr 
                      key={`${item.deposito}-${item.produto}`}
                      onClick={() => setSelectedItemForOverview(item)}
                      className={`hover:bg-teal-50/40 transition-colors cursor-pointer group ${
                        isFalta ? 'bg-rose-50/20' : isSobra ? 'bg-blue-50/20' : ''
                      }`}
                      title="Clique na linha para abrir o pop-up com o overview detalhado (Físico, Fiscal, Quebras, Vales, Trocas e Faltas)"
                    >
                      {/* Depósito */}
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-600 bg-slate-50/50">
                        {item.deposito}
                      </td>

                      {/* Código SKU */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {item.produto}
                      </td>

                      {/* Descrição & Metadados */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 line-clamp-1" title={item.descricao}>
                          {item.descricao}
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                            {item.grupo}
                          </span>
                          <span>• Fator: <strong>{item.fatorSku}</strong> cx</span>
                          <span>• Unit: <strong>{formatCurrency(item.valorUnitario)}</strong></span>
                        </div>
                      </td>

                      {/* Quantidade Fiscal (02.05.02) - SKU Fechado */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="flex items-baseline justify-end space-x-1">
                          <span className="font-bold text-sm text-blue-700">
                            {item.fiscalSkus} cx
                          </span>
                          {(item.fiscalUnits % item.fatorSku) > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono" title="Unidades avulsas integradas ao saldo final">
                              ({item.fiscalUnits % item.fatorSku} un)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Soma dos Desvios Congelados - SKU Fechado */}
                      <td className={`py-3 px-3 text-right font-mono relative ${hasDesvios ? 'bg-amber-50/40' : ''}`}>
                        {hasDesvios ? (
                          <div 
                            className="cursor-pointer group inline-block"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItemForOverview(item);
                            }}
                            title="Clique para ver os desvios deste produto"
                          >
                            <div className="flex items-baseline justify-end space-x-1 font-bold text-amber-700">
                              <span className="text-sm">+{item.desviosSkus} cx</span>
                              {(item.desviosUnits % item.fatorSku) > 0 && (
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

                      {/* Conciliação Física - SKU Fechado */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="flex items-baseline justify-end space-x-1">
                          <span className="font-bold text-sm text-slate-800">
                            {item.fisicoSkus} cx
                          </span>
                          {(item.fisicoUnits % item.fatorSku) > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono" title="Unidades avulsas integradas ao saldo final">
                              ({item.fisicoUnits % item.fatorSku} un)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Disponível Final: Físico + Desvios - SKU Fechado */}
                      <td className="py-3 px-3 text-right font-mono bg-teal-50/20">
                        <div className="flex items-baseline justify-end space-x-1">
                          <span className="font-bold text-sm text-teal-800">
                            {item.finalSkus} cx
                          </span>
                          {(item.finalTotalUnits % item.fatorSku) > 0 && (
                            <span className="text-[10px] text-teal-600/70 font-mono">
                              ({item.finalTotalUnits % item.fatorSku} un)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Divergência Residual (Fiscal vs Final) - SKU Fechado */}
                      <td className="py-3 px-3 text-right font-mono">
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
                            <div className={`font-bold text-sm ${isFalta ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {isFalta ? `${item.divergenciaResidualSkus} cx` : `+${item.divergenciaResidualSkus} cx`}
                            </div>
                            {(item.skusAmortizados || 0) > 0 && (
                              <div className="text-[10px] text-amber-600 font-sans font-semibold" title={`Amortizado R$ ${formatCurrency(item.valorAmortizado || 0)}`}>
                                -{item.skusAmortizados} cx amortizadas
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Valoração em Reais */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className={`font-bold ${
                          isOk ? 'text-slate-300' : isFalta ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {isOk ? 'R$ 0,00' : isFalta ? `-${formatCurrency(Math.abs(item.impactoFinanceiroResidual))}` : `+${formatCurrency(item.impactoFinanceiroResidual)}`}
                        </div>
                      </td>

                      {/* Valoração em Hectolitros */}
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-600">
                        {isOk ? <span className="text-slate-300">-</span> : formatHectoliters(item.impactoHlResidual)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isOk && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            ✓ CONCILIADO
                          </span>
                        )}
                        {isFalta && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                            FALTA RESIDUAL
                          </span>
                        )}
                        {isSobra && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                            SOBRA RESIDUAL
                          </span>
                        )}
                      </td>

                      {/* Overview Button */}
                      <td className="py-3 px-3 text-center" onClick={(e) => { e.stopPropagation(); setSelectedItemForOverview(item); }}>
                        <button
                          type="button"
                          className="p-1 rounded-md text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                          title="Detalhar desvios deste SKU"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Exibindo <strong>{sortedList.length}</strong> de <strong>{adjustedItems.length}</strong> produtos cadastrados.
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Conciliado ({adjustedItems.filter(i => i.statusAjustado === 'CONCILIADO').length})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Falta ({adjustedItems.filter(i => i.statusAjustado === 'FALTA_RESIDUAL').length})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Sobra ({adjustedItems.filter(i => i.statusAjustado === 'SOBRA_RESIDUAL').length})</span>
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
        onSelectRecountItem={(id) => handleToggleRecountId(id)}
        selectedRecountIds={selectedRecountIds}
        stockPositions={stockPositions}
        quebras={quebras}
        vales={vales}
        trocas={trocas}
        faltasMapeadas={faltasMapeadas}
        weeklyBillingStatus={weeklyBillingStatus}
        showFiscalFisico={true}
        onUpdateFisico={handleUpdateFisico}
      />
    </div>
  );
};
