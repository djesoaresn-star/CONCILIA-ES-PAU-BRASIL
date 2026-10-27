import React, { useState, useEffect } from 'react';
import { 
  StockPositionItem, 
  DepositoId, 
  ProductMaster, 
  QuebraItem, 
  ValeItem, 
  TrocaItem, 
  FaltaMapeadaItem, 
  ViewTab 
} from '../types';
import { ConciliacaoAjustesView } from './ConciliacaoAjustesView';
import { ConciliacaoPadraoView } from './ConciliacaoPadraoView';
import { ReconciliationMode } from '../utils/reconciliationEngine';

export interface ConciliacaoViewProps {
  stockPositions: StockPositionItem[];
  setStockPositions: React.Dispatch<React.SetStateAction<StockPositionItem[]>>;
  selectedDeposito: DepositoId | 'ALL';
  setSelectedDeposito: (dep: DepositoId | 'ALL') => void;
  onOpenImportModal: (initialFile?: '020502' | '021101' | 'cadastro' | 'quebras' | 'vales' | 'trocas' | 'faltas') => void;
  onClearStockPositions?: () => void;
  productsMap: Map<string, ProductMaster>;
  isRecountApplied: boolean;
  quebras?: QuebraItem[];
  vales?: ValeItem[];
  trocas?: TrocaItem[];
  faltasMapeadas?: FaltaMapeadaItem[];
  initialSubTab?: 'padrao' | 'ajustes';
  reconciliationMode?: ReconciliationMode;
  onChangeReconciliationMode?: (mode: ReconciliationMode) => void;
  onNavigateTab?: (tab: ViewTab) => void;
  onOpenSaveModal?: () => void;
  onOpenManualModal?: (type?: 'quebra' | 'vale' | 'troca' | 'falta') => void;
  weeklyBillingStatus?: Record<string, 'PENDENTE' | 'OK'>;
}

export const ConciliacaoView: React.FC<ConciliacaoViewProps> = (props) => {
  const resolveSubTab = (): 'padrao' | 'ajustes' => {
    if (props.reconciliationMode) {
      return props.reconciliationMode === 'com_ajuste' ? 'ajustes' : 'padrao';
    }
    return props.initialSubTab || 'ajustes';
  };

  const [subTab, setSubTab] = useState<'padrao' | 'ajustes'>(resolveSubTab);

  useEffect(() => {
    if (props.reconciliationMode) {
      setSubTab(props.reconciliationMode === 'com_ajuste' ? 'ajustes' : 'padrao');
    } else if (props.initialSubTab) {
      setSubTab(props.initialSubTab);
    }
  }, [props.reconciliationMode, props.initialSubTab]);

  const handleToggleSubTab = (mode: 'padrao' | 'ajustes') => {
    setSubTab(mode);
    props.onChangeReconciliationMode?.(mode === 'ajustes' ? 'com_ajuste' : 'sem_ajuste');
  };

  if (subTab === 'ajustes') {
    return (
      <ConciliacaoAjustesView
        stockPositions={props.stockPositions}
        setStockPositions={props.setStockPositions}
        quebras={props.quebras || []}
        vales={props.vales || []}
        trocas={props.trocas || []}
        faltasMapeadas={props.faltasMapeadas || []}
        selectedDeposito={props.selectedDeposito}
        setSelectedDeposito={props.setSelectedDeposito}
        productsMap={props.productsMap}
        isRecountApplied={props.isRecountApplied}
        onNavigateTab={(tab) => {
          if (tab === 'conciliacao') {
            handleToggleSubTab('padrao');
          } else if (props.onNavigateTab) {
            props.onNavigateTab(tab);
          }
        }}
        onToggleSubTab={handleToggleSubTab}
        onOpenImportModal={props.onOpenImportModal}
        onOpenSaveModal={props.onOpenSaveModal}
        onOpenManualModal={props.onOpenManualModal}
        weeklyBillingStatus={props.weeklyBillingStatus}
      />
    );
  }

  return (
    <ConciliacaoPadraoView
      {...props}
      subTab={subTab}
      onToggleSubTab={handleToggleSubTab}
    />
  );
};
