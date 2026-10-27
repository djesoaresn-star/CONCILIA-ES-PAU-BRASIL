import { 
  StockPositionItem, 
  QuebraItem, 
  ValeItem, 
  TrocaItem, 
  FaltaMapeadaItem, 
  DepositoId,
  ProductMaster
} from '../types';
import { DashboardRankingItem } from '../components/RecontagemRankingsModal';
import { reconcileAllStock } from './reconciliationEngine';

export function computeDashboardRankingItems(
  stockPositions: StockPositionItem[],
  quebras: QuebraItem[] = [],
  vales: ValeItem[] = [],
  trocas: TrocaItem[] = [],
  faltasMapeadas: FaltaMapeadaItem[] = [],
  rankingAdjustmentMode: 'sem_ajuste' | 'com_ajuste',
  selectedDeposito: DepositoId | 'ALL',
  weeklyBillingStatus?: Record<string, 'PENDENTE' | 'OK'>,
  productsMap?: Map<string, ProductMaster>
): DashboardRankingItem[] {
  const result = reconcileAllStock({
    stockPositions,
    quebras,
    vales,
    trocas,
    faltasMapeadas,
    selectedDeposito,
    weeklyBillingStatus,
    productsMap,
  });

  return rankingAdjustmentMode === 'com_ajuste'
    ? result.rankingItemsComAjuste
    : result.rankingItemsSemAjuste;
}
