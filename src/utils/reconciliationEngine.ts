import {
  StockPositionItem,
  QuebraItem,
  ValeItem,
  TrocaItem,
  FaltaMapeadaItem,
  DepositoId,
  ProductMaster,
  ItemConciliacaoAjustada,
  RankingItem,
} from '../types';
import {
  formatSkuUnit,
  formatPromaxSkuDiff,
  healStockPositionItem,
  normalizeSku,
} from './parsers';
import {
  calculateSkuDeviations,
  SkuDeviationsResult,
  isQuebraPendente,
  isQuebraFaturada,
  isValePendente,
  isTrocaPendente,
  isFaltaPendente,
  getFaltaItemCalculatedValues,
  matchSku,
} from './desviosUtils';
import type { DashboardRankingItem } from '../components/RecontagemRankingsModal';

export type ReconciliationMode = 'sem_ajuste' | 'com_ajuste';

export interface ReconciledRow {
  stockItem: StockPositionItem;
  adjustedItem: ItemConciliacaoAjustada;
  rankingSemAjuste: DashboardRankingItem;
  rankingComAjuste: DashboardRankingItem;
  deviations: SkuDeviationsResult;
  isIgnoredNegative: boolean;
}

export interface ReconciliationModeTotals {
  totalItens: number;
  totalItensValidos: number;
  totalItensSaldoNegativo: number;
  totalItensAcurados: number;
  totalItensComFalta: number;
  totalItensComSobra: number;
  acuracidadePct: number;

  totalFiscalUnits: number;
  totalFiscalSkus: number;
  valorTotalFiscal: number;

  totalFisicoUnits: number;
  totalFisicoSkus: number;
  valorTotalFisico: number;

  totalFinalUnits: number;
  totalFinalSkus: number;
  valorTotalFinal: number;

  totalFaltasValor: number;
  totalSobrasValor: number;
  saldoLiquidoValor: number; // totalSobrasValor - totalFaltasValor
  divergenciaLiquidaFalta: number; // Math.max(0, totalFaltasValor - totalSobrasValor)
  superavitLiquido: number; // Math.max(0, totalSobrasValor - totalFaltasValor)

  totalFaltasSkus: number;
  totalSobrasSkus: number;
  saldoLiquidoSkus: number;

  totalFaltasHl: number;
  totalSobrasHl: number;
  saldoLiquidoHl: number;
}

export interface DesviosOperacionaisSummary {
  pendingQuebras: QuebraItem[];
  faturadasQuebras: QuebraItem[];
  pendingVales: ValeItem[];
  pendingTrocas: TrocaItem[];
  pendingFaltas: FaltaMapeadaItem[];

  totalQuebrasValor: number;
  totalQuebrasHl: number;
  totalQuebrasQtd: number;
  totalQuebrasPendentesCount: number;

  totalQuebrasFaturadasValor: number;
  totalQuebrasFaturadasHl: number;
  totalQuebrasFaturadasQtd: number;
  totalQuebrasFaturadasCount: number;

  totalValesValor: number;
  totalValesHl: number;
  totalValesQtd: number;

  totalTrocasValor: number;
  totalTrocasHl: number;
  totalTrocasQtd: number;

  totalFaltasMapeadasValor: number;
  totalFaltasMapeadasHl: number;
  totalFaltasMapeadasQtd: number;

  totalDesviosValor: number; // Soma de todos os desvios pendentes no depósito selecionado
  totalDesviosVinculadosEstoqueValor: number; // Soma de valorDesvios dos SKUs presentes na 02.05.02
  totalValorEfetivamenteAmortizado: number; // Soma da redução real de falta física (semAjustePrejuizo - comAjustePrejuizo)
  totalSkusEfetivamenteAmortizados: number;
}

export interface ReconciliationEngineResult {
  rows: ReconciledRow[];
  healedStock: StockPositionItem[];
  adjustedItems: ItemConciliacaoAjustada[];

  rankingItemsSemAjuste: DashboardRankingItem[];
  rankingItemsComAjuste: DashboardRankingItem[];

  rankingFaltasSemAjuste: DashboardRankingItem[];
  rankingSobrasSemAjuste: DashboardRankingItem[];
  rankingFaltasComAjuste: DashboardRankingItem[];
  rankingSobrasComAjuste: DashboardRankingItem[];

  excelRankingFaltasSemAjustes: RankingItem[];
  excelRankingSobrasSemAjustes: RankingItem[];
  excelRankingFaltasComAjustes: RankingItem[];
  excelRankingSobrasComAjustes: RankingItem[];

  totalsSemAjuste: ReconciliationModeTotals;
  totalsComAjuste: ReconciliationModeTotals;
  desviosSummary: DesviosOperacionaisSummary;
}

export interface ReconcileAllStockParams {
  stockPositions: StockPositionItem[];
  quebras?: QuebraItem[];
  vales?: ValeItem[];
  trocas?: TrocaItem[];
  faltasMapeadas?: FaltaMapeadaItem[];
  selectedDeposito: DepositoId | 'ALL';
  weeklyBillingStatus?: Record<string, 'PENDENTE' | 'OK'>;
  productsMap?: Map<string, ProductMaster>;
}

const EMPTY_DEVIATIONS: SkuDeviationsResult = {
  quebras: { units: 0, skus: 0, boxesInt: 0, looseUnits: 0, raw: '0/00', valor: 0, volumeHl: 0, count: 0 },
  trocas: { units: 0, skus: 0, boxesInt: 0, looseUnits: 0, raw: '0/00', valor: 0, volumeHl: 0, count: 0 },
  vales: { units: 0, skus: 0, boxesInt: 0, looseUnits: 0, raw: '0/00', valor: 0, volumeHl: 0, count: 0 },
  faltas: { units: 0, skus: 0, boxesInt: 0, looseUnits: 0, raw: '0/00', valor: 0, volumeHl: 0, count: 0 },
  total: { units: 0, skus: 0, boxesInt: 0, looseUnits: 0, raw: '0/00', valor: 0, volumeHl: 0, count: 0 },
};

/**
 * Motor Único Canônico de Conciliação Contábil e Física (Padrão Promax Ambev DPO).
 *
 * Regras Invariantes Garantidas em 100% das Telas, Modais e Exportações:
 * 1. Identidade de Custo: valorCaixa === valorUnitario * fatorSku (priorizando Custo Médio da 02.05.02).
 * 2. Apuração Estrita por SKU Fechado: difSkus = Math.trunc(difUnits / fatorSku).
 *    Unidades avulsas após a barra são preservadas em diferencaRaw para conferência,
 *    porém NUNCA geram falta/sobra financeira quando difSkus === 0.
 * 3. Mesma Fórmula Exata para Sem Ajuste e Com Ajustes:
 *    - Sem Ajuste: difUnits = fisicoUnits - fiscalUnits
 *    - Com Ajustes: difUnits = (fisicoUnits + desviosPendentesUnits) - fiscalUnits
 *    Se um SKU possui 0 desvios pendentes, seu resultado Sem Ajuste e Com Ajustes é 100% idêntico.
 * 4. Atribuição Determinística de Desvios por Depósito:
 *    - Sem duplicidade (mesmo que o SKU exista em múltiplos depósitos ou o desvio não tenha depósito).
 *    - Sem perda de desvios lançados em depósitos auxiliares (ex: 31 PNC / 05 Doca) quando "Todos os Depósitos" ('ALL') está ativo.
 */
export function reconcileAllStock({
  stockPositions,
  quebras = [],
  vales = [],
  trocas = [],
  faltasMapeadas = [],
  selectedDeposito,
  weeklyBillingStatus,
  productsMap,
}: ReconcileAllStockParams): ReconciliationEngineResult {
  // 1. Filtra posições de estoque pelo depósito selecionado e aplica cura de identidade contábil em tempo real
  const rawFilteredStock = selectedDeposito === 'ALL'
    ? stockPositions
    : stockPositions.filter(s => s.deposito === selectedDeposito);

  const healedStock = rawFilteredStock.map(s => healStockPositionItem(s, productsMap));

  // 2. Filtra desvios operacionais pelo depósito selecionado e separa pendentes x faturados
  const depQuebras = selectedDeposito === 'ALL'
    ? quebras
    : quebras.filter(q => q.deposito === selectedDeposito);
  const pendingQuebras = depQuebras.filter(q => isQuebraPendente(q, weeklyBillingStatus));
  const faturadasQuebras = depQuebras.filter(q => isQuebraFaturada(q, weeklyBillingStatus));

  const depVales = selectedDeposito === 'ALL'
    ? vales
    : vales.filter(v => !v.deposito || v.deposito === selectedDeposito);
  const pendingVales = depVales.filter(v => isValePendente(v, weeklyBillingStatus));

  const depTrocas = selectedDeposito === 'ALL'
    ? trocas
    : trocas.filter(t => !t.deposito || t.deposito === selectedDeposito);
  const pendingTrocas = depTrocas.filter(t => isTrocaPendente(t, weeklyBillingStatus));

  const depFaltas = selectedDeposito === 'ALL'
    ? faltasMapeadas
    : faltasMapeadas.filter(f => !f.deposito || f.deposito === selectedDeposito);
  const pendingFaltas = depFaltas.filter(f => isFaltaPendente(f, weeklyBillingStatus));

  // 3. Indexa depósitos disponíveis na 02.05.02 por SKU limpo para atribuição sem duplicidade nem órfãos
  const skuStockDepsMap = new Map<string, Set<DepositoId>>();
  const primaryRowIdBySku = new Map<string, string>();
  const primaryRowIdBySkuAndDep = new Map<string, string>();

  healedStock.forEach(item => {
    const cleanSku = normalizeSku(item.produto);
    if (!skuStockDepsMap.has(cleanSku)) {
      skuStockDepsMap.set(cleanSku, new Set());
    }
    skuStockDepsMap.get(cleanSku)!.add(item.deposito);

    const depKey = `${cleanSku}::${item.deposito}`;
    if (!primaryRowIdBySkuAndDep.has(depKey)) {
      primaryRowIdBySkuAndDep.set(depKey, item.id);
    }

    const currentPrimaryId = primaryRowIdBySku.get(cleanSku);
    if (!currentPrimaryId) {
      primaryRowIdBySku.set(cleanSku, item.id);
    } else {
      const currentPrimary = healedStock.find(s => s.id === currentPrimaryId);
      if (currentPrimary && currentPrimary.deposito !== '01' && item.deposito === '01') {
        primaryRowIdBySku.set(cleanSku, item.id);
      }
    }
  });

  const shouldAttributeDeviationToRow = (
    devDeposito: DepositoId | undefined,
    cleanSku: string,
    row: StockPositionItem
  ): boolean => {
    const depKey = `${cleanSku}::${row.deposito}`;
    // Evita dupla contagem caso existam duas linhas para o mesmo (SKU, Depósito)
    if (primaryRowIdBySkuAndDep.get(depKey) !== row.id) {
      return false;
    }

    const isPrimarySkuRow = primaryRowIdBySku.get(cleanSku) === row.id;
    const stockDepsForSku = skuStockDepsMap.get(cleanSku);

    if (selectedDeposito === 'ALL') {
      if (devDeposito && stockDepsForSku?.has(devDeposito)) {
        return devDeposito === row.deposito;
      }
      // Desvio sem depósito ou lançado em depósito auxiliar sem linha própria na 02.05.02 (ex: 31 PNC / 05 Doca)
      return isPrimarySkuRow;
    }

    // Depósito específico selecionado
    if (!devDeposito) {
      return isPrimarySkuRow;
    }
    return devDeposito === row.deposito;
  };

  // 4. Processa cada item do estoque unificando Sem Ajuste e Com Ajustes
  const rows: ReconciledRow[] = [];

  // Acumuladores Sem Ajuste
  let saItensSaldoNegativo = 0;
  let saItensAcurados = 0;
  let saItensComFalta = 0;
  let saItensComSobra = 0;
  let saFiscalUnits = 0;
  let saFiscalSkus = 0;
  let saValorFiscal = 0;
  let saFisicoUnits = 0;
  let saFisicoSkus = 0;
  let saValorFisico = 0;
  let saFaltasValor = 0;
  let saSobrasValor = 0;
  let saFaltasSkus = 0;
  let saSobrasSkus = 0;
  let saFaltasHl = 0;
  let saSobrasHl = 0;

  // Acumuladores Com Ajuste
  let caItensAcurados = 0;
  let caItensComFalta = 0;
  let caItensComSobra = 0;
  let caFinalUnits = 0;
  let caFinalSkus = 0;
  let caValorFinal = 0;
  let caFaltasValor = 0;
  let caSobrasValor = 0;
  let caFaltasSkus = 0;
  let caSobrasSkus = 0;
  let caFaltasHl = 0;
  let caSobrasHl = 0;

  let totalDesviosVinculadosEstoqueValor = 0;
  let totalValorEfetivamenteAmortizado = 0;
  let totalSkusEfetivamenteAmortizados = 0;

  healedStock.forEach(item => {
    const cleanSku = normalizeSku(item.produto);
    const fator = Math.max(1, item.fatorSku || 1);
    const valorUnitario = item.valorUnitario;
    const valorCaixa = item.valorCaixa; // === valorUnitario * fator
    const fatorHl = item.fatorHl || 0;

    // Filtra apenas os desvios atribuídos a esta linha específica (zero dupla contagem)
    const rowQuebras = pendingQuebras.filter(
      q => matchSku(q.sku, cleanSku) && shouldAttributeDeviationToRow(q.deposito, cleanSku, item)
    );
    const rowVales = pendingVales.filter(v => {
      const skuCandidate = (v as any).sku || (v as any).codigos || v.codigo;
      return matchSku(skuCandidate, cleanSku) && shouldAttributeDeviationToRow(v.deposito, cleanSku, item);
    });
    const rowTrocas = pendingTrocas.filter(t => {
      const codes = (t.codigos || '').split(/[,;|\s]+/).map(c => c.trim()).filter(Boolean);
      const matches = codes.some(c => matchSku(c, cleanSku)) || matchSku(t.sku, cleanSku);
      return matches && shouldAttributeDeviationToRow(t.deposito, cleanSku, item);
    });
    const rowFaltas = pendingFaltas.filter(
      f => matchSku(f.codigo || f.produto, cleanSku) && shouldAttributeDeviationToRow(f.deposito, cleanSku, item)
    );

    const hasAnyRowDeviation =
      rowQuebras.length > 0 || rowVales.length > 0 || rowTrocas.length > 0 || rowFaltas.length > 0;

    const dev: SkuDeviationsResult = hasAnyRowDeviation
      ? calculateSkuDeviations(
          cleanSku,
          'ALL', // já filtrado deterministicamente por linha acima
          fator,
          valorUnitario,
          valorCaixa,
          fatorHl,
          rowQuebras,
          rowVales,
          rowTrocas,
          rowFaltas,
          weeklyBillingStatus
        )
      : EMPTY_DEVIATIONS;

    const fiscalUnits = item.disponivelTotalUnits;
    const fiscalSkus = item.disponivelSkus;
    const fiscalRaw = item.disponivelRaw || formatSkuUnit(fiscalUnits, fator);

    const fisicoUnits = item.inventarioTotalUnits;
    const fisicoSkus = item.inventarioSkus;
    const fisicoRaw = item.inventarioRaw || formatSkuUnit(fisicoUnits, fator);

    const desviosUnits = dev.total.units;
    const desviosSkusFloat = dev.total.skus;
    const desviosBoxesInt = dev.total.boxesInt;
    const desviosRaw = dev.total.raw;
    const valorDesvios = dev.total.valor;
    const hlDesvios = dev.total.volumeHl;

    const finalUnits = fisicoUnits + desviosUnits;
    const finalSkus = Math.trunc(finalUnits / fator);
    const finalRaw = formatSkuUnit(finalUnits, fator);

    const isIgnoredNegative = Boolean(item.saldoNegativoDesconsiderado || fiscalUnits < 0);

    // =========================================================================
    // A. CÁLCULO SEM AJUSTE (Físico vs Fiscal - Regra SKU Fechado Promax)
    // =========================================================================
    const saDiffUnits = isIgnoredNegative ? 0 : (fisicoUnits - fiscalUnits);
    const saSignedSkus = isIgnoredNegative ? 0 : Math.trunc(saDiffUnits / fator);
    const saAbsSkus = Math.abs(saSignedSkus);
    const saPromaxRaw = isIgnoredNegative ? '0/00' : formatPromaxSkuDiff(saDiffUnits, fator);
    const saRankingRaw = saDiffUnits === 0 ? '0/00' : formatSkuUnit(Math.abs(saDiffUnits), fator);
    const saPrejuizo = saSignedSkus < 0 ? saAbsSkus * valorCaixa : 0;
    const saSobra = saSignedSkus > 0 ? saAbsSkus * valorCaixa : 0;
    const saImpactoHl = saSignedSkus * fatorHl;

    // =========================================================================
    // B. CÁLCULO COM AJUSTES ((Físico + Desvios) vs Fiscal - Regra SKU Fechado Promax)
    // =========================================================================
    const caDiffUnits = isIgnoredNegative ? 0 : (finalUnits - fiscalUnits);
    const caSignedSkus = isIgnoredNegative ? 0 : Math.trunc(caDiffUnits / fator);
    const caAbsSkus = Math.abs(caSignedSkus);
    const caPromaxRaw = isIgnoredNegative ? '0/00' : formatPromaxSkuDiff(caDiffUnits, fator);
    const caRankingRaw = caDiffUnits === 0 ? '0/00' : formatSkuUnit(Math.abs(caDiffUnits), fator);
    const caPrejuizo = caSignedSkus < 0 ? caAbsSkus * valorCaixa : 0;
    const caSobra = caSignedSkus > 0 ? caAbsSkus * valorCaixa : 0;
    const caImpactoFin = caSignedSkus * valorCaixa;
    const caImpactoHl = caSignedSkus * fatorHl;
    const statusAjustado: 'CONCILIADO' | 'FALTA_RESIDUAL' | 'SOBRA_RESIDUAL' =
      caSignedSkus < 0 ? 'FALTA_RESIDUAL' : caSignedSkus > 0 ? 'SOBRA_RESIDUAL' : 'CONCILIADO';

    // Valor contábil de estoque em caixas fechadas (mesmo critério em todas as telas)
    const valorFiscal = isIgnoredNegative ? 0 : fiscalSkus * valorCaixa;
    const valorFisico = isIgnoredNegative ? 0 : fisicoSkus * valorCaixa;
    const valorFinal = isIgnoredNegative ? 0 : finalSkus * valorCaixa;

    // Métricas analíticas exatas de amortização (redução efetiva da falta em SKUs fechados)
    const faltaSkusInicial = saSignedSkus < 0 ? saAbsSkus : 0;
    const faltaSkusResidual = caSignedSkus < 0 ? caAbsSkus : 0;
    const skusAmortizados = Math.max(0, faltaSkusInicial - faltaSkusResidual);
    const valorAmortizado = Math.max(0, saPrejuizo - caPrejuizo);

    // Acumulação nos totais oficiais
    if (isIgnoredNegative) {
      saItensSaldoNegativo++;
    } else {
      saFiscalUnits += fiscalUnits;
      saFiscalSkus += fiscalSkus;
      saValorFiscal += valorFiscal;

      saFisicoUnits += fisicoUnits;
      saFisicoSkus += fisicoSkus;
      saValorFisico += valorFisico;

      caFinalUnits += finalUnits;
      caFinalSkus += finalSkus;
      caValorFinal += valorFinal;

      totalDesviosVinculadosEstoqueValor += valorDesvios;
      totalValorEfetivamenteAmortizado += valorAmortizado;
      totalSkusEfetivamenteAmortizados += skusAmortizados;

      if (saSignedSkus < 0) {
        saItensComFalta++;
        saFaltasValor += saPrejuizo;
        saFaltasSkus += saAbsSkus;
        saFaltasHl += Math.abs(saImpactoHl);
      } else if (saSignedSkus > 0) {
        saItensComSobra++;
        saSobrasValor += saSobra;
        saSobrasSkus += saAbsSkus;
        saSobrasHl += saImpactoHl;
      } else {
        saItensAcurados++;
      }

      if (caSignedSkus < 0) {
        caItensComFalta++;
        caFaltasValor += caPrejuizo;
        caFaltasSkus += caAbsSkus;
        caFaltasHl += Math.abs(caImpactoHl);
      } else if (caSignedSkus > 0) {
        caItensComSobra++;
        caSobrasValor += caSobra;
        caSobrasSkus += caAbsSkus;
        caSobrasHl += caImpactoHl;
      } else {
        caItensAcurados++;
      }
    }

    const rankingSemAjuste: DashboardRankingItem = {
      id: item.id,
      produto: item.produto,
      descricao: item.descricao,
      fatorSku: fator,
      fatorHl,
      valorUnitario,
      deposito: item.deposito,
      fisicoUnits,
      fisicoRaw,
      totalDesviosSkus: desviosSkusFloat,
      totalDesviosUnits: desviosUnits,
      desviosRaw,
      quebrasSkus: dev.quebras.skus,
      valesSkus: dev.vales.skus,
      trocasSkus: dev.trocas.skus,
      faltasSkus: dev.faltas.skus,
      finalUnits,
      finalRaw,
      fiscalUnits,
      fiscalRaw,
      diferencaUnits: saSignedSkus === 0 ? 0 : saDiffUnits,
      diferencaRaw: saSignedSkus === 0 ? '0/00' : saRankingRaw,
      diferencaSkus: saAbsSkus,
      prejuizoFinanceiro: Number.isFinite(saPrejuizo) ? saPrejuizo : 0,
      sobraFinanceira: Number.isFinite(saSobra) ? saSobra : 0,
      impactoHl: Number.isFinite(saImpactoHl) ? saImpactoHl : 0,
    };

    const rankingComAjuste: DashboardRankingItem = {
      id: item.id,
      produto: item.produto,
      descricao: item.descricao,
      fatorSku: fator,
      fatorHl,
      valorUnitario,
      deposito: item.deposito,
      fisicoUnits,
      fisicoRaw,
      totalDesviosSkus: desviosSkusFloat,
      totalDesviosUnits: desviosUnits,
      desviosRaw,
      quebrasSkus: dev.quebras.skus,
      valesSkus: dev.vales.skus,
      trocasSkus: dev.trocas.skus,
      faltasSkus: dev.faltas.skus,
      finalUnits,
      finalRaw,
      fiscalUnits,
      fiscalRaw,
      diferencaUnits: caSignedSkus === 0 ? 0 : caDiffUnits,
      diferencaRaw: caSignedSkus === 0 ? '0/00' : caRankingRaw,
      diferencaSkus: caAbsSkus,
      prejuizoFinanceiro: Number.isFinite(caPrejuizo) ? caPrejuizo : 0,
      sobraFinanceira: Number.isFinite(caSobra) ? caSobra : 0,
      impactoHl: Number.isFinite(caImpactoHl) ? caImpactoHl : 0,
    };

    const adjustedItem: ItemConciliacaoAjustada = {
      deposito: item.deposito,
      produto: String(item.produto).trim(),
      descricao: item.descricao,
      grupo: item.grupo || 'GERAL',
      fatorSku: fator,
      fatorHl,
      valorUnitario,
      valorCaixa,

      fiscalRaw,
      fiscalSkus,
      fiscalUnits,
      fiscalTotalUnits: fiscalUnits,
      valorFiscal,

      desviosRaw,
      desviosSkus: desviosBoxesInt,
      desviosUnits,
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

      fisicoRaw,
      fisicoSkus,
      fisicoUnits,
      fisicoTotalUnits: fisicoUnits,
      valorFisico,

      finalRaw,
      finalTotalUnits: finalUnits,
      finalUnits,
      finalSkus,
      valorFinal,

      divergenciaResidualUnits: caDiffUnits,
      divergenciaResidualSkus: caSignedSkus,
      divergenciaResidualRaw: caPromaxRaw,
      statusAjustado,

      impactoFinanceiroResidual: caImpactoFin,
      impactoHlResidual: caImpactoHl,
      recontado: item.recontado,

      diferencaInicialSkus: saSignedSkus,
      diferencaInicialRaw: saPromaxRaw,
      prejuizoInicial: saPrejuizo,
      sobraInicial: saSobra,
      skusAmortizados,
      valorAmortizado,
    };

    rows.push({
      stockItem: item,
      adjustedItem,
      rankingSemAjuste,
      rankingComAjuste,
      deviations: dev,
      isIgnoredNegative,
    });
  });

  // 5. Ordenação oficial determinística dos Rankings (Maior impacto financeiro -> Maior volume de unidades)
  const sortFaltas = (a: DashboardRankingItem, b: DashboardRankingItem) => {
    if (b.prejuizoFinanceiro !== a.prejuizoFinanceiro) {
      return b.prejuizoFinanceiro - a.prejuizoFinanceiro;
    }
    return Math.abs(b.diferencaUnits) - Math.abs(a.diferencaUnits);
  };

  const sortSobras = (a: DashboardRankingItem, b: DashboardRankingItem) => {
    if (b.sobraFinanceira !== a.sobraFinanceira) {
      return b.sobraFinanceira - a.sobraFinanceira;
    }
    return Math.abs(b.diferencaUnits) - Math.abs(a.diferencaUnits);
  };

  const rankingItemsSemAjuste = rows.map(r => r.rankingSemAjuste);
  const rankingItemsComAjuste = rows.map(r => r.rankingComAjuste);

  const rankingFaltasSemAjuste = rankingItemsSemAjuste
    .filter(item => (item.diferencaSkus || 0) > 0 && item.prejuizoFinanceiro > 0)
    .sort(sortFaltas);

  const rankingSobrasSemAjuste = rankingItemsSemAjuste
    .filter(item => (item.diferencaSkus || 0) > 0 && item.sobraFinanceira > 0)
    .sort(sortSobras);

  const rankingFaltasComAjuste = rankingItemsComAjuste
    .filter(item => (item.diferencaSkus || 0) > 0 && item.prejuizoFinanceiro > 0)
    .sort(sortFaltas);

  const rankingSobrasComAjuste = rankingItemsComAjuste
    .filter(item => (item.diferencaSkus || 0) > 0 && item.sobraFinanceira > 0)
    .sort(sortSobras);

  // 6. Rankings formatados para Excel / Salvar & Congelar (RankingItem)
  const rowByItemId = new Map(rows.map(r => [r.stockItem.id, r]));

  const toExcelRanking = (list: DashboardRankingItem[], tipo: 'FALTA' | 'SOBRA', comAjustes: boolean): RankingItem[] =>
    list.map((r, idx) => {
      const parent = rowByItemId.get(r.id);
      const valorFin = tipo === 'FALTA' ? -r.prejuizoFinanceiro : r.sobraFinanceira;
      return {
        posicao: idx + 1,
        codigo: r.produto,
        descricao: r.descricao,
        grupo: parent?.stockItem.grupo || 'GERAL',
        deposito: r.deposito,
        fatorSku: r.fatorSku,
        quantidadeUnidades: Math.abs(r.diferencaUnits),
        quantidadeSkus: r.diferencaSkus || 0,
        quantidadeRaw: comAjustes
          ? (parent?.adjustedItem.divergenciaResidualRaw || r.diferencaRaw)
          : (parent?.stockItem.diferencaRaw || r.diferencaRaw),
        impactoFinanceiro: valorFin,
        impactoHl: r.impactoHl,
        tipo,
        comAjustes,
      };
    });

  const excelRankingFaltasSemAjustes = toExcelRanking(rankingFaltasSemAjuste, 'FALTA', false);
  const excelRankingSobrasSemAjustes = toExcelRanking(rankingSobrasSemAjuste, 'SOBRA', false);
  const excelRankingFaltasComAjustes = toExcelRanking(rankingFaltasComAjuste, 'FALTA', true);
  const excelRankingSobrasComAjustes = toExcelRanking(rankingSobrasComAjuste, 'SOBRA', true);

  // 7. Totais consolidados Sem Ajuste e Com Ajustes
  const totalItens = healedStock.length;
  const totalItensValidos = Math.max(0, totalItens - saItensSaldoNegativo);

  const totalsSemAjuste: ReconciliationModeTotals = {
    totalItens,
    totalItensValidos,
    totalItensSaldoNegativo: saItensSaldoNegativo,
    totalItensAcurados: saItensAcurados,
    totalItensComFalta: saItensComFalta,
    totalItensComSobra: saItensComSobra,
    acuracidadePct: totalItensValidos > 0
      ? Math.max(0, Math.min(100, (saItensAcurados / totalItensValidos) * 100))
      : 100,

    totalFiscalUnits: saFiscalUnits,
    totalFiscalSkus: saFiscalSkus,
    valorTotalFiscal: saValorFiscal,

    totalFisicoUnits: saFisicoUnits,
    totalFisicoSkus: saFisicoSkus,
    valorTotalFisico: saValorFisico,

    totalFinalUnits: saFisicoUnits,
    totalFinalSkus: saFisicoSkus,
    valorTotalFinal: saValorFisico,

    totalFaltasValor: saFaltasValor,
    totalSobrasValor: saSobrasValor,
    saldoLiquidoValor: saSobrasValor - saFaltasValor,
    divergenciaLiquidaFalta: Math.max(0, saFaltasValor - saSobrasValor),
    superavitLiquido: Math.max(0, saSobrasValor - saFaltasValor),

    totalFaltasSkus: saFaltasSkus,
    totalSobrasSkus: saSobrasSkus,
    saldoLiquidoSkus: saSobrasSkus - saFaltasSkus,

    totalFaltasHl: saFaltasHl,
    totalSobrasHl: saSobrasHl,
    saldoLiquidoHl: saSobrasHl - saFaltasHl,
  };

  const totalsComAjuste: ReconciliationModeTotals = {
    totalItens,
    totalItensValidos,
    totalItensSaldoNegativo: saItensSaldoNegativo,
    totalItensAcurados: caItensAcurados,
    totalItensComFalta: caItensComFalta,
    totalItensComSobra: caItensComSobra,
    acuracidadePct: totalItensValidos > 0
      ? Math.max(0, Math.min(100, (caItensAcurados / totalItensValidos) * 100))
      : 100,

    totalFiscalUnits: saFiscalUnits,
    totalFiscalSkus: saFiscalSkus,
    valorTotalFiscal: saValorFiscal,

    totalFisicoUnits: saFisicoUnits,
    totalFisicoSkus: saFisicoSkus,
    valorTotalFisico: saValorFisico,

    totalFinalUnits: caFinalUnits,
    totalFinalSkus: caFinalSkus,
    valorTotalFinal: caValorFinal,

    totalFaltasValor: caFaltasValor,
    totalSobrasValor: caSobrasValor,
    saldoLiquidoValor: caSobrasValor - caFaltasValor,
    divergenciaLiquidaFalta: Math.max(0, caFaltasValor - caSobrasValor),
    superavitLiquido: Math.max(0, caSobrasValor - caFaltasValor),

    totalFaltasSkus: caFaltasSkus,
    totalSobrasSkus: caSobrasSkus,
    saldoLiquidoSkus: caSobrasSkus - caFaltasSkus,

    totalFaltasHl: caFaltasHl,
    totalSobrasHl: caSobrasHl,
    saldoLiquidoHl: caSobrasHl - caFaltasHl,
  };

  // 8. Resumo das Guias de Desvios Operacionais Pendentes
  const totalQuebrasValor = pendingQuebras.reduce((acc, q) => acc + (q.valorTotal || 0), 0);
  const totalQuebrasHl = pendingQuebras.reduce((acc, q) => acc + (q.volumeHl || 0), 0);
  const totalQuebrasQtd = pendingQuebras.reduce((acc, q) => acc + (q.quantidade || 0), 0);

  const totalQuebrasFaturadasValor = faturadasQuebras.reduce((acc, q) => acc + (q.valorTotal || 0), 0);
  const totalQuebrasFaturadasHl = faturadasQuebras.reduce((acc, q) => acc + (q.volumeHl || 0), 0);
  const totalQuebrasFaturadasQtd = faturadasQuebras.reduce((acc, q) => acc + (q.quantidade || 0), 0);

  const totalValesValor = pendingVales.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
  const totalValesHl = pendingVales.reduce((acc, v) => acc + (v.volumeHl || 0), 0);
  const totalValesQtd = pendingVales.reduce((acc, v) => acc + (v.quantidade || 0), 0);

  const totalTrocasValor = pendingTrocas.reduce((acc, t) => acc + (t.valorTotal || 0), 0);
  const totalTrocasHl = pendingTrocas.reduce((acc, t) => acc + (t.volumeHl || 0), 0);
  const totalTrocasQtd = pendingTrocas.reduce((acc, t) => acc + (t.quantidade || 0), 0);

  let totalFaltasMapeadasValor = 0;
  let totalFaltasMapeadasHl = 0;
  let totalFaltasMapeadasQtd = 0;
  pendingFaltas.forEach(f => {
    const vals = getFaltaItemCalculatedValues(f, productsMap, healedStock);
    totalFaltasMapeadasValor += vals.valorTotal;
    totalFaltasMapeadasHl += vals.volumeHl;
    totalFaltasMapeadasQtd += vals.quantidadeSkus || Number(f.quantidade) || 0;
  });

  const desviosSummary: DesviosOperacionaisSummary = {
    pendingQuebras,
    faturadasQuebras,
    pendingVales,
    pendingTrocas,
    pendingFaltas,

    totalQuebrasValor,
    totalQuebrasHl,
    totalQuebrasQtd,
    totalQuebrasPendentesCount: pendingQuebras.length,

    totalQuebrasFaturadasValor,
    totalQuebrasFaturadasHl,
    totalQuebrasFaturadasQtd,
    totalQuebrasFaturadasCount: faturadasQuebras.length,

    totalValesValor,
    totalValesHl,
    totalValesQtd,

    totalTrocasValor,
    totalTrocasHl,
    totalTrocasQtd,

    totalFaltasMapeadasValor,
    totalFaltasMapeadasHl,
    totalFaltasMapeadasQtd,

    totalDesviosValor: totalQuebrasValor + totalValesValor + totalTrocasValor + totalFaltasMapeadasValor,
    totalDesviosVinculadosEstoqueValor,
    totalValorEfetivamenteAmortizado,
    totalSkusEfetivamenteAmortizados,
  };

  return {
    rows,
    healedStock,
    adjustedItems: rows.map(r => r.adjustedItem),

    rankingItemsSemAjuste,
    rankingItemsComAjuste,

    rankingFaltasSemAjuste,
    rankingSobrasSemAjuste,
    rankingFaltasComAjuste,
    rankingSobrasComAjuste,

    excelRankingFaltasSemAjustes,
    excelRankingSobrasSemAjustes,
    excelRankingFaltasComAjustes,
    excelRankingSobrasComAjustes,

    totalsSemAjuste,
    totalsComAjuste,
    desviosSummary,
  };
}
