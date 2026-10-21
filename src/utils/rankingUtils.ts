import { 
  StockPositionItem, 
  QuebraItem, 
  ValeItem, 
  TrocaItem, 
  FaltaMapeadaItem, 
  DepositoId 
} from '../types';
import { formatSkuUnit } from './parsers';
import { 
  calculateSkuDeviations, 
  isQuebraPendente, 
  isValePendente, 
  isTrocaPendente 
} from './desviosUtils';
import { DashboardRankingItem } from '../components/RecontagemRankingsModal';

export function computeDashboardRankingItems(
  stockPositions: StockPositionItem[],
  quebras: QuebraItem[] = [],
  vales: ValeItem[] = [],
  trocas: TrocaItem[] = [],
  faltasMapeadas: FaltaMapeadaItem[] = [],
  rankingAdjustmentMode: 'sem_ajuste' | 'com_ajuste',
  selectedDeposito: DepositoId | 'ALL',
  weeklyBillingStatus?: Record<string, 'PENDENTE' | 'OK'>
): DashboardRankingItem[] {
  // Filter stock by deposit
  const filteredStock = selectedDeposito === 'ALL'
    ? stockPositions
    : stockPositions.filter(s => s.deposito === selectedDeposito);

  const pendingQuebras = quebras.filter(q => {
    if (selectedDeposito !== 'ALL' && q.deposito !== selectedDeposito) return false;
    return isQuebraPendente(q, weeklyBillingStatus);
  });
  const filteredVales = (selectedDeposito === 'ALL' ? vales : vales.filter(v => v.deposito === selectedDeposito))
    .filter(v => isValePendente(v, weeklyBillingStatus));
  const filteredTrocas = (selectedDeposito === 'ALL' ? trocas : trocas.filter(t => t.deposito === selectedDeposito))
    .filter(t => isTrocaPendente(t, weeklyBillingStatus));
  const filteredFaltas = selectedDeposito === 'ALL' 
    ? faltasMapeadas 
    : faltasMapeadas.filter(f => !f.deposito || f.deposito === selectedDeposito);

  return filteredStock.map(item => {
    const fator = item.fatorSku || 1;
    const sku = item.produto;

    const dev = calculateSkuDeviations(
      sku,
      item.deposito,
      fator,
      item.valorUnitario,
      item.valorCaixa,
      item.fatorHl,
      pendingQuebras,
      filteredVales,
      filteredTrocas,
      filteredFaltas,
      weeklyBillingStatus
    );

    const totalDesviosSkus = dev.total.skus;
    const totalDesviosUnits = dev.total.units;
    const desviosRaw = dev.total.raw;

    const fisicoUnits = item.inventarioTotalUnits;
    const fisicoRaw = item.inventarioRaw || formatSkuUnit(fisicoUnits, fator);

    const finalUnits = fisicoUnits + totalDesviosUnits;
    const finalRaw = formatSkuUnit(finalUnits, fator);

    const fiscalUnits = item.disponivelTotalUnits;
    const fiscalRaw = item.disponivelRaw || formatSkuUnit(fiscalUnits, fator);

    let diferencaUnits = 0;
    let diferencaRaw = '0/00';
    let prejuizoFinanceiro = 0;
    let sobraFinanceira = 0;
    let impactoHl = 0;

    let diferencaSkus = 0;

    if (rankingAdjustmentMode === 'com_ajuste') {
      const fiscalSkus = item.disponivelSkus !== undefined ? item.disponivelSkus : Math.floor(fiscalUnits / fator);
      const finalSkus = Math.floor(finalUnits / fator);
      let wholeSkus = finalSkus - fiscalSkus;
      if (item.saldoNegativoDesconsiderado || fiscalUnits < 0) {
        wholeSkus = 0;
      }

      // REGRA AMBEV: A conciliação e rankings são estritamente apurados sobre os SKUs fechados.
      // Se a quantidade de SKUs no fiscal e final for igual (ex: 16 SKU fiscal e 16 SKU físico), divergência é 0.
      if (wholeSkus === 0) {
        diferencaUnits = 0;
        diferencaSkus = 0;
        diferencaRaw = '0/00';
        prejuizoFinanceiro = 0;
        sobraFinanceira = 0;
        impactoHl = 0;
      } else {
        diferencaUnits = wholeSkus * fator;
        diferencaSkus = Math.abs(wholeSkus);
        diferencaRaw = formatSkuUnit(Math.abs(wholeSkus * fator), fator);
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
      // SEM AJUSTE: Reflete rigorosamente os SKUs fechados da 02.05.02
      const skus = Math.abs(item.diferencaSkus || 0);
      diferencaSkus = skus;

      if (skus === 0) {
        diferencaUnits = 0;
        diferencaRaw = '0/00';
        prejuizoFinanceiro = 0;
        sobraFinanceira = 0;
        impactoHl = 0;
      } else {
        diferencaUnits = item.diferencaTotalUnits;
        const rawClean = (item.diferencaRaw || '').replace(/^[+-]/, '').trim();
        diferencaRaw = rawClean && rawClean !== '0/00'
          ? rawClean
          : formatSkuUnit(Math.abs(item.diferencaTotalUnits), fator);
        prejuizoFinanceiro = item.prejuizoFinanceiro;
        sobraFinanceira = item.sobraFinanceira;
        impactoHl = item.impactoHl;
      }
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
      prejuizoFinanceiro: Number.isFinite(prejuizoFinanceiro) ? prejuizoFinanceiro : 0,
      sobraFinanceira: Number.isFinite(sobraFinanceira) ? sobraFinanceira : 0,
      impactoHl: Number.isFinite(impactoHl) ? impactoHl : 0,
    };
  });
}
