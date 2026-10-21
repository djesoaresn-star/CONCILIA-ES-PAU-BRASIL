import React, { useState } from 'react';
import { 
  Building2, 
  UploadCloud, 
  PlusCircle, 
  RefreshCw, 
  Download, 
  FileSpreadsheet, 
  TrendingDown, 
  Layers, 
  AlertTriangle,
  X,
  Search,
  ChevronRight,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  CheckCircle,
  BarChart3,
  Sparkles,
  KeyRound,
  UserCheck,
  User,
  LogOut,
  FolderDown,
  ArrowLeftRight,
  Boxes,
  CalendarCheck2,
  CalendarRange
} from 'lucide-react';
import { ViewTab, UserAccount } from '../types';

interface SidebarProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  isRecountApplied: boolean;
  onResetData: () => void;
  onClearAllData?: () => void;
  onExportReport: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isRecountApplied,
  onResetData,
  onClearAllData,
  onExportReport,
  isOpenMobile,
  onCloseMobile,
  currentUser,
  onLogout,
}) => {
  // Sidebar expansion state: collapsed (compact) or expanded
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const navGroups = [
    {
      group: 'ESTOQUE & CONCILIAÇÃO',
      items: [
        { 
          id: 'dashboard', 
          title: 'Dashboard & BI', 
          subtitle: 'Indicadores, Avarias & Gráficos', 
          icon: BarChart3,
          iconBg: 'bg-blue-600 text-white shadow-blue-500/25',
          activeBg: 'bg-blue-600/15 border-blue-500 text-white shadow-blue-900/40',
          hoverBorder: 'hover:border-blue-500/50 hover:bg-blue-950/30',
          activeLine: 'bg-blue-500',
          badge: undefined
        },
        { 
          id: 'conciliacao', 
          title: 'Conciliação de Estoque', 
          subtitle: '02.05.02 vs Inventário Físico', 
          icon: FileSpreadsheet,
          iconBg: 'bg-emerald-600 text-white shadow-emerald-500/25',
          activeBg: 'bg-emerald-600/15 border-emerald-500 text-white shadow-emerald-900/40',
          hoverBorder: 'hover:border-emerald-500/50 hover:bg-emerald-950/30',
          activeLine: 'bg-emerald-500',
          badge: isRecountApplied ? '01.11 Ativo' : undefined 
        },
        { 
          id: 'grade_estoque', 
          title: 'Grade de Estoque', 
          subtitle: 'Padrão 1;SKU;QTD com Reserva', 
          icon: Boxes,
          iconBg: 'bg-teal-600 text-white shadow-teal-500/25',
          activeBg: 'bg-teal-600/15 border-teal-500 text-white shadow-teal-900/40',
          hoverBorder: 'hover:border-teal-500/50 hover:bg-teal-950/30',
          activeLine: 'bg-teal-500',
          badge: 'SAP'
        },
        { 
          id: 'dif_diaria', 
          title: 'Diferença Diária', 
          subtitle: 'Congelado vs Atual (02.05.02)', 
          icon: CalendarCheck2,
          iconBg: 'bg-amber-600 text-white shadow-amber-500/25',
          activeBg: 'bg-amber-600/15 border-amber-500 text-white shadow-amber-900/40',
          hoverBorder: 'hover:border-amber-500/50 hover:bg-amber-950/30',
          activeLine: 'bg-amber-500',
          badge: undefined
        },
        { 
          id: 'dif_mensal', 
          title: 'Diferença Mensal', 
          subtitle: 'Estratificada (Dias 1 a 31)', 
          icon: CalendarRange,
          iconBg: 'bg-indigo-600 text-white shadow-indigo-500/25',
          activeBg: 'bg-indigo-600/15 border-indigo-500 text-white shadow-indigo-900/40',
          hoverBorder: 'hover:border-indigo-500/50 hover:bg-indigo-950/30',
          activeLine: 'bg-indigo-500',
          badge: undefined
        },
      ]
    },
    {
      group: 'DESVIOS OPERACIONAIS',
      items: [
        { 
          id: 'inversao', 
          title: 'Inversão de Produtos', 
          subtitle: 'Chamados Sobra vs Falta', 
          icon: ArrowLeftRight,
          iconBg: 'bg-cyan-600 text-white shadow-cyan-500/25',
          activeBg: 'bg-cyan-600/15 border-cyan-500 text-white shadow-cyan-900/40',
          hoverBorder: 'hover:border-cyan-500/50 hover:bg-cyan-950/30',
          activeLine: 'bg-cyan-500',
          badge: undefined
        },
        { 
          id: 'quebras', 
          title: 'Quebras Congeladas', 
          subtitle: 'Avarias de Armazém & Retrabalho', 
          icon: TrendingDown,
          iconBg: 'bg-rose-600 text-white shadow-rose-500/25',
          activeBg: 'bg-rose-600/15 border-rose-500 text-white shadow-rose-900/40',
          hoverBorder: 'hover:border-rose-500/50 hover:bg-rose-950/30',
          activeLine: 'bg-rose-500',
          badge: undefined
        },
        { 
          id: 'vales', 
          title: 'Vales de Equipe', 
          subtitle: 'Responsabilidade & Rota', 
          icon: AlertTriangle,
          iconBg: 'bg-amber-500 text-slate-950 shadow-amber-500/25',
          activeBg: 'bg-amber-500/15 border-amber-400 text-white shadow-amber-900/40',
          hoverBorder: 'hover:border-amber-400/50 hover:bg-amber-950/30',
          activeLine: 'bg-amber-400',
          badge: undefined
        },
        { 
          id: 'trocas', 
          title: 'Trocas & Reposições', 
          subtitle: 'Mercadorias em Clientes', 
          icon: RefreshCw,
          iconBg: 'bg-purple-600 text-white shadow-purple-500/25',
          activeBg: 'bg-purple-600/15 border-purple-500 text-white shadow-purple-900/40',
          hoverBorder: 'hover:border-purple-500/50 hover:bg-purple-950/30',
          activeLine: 'bg-purple-500',
          badge: undefined
        },
        { 
          id: 'faltas', 
          title: 'Faltas Mapeadas', 
          subtitle: 'Conferência de Doca e Cargas', 
          icon: PlusCircle,
          iconBg: 'bg-red-600 text-white shadow-red-500/25',
          activeBg: 'bg-red-600/15 border-red-500 text-white shadow-red-900/40',
          hoverBorder: 'hover:border-red-500/50 hover:bg-red-950/30',
          activeLine: 'bg-red-500',
          badge: undefined
        },
      ]
    },
    {
      group: 'CADASTROS & SISTEMA',
      items: [
        { 
          id: 'produtos', 
          title: 'Cadastro de SKUs', 
          subtitle: 'Fatores, Embalagens & Preços', 
          icon: Building2,
          iconBg: 'bg-sky-600 text-white shadow-sky-500/25',
          activeBg: 'bg-sky-600/15 border-sky-500 text-white shadow-sky-900/40',
          hoverBorder: 'hover:border-sky-500/50 hover:bg-sky-950/30',
          activeLine: 'bg-sky-500',
          badge: undefined
        },
        { 
          id: 'login', 
          title: 'Acessos & Perfil', 
          subtitle: 'Contas, Acessos & Permissões', 
          icon: KeyRound,
          iconBg: 'bg-violet-600 text-white shadow-violet-500/25',
          activeBg: 'bg-violet-600/15 border-violet-500 text-white shadow-violet-900/40',
          hoverBorder: 'hover:border-violet-500/50 hover:bg-violet-950/30',
          activeLine: 'bg-violet-500',
          badge: currentUser ? 'Conectado' : undefined
        },
      ]
    }
  ];

  // Flattened for search
  const allNavItems = navGroups.flatMap(g => g.items);
  const isSearching = Boolean(sidebarSearch.trim());
  const searchResults = allNavItems.filter(item => {
    if (!isSearching) return true;
    const term = sidebarSearch.toLowerCase();
    return item.title.toLowerCase().includes(term) || item.subtitle.toLowerCase().includes(term);
  });

  const handleSelectTab = (tabId: ViewTab) => {
    setCurrentTab(tabId);
    onCloseMobile();
  };

  const sidebarContent = (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-72 lg:w-80'
      } bg-[#0A101D] text-white flex flex-col h-full flex-shrink-0 select-none shadow-2xl border-r border-slate-800 transition-all duration-300 ease-in-out relative z-40`}
    >
      {/* 1. Header: Pau Brasil Distribuidora Ambev & Collapse Toggle */}
      <div className={`p-3.5 border-b border-slate-800/80 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-white flex-shrink-0 flex items-center justify-center p-1 shadow-sm border border-slate-700">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-emerald-500 flex items-center justify-center text-white font-black text-xs tracking-tighter">
                  PB
                </div>
              </div>
              
              <div className="leading-tight truncate">
                <h1 className="text-sm font-black tracking-wider text-white">
                  PAU BRASIL
                </h1>
                <p className="text-[11px] font-bold text-slate-400">
                  DISTRIBUIDORA <span className="text-blue-400 font-extrabold">AMBEV</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition shadow-xs cursor-pointer"
                title="Recolher barra lateral"
              >
                <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>

              {isOpenMobile && (
                <button 
                  onClick={onCloseMobile}
                  className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 flex items-center justify-center text-blue-400 hover:text-white transition shadow-sm group cursor-pointer"
              title="Expandir barra lateral"
            >
              <PanelLeftOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Card do Colaborador: Nome e Cargo */}
      {!isCollapsed ? (
        <div className="px-3 pt-3">
          <button
            onClick={() => handleSelectTab('login')}
            className="w-full bg-[#0f172a]/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 flex items-center justify-between shadow-xs text-left transition group cursor-pointer"
            title="Clique para gerenciar perfil e conta"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                {currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'D'}
              </div>
              <div className="leading-tight truncate">
                <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition truncate" title={currentUser?.nome || 'Djeanderson Soares'}>
                  {currentUser?.nome || 'Djeanderson Soares'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate" title={currentUser?.cargo || 'Supervisor de Armazém'}>
                  {currentUser?.cargo || 'Supervisor de Armazém'}
                </div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.7)] ml-2" />
          </button>
        </div>
      ) : (
        <div className="py-3 flex flex-col items-center border-b border-slate-800/60">
          <div className="relative group">
            <button
              onClick={() => handleSelectTab('login')}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer relative"
              title={`${currentUser?.nome || 'Djeanderson Soares'} (${currentUser?.cargo || 'Supervisor de Armazém'})`}
            >
              <span>{currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'D'}</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A101D]" />
            </button>
            {/* Floating Profile Tooltip (opens to the left) */}
            <div className="fixed right-[88px] top-16 px-3 py-2 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
              <div className="text-white font-bold">{currentUser?.nome || 'Djeanderson Soares'}</div>
              <div className="text-[10px] text-emerald-400 font-normal">{currentUser?.cargo || 'Supervisor de Armazém'}</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search Bar */}
      {!isCollapsed && (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar guia ou módulo..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
            {sidebarSearch && (
              <button
                onClick={() => setSidebarSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Navigation Cards List with vibrant colors and rich interactivity */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2 py-4 space-y-3 flex flex-col items-center' : 'p-3 space-y-3'} overflow-y-auto scrollbar-none`}>
        {isSearching ? (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-2 mb-1">
              Resultados ({searchResults.length})
            </div>
            {searchResults.map((item) => {
              const isActive = currentTab === item.id || (item.id === 'conciliacao' && currentTab === 'conciliacao_ajustes');
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectTab(item.id as ViewTab)}
                  className={`p-2.5 rounded-xl flex items-center space-x-3 cursor-pointer transition-all duration-200 border group ${
                    isActive
                      ? item.activeBg
                      : `bg-slate-900/50 border-slate-800/80 ${item.hoverBorder} text-slate-300`
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg} group-hover:scale-105 transition-transform shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs font-bold tracking-tight truncate ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-snug">
                      {item.subtitle}
                    </p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                    isActive ? 'text-white translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5'
                  }`} />
                </div>
              );
            })}
          </div>
        ) : isCollapsed ? (
          navGroups.flatMap(g => g.items).map((item) => {
            const isActive = currentTab === item.id || (item.id === 'conciliacao' && currentTab === 'conciliacao_ajustes');
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative group flex items-center justify-center w-full">
                {isActive && (
                  <div className={`absolute right-0 w-1 h-6 ${item.activeLine} rounded-l-full shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10`} />
                )}
                <button
                  onClick={() => handleSelectTab(item.id as ViewTab)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer relative group ${
                    isActive 
                      ? `${item.iconBg} ring-2 ring-white/30 shadow-lg scale-105` 
                      : `bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 ${item.hoverBorder}`
                  }`}
                  aria-label={item.title}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                  {item.badge && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A101D] shadow-xs" />
                  )}
                </button>
                {/* Floating Tooltip to the Left */}
                <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 transform -translate-x-1 group-hover:translate-x-0 whitespace-nowrap drop-shadow-2xl">
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-r border-t border-slate-700 rotate-45" />
                  <div className="relative bg-slate-900/98 backdrop-blur-md border border-slate-700/90 text-white px-3.5 py-2.5 rounded-xl shadow-2xl min-w-[180px]">
                    <div className="text-xs font-bold flex items-center justify-between gap-2.5">
                      <span className="text-white tracking-wide">{item.title}</span>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-normal">{item.subtitle}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          navGroups.map((group, groupIdx) => (
            <div key={group.group} className="space-y-1.5">
              <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
                  {group.group}
                </span>
                <span className="text-[9px] text-slate-600 font-mono">
                  0{groupIdx + 1}
                </span>
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = currentTab === item.id || (item.id === 'conciliacao' && currentTab === 'conciliacao_ajustes');
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectTab(item.id as ViewTab)}
                      className={`px-3 py-2 rounded-xl flex items-center space-x-3 cursor-pointer transition-all duration-200 border group ${
                        isActive
                          ? item.activeBg
                          : `bg-slate-900/40 border-slate-800/60 ${item.hoverBorder} text-slate-300`
                      }`}
                    >
                      {/* Colorful Icon Container */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg} shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-xs font-bold tracking-tight truncate ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white transition-colors'}`}>
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-snug">
                          {item.subtitle}
                        </p>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                        isActive ? 'text-white translate-x-0.5' : 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5'
                      }`} />
                    </div>
                  );
                })}
              </div>

              {/* Bloco de Gestão de Dados reposicionado estritamente dentro de CADASTROS & SISTEMA */}
              {group.group === 'CADASTROS & SISTEMA' && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 px-1 bg-slate-900/30 rounded-xl p-2 border">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-2">
                    <span className="font-semibold text-slate-300">Gestão de Dados</span>
                    <span className="text-[10px] text-slate-500 font-mono">v3.2 CDD</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={onExportReport}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                      title="Exportar Relatório Geral Consolidado"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Exportar</span>
                    </button>

                    {onClearAllData ? (
                      <button
                        onClick={onClearAllData}
                        className="p-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 hover:text-rose-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="Limpar todos os dados e começar base zerada para importação manual"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Zerar Bases</span>
                      </button>
                    ) : (
                      <button
                        onClick={onResetData}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="Restaurar Dados Iniciais de Demonstração"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Exemplo</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </nav>

      {/* 5. Footer: Ações de Sessão e Diminuir Barra Lateral */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        {!isCollapsed ? (
          <div className="space-y-2">
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full py-1.5 px-3 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                title="Sair do sistema e voltar para a tela de log in"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sair da Plataforma</span>
              </button>
            )}

            <button
              onClick={() => setIsCollapsed(true)}
              className="w-full py-1 text-[10px] text-slate-500 hover:text-slate-300 text-center flex items-center justify-center gap-1 cursor-pointer"
            >
              <PanelLeftClose className="w-3 h-3" />
              <span>Diminuir barra lateral</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2.5">
            {onLogout && (
              <div className="relative group w-full flex justify-center">
                <button
                  onClick={onLogout}
                  className="w-11 h-11 rounded-xl bg-rose-950/40 hover:bg-rose-900/70 border border-rose-900/50 text-rose-300 hover:text-white transition cursor-pointer flex items-center justify-center group-hover:scale-105"
                  title="Sair do sistema"
                  aria-label="Sair da Plataforma"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                </button>
                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900/98 backdrop-blur-md border border-slate-700/90 rounded-xl text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0 shadow-2xl z-50">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45" />
                  Sair da Plataforma
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex h-full flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Backdrop & Drawer (slides from left) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-start">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

