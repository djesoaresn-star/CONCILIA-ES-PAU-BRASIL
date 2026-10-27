import React, { useState, useMemo } from 'react';
import { AlertCircle, PlusCircle, UploadCloud, CheckCircle2 } from 'lucide-react';
import { DepositoId, ProductMaster, StockPositionItem } from '../types';
import {
  calcularDivergencia,
  extractPackFactorFromDescription,
  formatCurrency,
  normalizeSku,
} from '../utils/parsers';

interface MissingSkuRecoveryBannerProps {
  searchTerm: string;
  productsMap: Map<string, ProductMaster>;
  stockPositions: StockPositionItem[];
  selectedDeposito: DepositoId | 'ALL';
  onAddStockItem: (newItem: StockPositionItem) => void;
  onOpenImportModal: () => void;
}

export const MissingSkuRecoveryBanner: React.FC<MissingSkuRecoveryBannerProps> = ({
  searchTerm,
  productsMap,
  stockPositions,
  selectedDeposito,
  onAddStockItem,
  onOpenImportModal,
}) => {
  const [deposito, setDeposito] = useState<DepositoId>(
    selectedDeposito === 'ALL' ? '01' : selectedDeposito
  );
  const [fiscalInput, setFiscalInput] = useState('0/00');
  const [fisicoInput, setFisicoInput] = useState('0/00');
  const [customSku, setCustomSku] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customFator, setCustomFator] = useState('1');
  const [customValorCaixa, setCustomValorCaixa] = useState('0');
  const [addedSuccessMsg, setAddedSuccessMsg] = useState<string | null>(null);

  // Localiza candidatos no Cadastro Mestre que batem com a busca mas NÃO estão em stockPositions (para o depósito filtrado)
  const matchingCatalogProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    const existingSkusInScope = new Set(
      stockPositions
        .filter(s => selectedDeposito === 'ALL' || s.deposito === selectedDeposito)
        .map(s => normalizeSku(s.produto))
    );

    const matches: ProductMaster[] = [];
    productsMap.forEach((prod) => {
      const cleanCode = normalizeSku(prod.codigo);
      if (existingSkusInScope.has(cleanCode)) return;
      if (
        cleanCode.toLowerCase().includes(term) ||
        prod.codigo.toLowerCase().includes(term) ||
        prod.descricao.toLowerCase().includes(term)
      ) {
        matches.push(prod);
      }
    });

    return matches.slice(0, 5);
  }, [searchTerm, productsMap, stockPositions, selectedDeposito]);

  // Verifica se o SKU existe em OUTRO depósito quando um depósito específico está selecionado
  const otherDepositoItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || selectedDeposito === 'ALL') return [];
    return stockPositions.filter(s => {
      if (s.deposito === selectedDeposito) return false;
      return (
        s.produto.toLowerCase().includes(term) ||
        s.descricao.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, stockPositions, selectedDeposito]);

  const handleInsertCatalogProduct = (prod: ProductMaster) => {
    const cleanSku = normalizeSku(prod.codigo);
    const deducedFactor = extractPackFactorFromDescription(prod.descricao);
    const fatorSku = Math.max(1, prod.fatorSku > 1 ? prod.fatorSku : (deducedFactor || 1));
    const valorCaixa = prod.valor > 0 ? prod.valor : (prod.valorUnit > 0 ? prod.valorUnit * fatorSku : fatorSku);
    const valorUnitario = valorCaixa / fatorSku;
    const fatorHl = prod.fatorHl || 0;

    const padZero = fatorSku > 100 ? `0/${'0'.repeat(String(fatorSku - 1).length)}` : '0/00';
    const dispRaw = fiscalInput.trim() || padZero;
    const invRaw = fisicoInput.trim() || padZero;

    const div = calcularDivergencia(dispRaw, invRaw, fatorSku, valorUnitario, fatorHl);

    const newItem: StockPositionItem = {
      id: `${deposito}-${cleanSku}`,
      armazem: '01',
      deposito,
      produto: cleanSku,
      descricao: prod.descricao,
      unidade: 'cx',
      saldoAnteriorRaw: dispRaw,
      entradasRaw: '0/00',
      saidasRaw: '0/00',
      saldoAtualRaw: dispRaw,
      transitoRaw: '0/00',
      disponivelRaw: dispRaw,
      inventarioRaw: invRaw,
      disponivelSkus: div.dispParsed.skus,
      disponivelLooseUnits: Math.abs(div.dispParsed.looseUnits),
      disponivelTotalUnits: div.dispParsed.totalUnits,
      inventarioSkus: div.invParsed.skus,
      inventarioLooseUnits: Math.abs(div.invParsed.looseUnits),
      inventarioTotalUnits: div.invParsed.totalUnits,
      diferencaTotalUnits: div.difUnidades,
      diferencaSkus: div.difSkus,
      diferencaLooseUnits: div.avulsas,
      diferencaRaw: div.diferencaRaw,
      status: div.status,
      valorUnitario,
      valorCaixa,
      fatorSku,
      fatorHl,
      impactoFinanceiro: div.impactoFinanceiro,
      prejuizoFinanceiro: div.prejuizoFinanceiro,
      sobraFinanceira: div.sobraFinanceira,
      impactoHl: div.impactoHl,
      custoMedio: valorUnitario,
      ultReposicao: valorUnitario,
      grupo: prod.grupo || 'MARKETPLACE',
      recontado: true,
      saldoNegativoDesconsiderado: div.saldoNegativoDesconsiderado,
      dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
    };

    onAddStockItem(newItem);
    setAddedSuccessMsg(`SKU ${cleanSku} (${prod.descricao}) incluído na conciliação com sucesso!`);
  };

  const handleInsertCustomSku = () => {
    const cleanSku = normalizeSku(customSku || searchTerm.replace(/\D/g, ''));
    if (!cleanSku || cleanSku === '0') return;
    const desc = (customDesc || searchTerm).trim().toUpperCase();
    const fatorSku = Math.max(1, parseInt(customFator, 10) || extractPackFactorFromDescription(desc) || 1);
    const valorCaixa = Math.max(0.01, parseFloat(customValorCaixa.replace(',', '.')) || fatorSku);
    const valorUnitario = valorCaixa / fatorSku;

    const dispRaw = fiscalInput.trim() || '0/00';
    const invRaw = fisicoInput.trim() || '0/00';
    const div = calcularDivergencia(dispRaw, invRaw, fatorSku, valorUnitario, 0);

    const newItem: StockPositionItem = {
      id: `${deposito}-${cleanSku}`,
      armazem: '01',
      deposito,
      produto: cleanSku,
      descricao: desc || `PRODUTO ${cleanSku}`,
      unidade: 'cx',
      saldoAnteriorRaw: dispRaw,
      entradasRaw: '0/00',
      saidasRaw: '0/00',
      saldoAtualRaw: dispRaw,
      transitoRaw: '0/00',
      disponivelRaw: dispRaw,
      inventarioRaw: invRaw,
      disponivelSkus: div.dispParsed.skus,
      disponivelLooseUnits: Math.abs(div.dispParsed.looseUnits),
      disponivelTotalUnits: div.dispParsed.totalUnits,
      inventarioSkus: div.invParsed.skus,
      inventarioLooseUnits: Math.abs(div.invParsed.looseUnits),
      inventarioTotalUnits: div.invParsed.totalUnits,
      diferencaTotalUnits: div.difUnidades,
      diferencaSkus: div.difSkus,
      diferencaLooseUnits: div.avulsas,
      diferencaRaw: div.diferencaRaw,
      status: div.status,
      valorUnitario,
      valorCaixa,
      fatorSku,
      fatorHl: 0,
      impactoFinanceiro: div.impactoFinanceiro,
      prejuizoFinanceiro: div.prejuizoFinanceiro,
      sobraFinanceira: div.sobraFinanceira,
      impactoHl: 0,
      custoMedio: valorUnitario,
      ultReposicao: valorUnitario,
      grupo: 'GERAL',
      recontado: true,
      saldoNegativoDesconsiderado: div.saldoNegativoDesconsiderado,
      dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
    };

    onAddStockItem(newItem);
    setAddedSuccessMsg(`SKU ${cleanSku} incluído na conciliação com sucesso!`);
  };

  if (addedSuccessMsg) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{addedSuccessMsg}</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Diagnóstico de Auditoria: Item &ldquo;{searchTerm}&rdquo; não localizado na posição atual da 02.05.02
            </h4>
            {otherDepositoItems.length > 0 ? (
              <p className="text-xs text-slate-700 mt-1">
                Este SKU existe no estoque importado, porém está alocado no(s) depósito(s):{' '}
                <strong className="font-mono">
                  {otherDepositoItems.map(i => `Dep. ${i.deposito} (${i.produto} - ${i.descricao})`).join(', ')}
                </strong>
                . Selecione &ldquo;Todos os Depósitos&rdquo; para visualizá-lo.
              </p>
            ) : matchingCatalogProducts.length > 0 ? (
              <p className="text-xs text-slate-700 mt-1">
                Localizamos este SKU no <strong>Cadastro Mestre de Produtos</strong>. Caso sua planilha 02.05.02 tenha sido importada anteriormente, itens de alto fator (ex: <code className="font-mono bg-amber-100 px-1 rounded">CX100</code> / <code className="font-mono bg-amber-100 px-1 rounded">CX200</code> como <strong>31766 ASSOLAN</strong>, que usam 3 dígitos após a barra <code className="font-mono bg-amber-100 px-1 rounded">/000</code> no Promax) agora têm suporte completo na reimportação — ou você pode <strong>incluí-lo diretamente abaixo</strong> na conciliação atual sem perder nenhum ajuste.
              </p>
            ) : (
              <p className="text-xs text-slate-700 mt-1">
                O termo buscado não consta nas linhas importadas da 02.05.02 deste depósito. Você pode reimportar o arquivo 02.05.02 atualizado ou incluir este SKU manualmente abaixo.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenImportModal}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reimportar 02.05.02</span>
        </button>
      </div>

      {matchingCatalogProducts.length > 0 ? (
        <div className="space-y-2.5">
          {matchingCatalogProducts.map((prod) => {
            const cleanSku = normalizeSku(prod.codigo);
            const deduced = extractPackFactorFromDescription(prod.descricao);
            const fator = Math.max(1, prod.fatorSku > 1 ? prod.fatorSku : (deduced || 1));
            const valorCx = prod.valor > 0 ? prod.valor : prod.valorUnit * fator;

            return (
              <div
                key={prod.codigo}
                className="bg-white border border-amber-200 rounded-lg p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                      SKU {cleanSku}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {prod.descricao}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                    Grupo: <strong>{prod.grupo}</strong> · Fator Embalagem: <strong>{fator} un/cx</strong> · Valor Caixa: <strong>{formatCurrency(valorCx)}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Dep.</label>
                    <select
                      value={deposito}
                      onChange={(e) => setDeposito(e.target.value as DepositoId)}
                      className="px-2 py-1.5 rounded border border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-800"
                    >
                      <option value="01">01</option>
                      <option value="02">02</option>
                      <option value="03">03</option>
                      <option value="05">05</option>
                      <option value="06">06</option>
                      <option value="31">31</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                      Fiscal (02.05.02)
                    </label>
                    <input
                      type="text"
                      value={fiscalInput}
                      onChange={(e) => setFiscalInput(e.target.value)}
                      placeholder={fator > 100 ? 'ex: 10/000' : 'ex: 10/00'}
                      className="w-24 px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                      Físico Contado
                    </label>
                    <input
                      type="text"
                      value={fisicoInput}
                      onChange={(e) => setFisicoInput(e.target.value)}
                      placeholder={fator > 100 ? 'ex: 10/000' : 'ex: 10/00'}
                      className="w-24 px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInsertCatalogProduct(prod)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Incluir SKU na Conciliação</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-amber-200 rounded-lg p-3.5 flex flex-wrap items-end gap-2.5">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Dep.</label>
            <select
              value={deposito}
              onChange={(e) => setDeposito(e.target.value as DepositoId)}
              className="px-2 py-1.5 rounded border border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-800"
            >
              <option value="01">01</option>
              <option value="02">02</option>
              <option value="03">03</option>
              <option value="05">05</option>
              <option value="06">06</option>
              <option value="31">31</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Cód. SKU</label>
            <input
              type="text"
              value={customSku || searchTerm.replace(/\D/g, '')}
              onChange={(e) => setCustomSku(e.target.value)}
              placeholder="ex: 31766"
              className="w-24 px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Descrição</label>
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Descrição comercial do SKU"
              className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs text-slate-900"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Fator CX</label>
            <input
              type="number"
              min={1}
              value={customFator}
              onChange={(e) => setCustomFator(e.target.value)}
              className="w-18 px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">R$ Caixa</label>
            <input
              type="text"
              value={customValorCaixa}
              onChange={(e) => setCustomValorCaixa(e.target.value)}
              placeholder="250,35"
              className="w-22 px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Fiscal</label>
            <input
              type="text"
              value={fiscalInput}
              onChange={(e) => setFiscalInput(e.target.value)}
              placeholder="0/00"
              className="w-20 px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Físico</label>
            <input
              type="text"
              value={fisicoInput}
              onChange={(e) => setFisicoInput(e.target.value)}
              placeholder="0/00"
              className="w-20 px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900"
            />
          </div>
          <button
            type="button"
            onClick={handleInsertCustomSku}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Incluir SKU</span>
          </button>
        </div>
      )}
    </div>
  );
};
