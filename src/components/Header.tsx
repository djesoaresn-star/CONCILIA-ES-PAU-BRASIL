import React from 'react';
import { 
  Building2, 
  Calendar, 
  UploadCloud, 
  PlusCircle, 
  RefreshCw, 
  Download, 
  Menu,
  User,
  KeyRound,
  LogIn,
  LogOut,
  CheckCircle2,
  Database
} from 'lucide-react';
import { DepositoId, ViewTab, UserAccount } from '../types';
import { CongelamentoType } from './ManualCongelamentoModal';
import { DEPOSITOS } from '../data/initialData';

interface HeaderProps {
  currentTab?: ViewTab;
  setCurrentTab?: (tab: ViewTab) => void;
  selectedDeposito: DepositoId | 'ALL';
  setSelectedDeposito: (dep: DepositoId | 'ALL') => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onOpenImportModal: () => void;
  onOpenManualFaltaModal: () => void;
  onOpenManualModal?: (type?: CongelamentoType) => void;
  onResetData?: () => void;
  onExportReport?: () => void;
  isRecountApplied?: boolean;
  onToggleMobileMenu?: () => void;
  currentUser?: UserAccount | null;
  onNavigateLogin?: () => void;
  onLogout?: () => void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'local';
  lastCloudSyncLabel?: string | null;
  onForceCloudSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  selectedDeposito,
  setSelectedDeposito,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onOpenManualFaltaModal,
  onOpenManualModal,
  onToggleMobileMenu,
  onLogout,
  cloudSyncStatus = 'synced',
  lastCloudSyncLabel,
  onForceCloudSync,
}) => {
  const handleOpenManual = () => {
    if (onOpenManualModal) {
      onOpenManualModal('quebra');
    } else {
      onOpenManualFaltaModal();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 shadow-xs z-30">
      {/* Left: Mobile Menu & Depósito Selector */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Warehouse Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
            Depósito:
          </span>
          <div className="relative">
            <select
              value={selectedDeposito}
              onChange={(e) => setSelectedDeposito(e.target.value as DepositoId | 'ALL')}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition shadow-2xs pr-8"
              title="Selecione o Depósito para filtragem e conciliação"
            >
              <option value="ALL">🏢 Todos os Depósitos</option>
              {DEPOSITOS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter Inputs - Show only when in historical date-sensitive views */}
        {(currentTab === 'quebras' || currentTab === 'vales' || currentTab === 'trocas' || currentTab === 'faltas' || currentTab === 'dif_diaria') && (
          <div className="hidden lg:flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-600 gap-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
            />
            <span className="text-slate-400 font-medium">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Right: Cloud Sync Button & User Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onForceCloudSync}
          disabled={cloudSyncStatus === 'syncing'}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer shadow-2xs ${
            cloudSyncStatus === 'syncing'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : cloudSyncStatus === 'local'
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
          title={
            lastCloudSyncLabel
              ? `Sincronização em nuvem (AI Studio ↔ GitHub). Última sincronização: ${lastCloudSyncLabel}. Clique para sincronizar agora.`
              : 'Sincronização em nuvem ativa (AI Studio ↔ GitHub). Clique para sincronizar agora.'
          }
        >
          {cloudSyncStatus === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          ) : (
            <Database
              className={`w-3.5 h-3.5 ${
                cloudSyncStatus === 'local' ? 'text-amber-600' : 'text-emerald-600'
              }`}
            />
          )}
          <span>
            {cloudSyncStatus === 'syncing'
              ? 'Sincronizando...'
              : cloudSyncStatus === 'local'
              ? 'Modo Local · Reconectar'
              : 'Sincronizado na Nuvem'}
          </span>
        </button>

        {/* Quick Launch Manual Congelamento */}
        <button
          onClick={handleOpenManual}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          title="Lançar congelamento manual (Quebra, Vale, Troca ou Falta)"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Lançar Desvio</span>
        </button>

        {/* Botão Sair */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer"
            title="Sair do sistema e voltar à tela inicial"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        )}
      </div>
    </header>
  );
};

