import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Package, Tag, Scale, Droplet } from 'lucide-react';
import { formatCurrency, formatHectoliters } from '../utils/parsers';
import { getSkuComprehensiveDetails } from '../utils/productCatalog';
import { ProductMaster } from '../types';

interface SkuTechnicalCardProps {
  sku: string;
  descricao?: string;
  quantidade?: number;
  unidadeMedida?: string;
  currentValorTotal?: number;
  currentVolumeHl?: number;
  productsMap?: Map<string, ProductMaster>;
  onApplyOfficialValues?: (official: {
    valorTotal: number;
    volumeHl: number;
    unitPrice: number;
    boxPrice: number;
    fatorSku: number;
    fatorHl: number;
    descricao?: string;
  }) => void;
  tipoOperacao?: 'quebra' | 'vale' | 'troca' | 'falta';
}

export const SkuTechnicalCard: React.FC<SkuTechnicalCardProps> = ({
  sku,
  descricao,
  quantidade = 1,
  unidadeMedida = 'CX',
  currentValorTotal,
  currentVolumeHl,
  productsMap,
  onApplyOfficialValues,
  tipoOperacao = 'vale',
}) => {
  const details = getSkuComprehensiveDetails(sku, productsMap, descricao);

  const isBox = tipoOperacao === 'quebra'
    ? false // Quebras sempre são em unidades de latas/garrafas avulsas
    : tipoOperacao === 'troca'
      ? ['CX', 'CAIXA', 'CAIXAS', 'SKU', 'SKUS', 'FD', 'FARDO'].includes(String(unidadeMedida).trim().toUpperCase())
      : !['UND', 'UN', 'UNIDADE', 'UNIDADES', 'LATA', 'GFA'].includes(String(unidadeMedida).trim().toUpperCase());

  const refPrice = isBox ? details.boxPrice : details.unitPrice;
  const refHl = isBox ? details.fatorHl : details.unitHl;

  const expectedValorTotal = Number((quantidade * refPrice).toFixed(2));
  const expectedVolumeHl = Number((quantidade * refHl).toFixed(4));

  const isValueCoherent = currentValorTotal !== undefined && currentValorTotal > 0
    ? Math.abs(currentValorTotal - expectedValorTotal) <= 0.05
    : true;

  const isHlCoherent = currentVolumeHl !== undefined && currentVolumeHl > 0
    ? Math.abs(currentVolumeHl - expectedVolumeHl) <= 0.005
    : true;

  const handleApply = () => {
    if (onApplyOfficialValues) {
      onApplyOfficialValues({
        valorTotal: expectedValorTotal,
        volumeHl: expectedVolumeHl,
        unitPrice: details.unitPrice,
        boxPrice: details.boxPrice,
        fatorSku: details.fatorSku,
        fatorHl: details.fatorHl,
        descricao: details.descricao,
      });
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-3 border border-slate-800 shadow-md">
      {/* Header do Card */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-mono text-xs font-bold border border-teal-500/30 shrink-0">
            SKU {details.sku || sku}
          </span>
          <span className="text-xs font-bold text-white truncate max-w-md" title={details.descricao || descricao}>
            {details.descricao || descricao || 'Produto Identificado'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            {details.grupo}
          </span>
          {details.hasCatalog && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Tabela Oficial</span>
            </span>
          )}
        </div>
      </div>

      {/* Grid de Métricas Cadastradas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
        {/* Preço Unitário */}
        <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Preço Unitário (un)</span>
          <div className="text-emerald-400 font-bold text-sm my-0.5">{formatCurrency(details.unitPrice)}</div>
          <span className="text-[9px] text-slate-400 font-sans">Lata / Garrafa avulsa</span>
        </div>

        {/* Preço da Caixa */}
        <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Preço Caixa (cx)</span>
          <div className="text-blue-400 font-bold text-sm my-0.5">{formatCurrency(details.boxPrice)}</div>
          <span className="text-[9px] text-slate-400 font-sans">Fardo Fechado / SKU</span>
        </div>

        {/* Fator de Embalagem */}
        <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Fator da Embalagem</span>
          <div className="text-amber-400 font-bold text-sm my-0.5">{details.fatorSku} un/cx</div>
          <span className="text-[9px] text-slate-400 font-sans truncate">{details.embalagem || 'Unidades por Caixa'}</span>
        </div>

        {/* Hectolitros */}
        <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-sans uppercase font-semibold">Volume (HL)</span>
          <div className="text-purple-400 font-bold text-sm my-0.5">
            {isBox ? `${details.fatorHl.toFixed(3)} HL/cx` : `${details.unitHl.toFixed(5)} HL/un`}
          </div>
          <span className="text-[9px] text-slate-400 font-sans">
            {isBox ? `${details.unitHl.toFixed(5)} un` : `${details.fatorHl.toFixed(3)} cx`}
          </span>
        </div>
      </div>

      {/* Faixa Dinâmica com a Fórmula de Cálculo & Ação de Aplicação */}
      <div className="bg-slate-800/90 rounded-lg p-2.5 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-slate-300">
          <span className="text-slate-400 font-sans font-medium">Equação:</span>
          <strong className="text-teal-300">{quantidade} {isBox ? 'cx' : 'un'}</strong>
          <span className="text-slate-500">×</span>
          <span>{formatCurrency(refPrice)}</span>
          <span className="text-slate-500">=</span>
          <strong className="text-emerald-400 font-bold">{formatCurrency(expectedValorTotal)}</strong>
          <span className="text-slate-600">|</span>
          <span className="text-purple-300 font-semibold">{formatHectoliters(expectedVolumeHl)}</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {(!isValueCoherent || !isHlCoherent) && (
            <span className="text-[11px] text-amber-400 flex items-center space-x-1 font-sans">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Divergência detectada</span>
            </span>
          )}

          {onApplyOfficialValues && (
            <button
              type="button"
              onClick={handleApply}
              className="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-md text-[11px] transition flex items-center space-x-1 cursor-pointer active:scale-95 shadow-xs"
              title="Ajustar automaticamente o Prejuízo (R$) e Volume (HL) com base no cadastro oficial"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Aplicar Tabela Oficial</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
