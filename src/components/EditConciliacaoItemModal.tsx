import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Edit3, 
  Trash2, 
  Search, 
  AlertTriangle, 
  Check, 
  Package, 
  Scale, 
  TrendingDown, 
  TrendingUp, 
  Sparkles,
  Info
} from 'lucide-react';
import { StockPositionItem, ProductMaster, DepositoId } from '../types';
import { formatCurrency, formatHectoliters, parseSkuUnitPromax, formatSkuUnit, calcularDivergencia } from '../utils/parsers';
import { SKU_CATALOG, getSkuComprehensiveDetails } from '../utils/productCatalog';

interface EditConciliacaoItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockPositionItem | null;
  productsMap?: Map<string, ProductMaster>;
  onSaveEdit: (itemId: string, updates: Partial<StockPositionItem>) => void;
  onSwapItem: (itemId: string, newProductData: {
    sku: string;
    descricao: string;
    fatorSku: number;
    valorCaixa: number;
    valorUnitario: number;
    fatorHl: number;
    grupo: string;
    novoFisicoRaw?: string;
  }) => void;
  onDeleteItem: (itemId: string) => void;
}

export const EditConciliacaoItemModal: React.FC<EditConciliacaoItemModalProps> = ({
  isOpen,
  onClose,
  item,
  productsMap,
  onSaveEdit,
  onSwapItem,
  onDeleteItem,
}) => {
  const [activeTab, setActiveTab] = useState<'swap' | 'edit' | 'delete'>('swap');

  // Form states for 'edit' tab
  const [editFisicoRaw, setEditFisicoRaw] = useState('');
  const [editFiscalRaw, setEditFiscalRaw] = useState('');
  const [editFatorSku, setEditFatorSku] = useState<number>(12);
  const [editValorCaixa, setEditValorCaixa] = useState<number>(0);
  const [editValorUnitario, setEditValorUnitario] = useState<number>(0);
  const [editDescricao, setEditDescricao] = useState('');

  // Form states for 'swap' tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNewProduct, setSelectedNewProduct] = useState<{
    codigo: string;
    descricao: string;
    fatorSku: number;
    valorCaixa: number;
    valorUnitario: number;
    fatorHl: number;
    grupo: string;
  } | null>(null);
  const [preserveFisicoOnSwap, setPreserveFisicoOnSwap] = useState(true);
  const [customFisicoOnSwap, setCustomFisicoOnSwap] = useState('');

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Initialize values when modal opens or item changes
  useEffect(() => {
    if (item) {
      setEditFisicoRaw(item.inventarioRaw ? item.inventarioRaw.replace(/^[+-]/, '').trim() : '0/00');
      setEditFiscalRaw(item.disponivelRaw ? item.disponivelRaw.replace(/^[+-]/, '').trim() : '0/00');
      setEditFatorSku(item.fatorSku || 12);
      setEditValorCaixa(item.valorCaixa || 0);
      setEditValorUnitario(item.valorUnitario || 0);
      setEditDescricao(item.descricao || '');

      setSearchQuery('');
      setSelectedNewProduct(null);
      setPreserveFisicoOnSwap(true);
      setCustomFisicoOnSwap(item.inventarioRaw ? item.inventarioRaw.replace(/^[+-]/, '').trim() : '0/00');
      setConfirmDelete(false);
      setActiveTab('swap');
    }
  }, [item, isOpen]);

  // Catalog search candidates
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();

    const results: Array<{
      codigo: string;
      descricao: string;
      fatorSku: number;
      valorCaixa: number;
      valorUnitario: number;
      fatorHl: number;
      grupo: string;
      origem: string;
    }> = [];

    const seenSkus = new Set<string>();

    // 1. From productsMap
    if (productsMap && productsMap.size > 0) {
      for (const [k, p] of productsMap.entries()) {
        const sku = String(p.codigo || k).trim();
        const desc = (p.descricao || '').toLowerCase();
        if (sku.toLowerCase().includes(q) || desc.includes(q)) {
          seenSkus.add(sku.replace(/^0+/, ''));
          const fator = Math.max(1, p.fatorSku || 1);
          const box = p.valor > 0 ? p.valor : (p.valorUnit > 0 ? p.valorUnit * fator : 50.0);
          const unit = p.valorUnit > 0 ? p.valorUnit : (box / fator);
          results.push({
            codigo: sku,
            descricao: p.descricao,
            fatorSku: fator,
            valorCaixa: box,
            valorUnitario: unit,
            fatorHl: p.fatorHl || 0.042,
            grupo: p.grupo || 'GERAL',
            origem: 'Base de Produtos'
          });
          if (results.length >= 25) break;
        }
      }
    }

    // 2. From SKU_CATALOG
    if (results.length < 25) {
      for (const [rawSku, cat] of Object.entries(SKU_CATALOG)) {
        const clean = rawSku.replace(/^0+/, '');
        if (seenSkus.has(clean)) continue;
        const desc = (cat.descricao || '').toLowerCase();
        if (rawSku.includes(q) || clean.includes(q) || desc.includes(q)) {
          seenSkus.add(clean);
          const fator = Math.max(1, cat.fatorSku || 1);
          const box = cat.boxPrice > 0 ? cat.boxPrice : cat.unitPrice * fator;
          results.push({
            codigo: rawSku,
            descricao: cat.descricao,
            fatorSku: fator,
            valorCaixa: box,
            valorUnitario: cat.unitPrice > 0 ? cat.unitPrice : box / fator,
            fatorHl: cat.fatorHl || (cat.unitHl * fator) || 0.042,
            grupo: cat.grupo || 'GERAL',
            origem: 'Catálogo Oficial'
          });
          if (results.length >= 35) break;
        }
      }
    }

    return results;
  }, [searchQuery, productsMap]);

  // Preview divergence for 'edit' tab
  const editPreview = useMemo(() => {
    if (!item) return null;
    const fator = Math.max(1, editFatorSku || 1);
    const uPrice = editValorUnitario > 0 ? editValorUnitario : (editValorCaixa > 0 ? editValorCaixa / fator : item.valorUnitario);
    return calcularDivergencia(
      editFiscalRaw,
      editFisicoRaw,
      fator,
      uPrice,
      item.fatorHl || 0.042
    );
  }, [item, editFiscalRaw, editFisicoRaw, editFatorSku, editValorUnitario, editValorCaixa]);

  // Preview divergence for 'swap' tab
  const swapPreview = useMemo(() => {
    if (!item || !selectedNewProduct) return null;
    const targetFisico = preserveFisicoOnSwap ? item.inventarioRaw : customFisicoOnSwap;
    return calcularDivergencia(
      item.disponivelRaw,
      targetFisico,
      selectedNewProduct.fatorSku,
      selectedNewProduct.valorUnitario,
      selectedNewProduct.fatorHl
    );
  }, [item, selectedNewProduct, preserveFisicoOnSwap, customFisicoOnSwap]);

  if (!isOpen || !item) return null;

  const handleConfirmEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const fator = Math.max(1, Number(editFatorSku) || 1);
    const vCaixa = Number(editValorCaixa) || 0;
    const vUnit = Number(editValorUnitario) || (vCaixa > 0 ? vCaixa / fator : item.valorUnitario);

    const div = calcularDivergencia(
      editFiscalRaw,
      editFisicoRaw,
      fator,
      vUnit,
      item.fatorHl || 0.042
    );

    onSaveEdit(item.id, {
      descricao: editDescricao.trim() || item.descricao,
      inventarioRaw: editFisicoRaw,
      inventarioSkus: div.invParsed.skus,
      inventarioLooseUnits: Math.abs(div.invParsed.looseUnits),
      inventarioTotalUnits: div.invParsed.totalUnits,
      disponivelRaw: editFiscalRaw,
      disponivelSkus: div.dispParsed.skus,
      disponivelLooseUnits: Math.abs(div.dispParsed.looseUnits),
      disponivelTotalUnits: div.dispParsed.totalUnits,
      fatorSku: fator,
      valorCaixa: vCaixa > 0 ? vCaixa : vUnit * fator,
      valorUnitario: vUnit,
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
      saldoNegativoDesconsiderado: div.saldoNegativoDesconsiderado
    });
    onClose();
  };

  const handleConfirmSwap = () => {
    if (!selectedNewProduct) return;
    const targetFisico = preserveFisicoOnSwap ? item.inventarioRaw : customFisicoOnSwap;
    onSwapItem(item.id, {
      sku: selectedNewProduct.codigo,
      descricao: selectedNewProduct.descricao,
      fatorSku: selectedNewProduct.fatorSku,
      valorCaixa: selectedNewProduct.valorCaixa,
      valorUnitario: selectedNewProduct.valorUnitario,
      fatorHl: selectedNewProduct.fatorHl,
      grupo: selectedNewProduct.grupo,
      novoFisicoRaw: targetFisico,
    });
    onClose();
  };

  const handleConfirmDelete = () => {
    onDeleteItem(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-amber-400 text-sm">
                  SKU {item.produto}
                </span>
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  Dep. {item.deposito}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                  item.status === 'FALTA' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  item.status === 'SOBRA' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {item.status}
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 truncate mt-0.5" title={item.descricao}>
                {item.descricao}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Metrics Strip */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold">Fiscal (02.05.02):</span>
            <div className="font-mono font-bold text-blue-700">{item.disponivelRaw || '0/00'} ({item.disponivelSkus} cx)</div>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold">Físico (Inventário):</span>
            <div className="font-mono font-bold text-emerald-700">{item.inventarioRaw || '0/00'} ({item.inventarioSkus} cx)</div>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold">Divergência:</span>
            <div className={`font-mono font-bold ${
              item.status === 'FALTA' ? 'text-rose-600' :
              item.status === 'SOBRA' ? 'text-emerald-600' : 'text-slate-600'
            }`}>
              {item.diferencaRaw || '0/00'} ({item.diferencaSkus} cx)
            </div>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold">Impacto Financeiro:</span>
            <div className={`font-mono font-bold ${
              item.status === 'FALTA' ? 'text-rose-600' :
              item.status === 'SOBRA' ? 'text-emerald-600' : 'text-slate-600'
            }`}>
              {item.status === 'FALTA' ? `-${formatCurrency(item.prejuizoFinanceiro)}` :
               item.status === 'SOBRA' ? `+${formatCurrency(item.sobraFinanceira)}` : 'R$ 0,00'}
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('swap')}
            className={`px-3.5 py-2 rounded-t-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'swap'
                ? 'bg-amber-50 text-amber-900 border-t-2 border-l border-r border-amber-500 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-600" />
            <span>Trocar por Outro Item</span>
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`px-3.5 py-2 rounded-t-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-blue-50 text-blue-900 border-t-2 border-l border-r border-blue-500 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span>Editar Dados</span>
          </button>

          <button
            onClick={() => setActiveTab('delete')}
            className={`px-3.5 py-2 rounded-t-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ml-auto ${
              activeTab === 'delete'
                ? 'bg-rose-50 text-rose-900 border-t-2 border-l border-r border-rose-500 shadow-2xs'
                : 'text-rose-600 hover:text-rose-900 hover:bg-rose-50'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Excluir da Tabela</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: SWAP ITEM */}
          {activeTab === 'swap' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  Esta função substitui o SKU atual (<strong>{item.produto}</strong>) por outro produto no armazém. O código, descrição, fator de conversão e preços serão atualizados imediatamente, recalculando a divergência com o novo item.
                </p>
              </div>

              {/* Product Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pesquisar Novo Produto (Código SKU ou Descrição):
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Digite ex: 18268, Skol, Brahma, Sukita..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Search Suggestions */}
              {searchResults.length > 0 && (
                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white shadow-inner">
                  {searchResults.map((prod) => (
                    <div
                      key={prod.codigo}
                      onClick={() => {
                        setSelectedNewProduct(prod);
                        setSearchQuery('');
                      }}
                      className={`p-2.5 text-xs hover:bg-amber-50 cursor-pointer flex items-center justify-between transition ${
                        selectedNewProduct?.codigo === prod.codigo ? 'bg-amber-100/70 font-semibold' : ''
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-[11px]">
                            {prod.codigo}
                          </span>
                          <span className="truncate text-slate-800 font-medium">
                            {prod.descricao}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 space-x-2">
                          <span>Fator: {prod.fatorSku}</span>
                          <span>•</span>
                          <span>Preço Cx: {formatCurrency(prod.valorCaixa)}</span>
                          <span>•</span>
                          <span className="text-slate-400">{prod.origem}</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition shrink-0 cursor-pointer"
                      >
                        Selecionar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Replacement Card */}
              {selectedNewProduct ? (
                <div className="p-3.5 bg-emerald-50/70 border-2 border-emerald-400 rounded-xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Novo Produto Selecionado para Substituição</span>
                    </span>
                    <button
                      onClick={() => setSelectedNewProduct(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Alterar
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-800 text-sm">
                          SKU {selectedNewProduct.codigo}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Fator {selectedNewProduct.fatorSku}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 text-xs mt-0.5">
                        {selectedNewProduct.descricao}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-emerald-700">
                        {formatCurrency(selectedNewProduct.valorCaixa)} / cx
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {formatCurrency(selectedNewProduct.valorUnitario)} / un
                      </div>
                    </div>
                  </div>

                  {/* Count Options */}
                  <div className="pt-2 border-t border-emerald-200/80 space-y-2 text-xs">
                    <label className="flex items-center space-x-2 cursor-pointer text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={preserveFisicoOnSwap}
                        onChange={(e) => setPreserveFisicoOnSwap(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Manter a mesma contagem física atual (<strong>{item.inventarioRaw || '0/00'}</strong>)</span>
                    </label>

                    {!preserveFisicoOnSwap && (
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-slate-600">Nova Contagem Física:</span>
                        <input
                          type="text"
                          value={customFisicoOnSwap}
                          onChange={(e) => setCustomFisicoOnSwap(e.target.value)}
                          placeholder="ex: 22/00 ou 22"
                          className="w-24 px-2 py-1 rounded border border-slate-300 text-xs font-mono text-center font-bold"
                        />
                      </div>
                    )}

                    {/* Live Preview */}
                    {swapPreview && (
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between mt-2">
                        <span className="text-slate-600">Nova Divergência Calculada:</span>
                        <span className={`font-mono font-bold ${
                          swapPreview.status === 'FALTA' ? 'text-rose-600' :
                          swapPreview.status === 'SOBRA' ? 'text-emerald-600' : 'text-slate-700'
                        }`}>
                          {swapPreview.diferencaRaw} ({swapPreview.difSkus} cx) • {formatCurrency(swapPreview.impactoFinanceiro)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  Digite o código ou nome do produto no campo de busca acima para selecionar o item de substituição.
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSwap}
                  disabled={!selectedNewProduct}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Confirmar Troca de Produto</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT ITEM DATA */}
          {activeTab === 'edit' && (
            <form onSubmit={handleConfirmEdit} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p>
                  Edite manualmente a contagem física, o saldo fiscal sistêmico, fator ou preço deste item. A divergência e os valores financeiros serão recalculados de forma imediata.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Descrição */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Descrição do Produto:
                  </label>
                  <input
                    type="text"
                    value={editDescricao}
                    onChange={(e) => setEditDescricao(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                    placeholder="Nome do produto"
                  />
                </div>

                {/* Físico */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Contagem Física (FÍSICO):</span>
                    <span className="text-[10px] text-slate-400 font-normal">ex: 22 ou 22/00</span>
                  </label>
                  <input
                    type="text"
                    value={editFisicoRaw}
                    onChange={(e) => setEditFisicoRaw(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold text-emerald-800 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                    placeholder="ex: 22/00"
                    required
                  />
                </div>

                {/* Fiscal */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Disponível Fiscal (FISCAL):</span>
                    <span className="text-[10px] text-slate-400 font-normal">ex: 0 ou 0/00</span>
                  </label>
                  <input
                    type="text"
                    value={editFiscalRaw}
                    onChange={(e) => setEditFiscalRaw(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold text-blue-800 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                    placeholder="ex: 0/00"
                    required
                  />
                </div>

                {/* Fator SKU */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Fator SKU (unidades/caixa):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editFatorSku}
                    onChange={(e) => setEditFatorSku(Number(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                {/* Preço Caixa */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Preço Caixa (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editValorCaixa}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setEditValorCaixa(v);
                      if (editFatorSku > 0) setEditValorUnitario(Number((v / editFatorSku).toFixed(4)));
                    }}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Edit Preview Card */}
              {editPreview && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Divergência Resultante:</span>
                    <span className={`font-mono font-bold text-sm ${
                      editPreview.status === 'FALTA' ? 'text-rose-600' :
                      editPreview.status === 'SOBRA' ? 'text-emerald-600' : 'text-slate-700'
                    }`}>
                      {editPreview.diferencaRaw} ({editPreview.difSkus} cx)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Impacto Financeiro:</span>
                    <span className={`font-mono font-bold text-sm ${
                      editPreview.status === 'FALTA' ? 'text-rose-600' :
                      editPreview.status === 'SOBRA' ? 'text-emerald-600' : 'text-slate-700'
                    }`}>
                      {formatCurrency(editPreview.impactoFinanceiro)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DELETE ITEM */}
          {activeTab === 'delete' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2.5 text-rose-900 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Atenção: Exclusão de Item da Conciliação</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Você está prestes a remover o SKU <strong>{item.produto} - {item.descricao}</strong> da tabela de conciliação do <strong>Depósito {item.deposito}</strong>.
                </p>
                <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs text-slate-700 space-y-1">
                  <div>• O item deixará de constar nas divergências de estoque (faltas e sobras).</div>
                  <div>• O prejuízo ou sobra deste produto será removido dos totais consolidados.</div>
                  <div>• A alteração será gravada localmente e sincronizada com a base do sistema.</div>
                </div>

                <label className="flex items-center space-x-2 text-xs font-semibold text-rose-900 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Compreendo o impacto e confirmo a exclusão definitiva deste item</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={!confirmDelete}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Item da Tabela</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
