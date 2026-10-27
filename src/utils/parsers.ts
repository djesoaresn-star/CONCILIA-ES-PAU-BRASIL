import * as XLSX from 'xlsx';
import { ProductMaster, StockPositionItem, RecountItem, QuebraItem, TrocaItem, ValeItem, FaltaMapeadaItem, DepositoId } from '../types';
import { getSkuUnitMetrics } from './productCatalog';

/**
 * Converts any binary Excel file (.xlsx, .xls, .xlsm, .xlsb) ArrayBuffer to semicolon-separated CSV
 */
export function parseExcelWorkbookToCsv(buffer: ArrayBuffer): { csv: string; sheetName: string; sheetNames: string[] } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetNames = workbook.SheetNames;
  const sheetName = sheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
  return { csv, sheetName, sheetNames };
}

/**
 * Cleans up common Portuguese character encoding corruptions (e.g. from ISO-8859-1 / Windows-1252 to UTF-8)
 */
export function cleanPortugueseText(text: string | undefined | null): string {
  if (!text) return '';
  let str = String(text).trim();
  return str
    .replace(/ARMAZ[\ufffd\?]?M/gi, 'ARMAZÉM')
    .replace(/\bARMAZM\b/gi, 'ARMAZÉM')
    .replace(/\bARMAZEM\b/gi, 'ARMAZÉM')
    .replace(/MANH[\ufffd\?ÃãA-Za-z]*/gi, (m) => m.toUpperCase().startsWith('MANH') ? 'MANHÃ' : m)
    .replace(/MOVIMENTA[\ufffd\?]{1,2}O/gi, 'MOVIMENTAÇÃO')
    .replace(/MOVIMENTAO/gi, 'MOVIMENTAÇÃO')
    .replace(/MOVIMENTACAO/gi, 'MOVIMENTAÇÃO')
    .replace(/N[\ufffd\?]?O\s+IDENTIFICAD[OA]/gi, 'NÃO IDENTIFICADO')
    .replace(/\bNO\s+IDENTIFICAD[OA]\b/gi, 'NÃO IDENTIFICADO')
    .replace(/\bN[\ufffd\?]?O\b/gi, 'NÃO')
    .replace(/RESPONS[\ufffd\?]?VEL/gi, 'RESPONSÁVEL')
    .replace(/DESCRI[\ufffd\?]{1,2}O/gi, 'DESCRIÇÃO')
    .replace(/C[\ufffd\?]?D\b/gi, 'CÓD')
    .replace(/[\ufffd\?]?REA\b/gi, 'ÁREA')
    .replace(/LIM[\ufffd\?]O/gi, 'LIMÃO')
    .replace(/LIMO\b/gi, 'LIMÃO')
    .replace(/LIMAO\b/gi, 'LIMÃO')
    .replace(/GUARAN[\ufffd\?]/gi, 'GUARANÁ')
    .replace(/GUARAN\b/gi, 'GUARANÁ')
    .replace(/INDAI[\ufffd\?]/gi, 'INDAIÁ')
    .replace(/INDAI\b/gi, 'INDAIÁ')
    .replace(/PETR[\ufffd\?]POLIS/gi, 'PETRÓPOLIS')
    .replace(/PETRPOLIS/gi, 'PETRÓPOLIS')
    .replace(/T[\ufffd\?]NICA/gi, 'TÔNICA')
    .replace(/TNICA/gi, 'TÔNICA')
    .replace(/HIST[\ufffd\?]RICA/gi, 'HISTÓRICA')
    .replace(/HISTRICA/gi, 'HISTÓRICA')
    .replace(/M[\ufffd\?]DIA/gi, 'MÉDIA')
    .replace(/MDIA/gi, 'MÉDIA')
    .replace(/TER[\ufffd\?]A/gi, 'TERÇA')
    .replace(/TERA/gi, 'TERÇA')
    .replace(/FUN[\ufffd\?]{1,2}O/gi, 'FUNÇÃO')
    .replace(/FUNO/gi, 'FUNÇÃO')
    .replace(/[\ufffd\?]/g, '')
    .trim();
}

/**
 * Normalizes date to DD/MM/YYYY format, supporting ISO strings, timestamps, and Excel serial numbers
 */
export function normalizeDate(val: string | number | undefined | null): string {
  if (!val) return '';
  const str = String(val).trim();
  
  // ISO with or without time: 2026-06-22 11:59:15, 2026-06-22T11:59:15, 2026-06-22
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}/${mm}/${yyyy}`;
  }
  
  // DD/MM/YYYY with or without time: 22/06/2026 11:59:15
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Excel serial number (e.g., 46195)
  const num = Number(str);
  if (!isNaN(num) && num > 30000 && num < 70000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = date.getUTCFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  }

  return str;
}

/**
 * Safely parses DD/MM/YYYY date strings into Date objects
 */
export function parseDateSafe(val: string | undefined | null): Date | null {
  if (!val) return null;
  const norm = normalizeDate(val);
  const parts = norm.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) return dt;
    }
  }
  return null;
}

/**
 * Detects delimiter in a CSV line (semicolon, comma, or tab)
 */
export function detectDelimiter(line: string): string {
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  if (tabs > semicolons && tabs > commas) return '\t';
  if (commas > semicolons) return ',';
  return ';';
}

/**
 * Parses numeric string in Brazilian format: "1.465,03" -> 1465.03, "R$ 30,48" -> 30.48
 */
export function parseBrNumber(val: string | number | undefined | null): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let clean = String(val)
    .replace(/R\$/g, '')
    .replace(/\s+/g, '')
    .trim();

  if (!clean || clean === '-' || clean === 'OK') return 0;

  // Check if trailing minus sign e.g. "212/06-"
  const isNegative = clean.endsWith('-') || clean.startsWith('-');
  clean = clean.replace(/-/g, '');

  // If format is like "1.465,03"
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }

  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

/**
 * Parses the Ambev/Distributor "SKU/UN" format, e.g. "5/02" => 5 skus (boxes) and 2 units.
 * "1.465/03" => 1465 skus and 3 units.
 * "212/06-" => negative or divergence notation.
 */
/**
 * Promax SKU/UN format: "387/06" = 387 caixas + 6 unidades. Sinal "-" no final = negativo ("19/00-").
 * Total em unidades = skus * fator + avulsas (com sinal).
 */
export function parseSkuUnitPromax(val: string | number | undefined | null, fatorSku: number = 1): {
  skus: number;
  looseUnits: number;
  totalUnits: number;
  isNegative: boolean;
} {
  if (val === undefined || val === null || val === '') {
    return { skus: 0, looseUnits: 0, totalUnits: 0, isNegative: false };
  }

  const clean = String(val).trim();
  const isNegative = clean.endsWith('-') || clean.startsWith('-');
  const stripped = clean.replace(/-/g, '').trim();
  const factor = Math.max(1, fatorSku || 1);

  if (stripped.includes('/')) {
    const parts = stripped.split('/');
    const rawSkus = parts[0].replace(/\./g, '').trim();
    const rawUnits = parts[1].replace(/\./g, '').trim();
    const skus = parseInt(rawSkus, 10) || 0;
    const looseUnits = parseInt(rawUnits, 10) || 0;
    const totalUnits = (skus * factor) + looseUnits;
    return {
      skus: isNegative ? -skus : skus,
      looseUnits: isNegative ? -looseUnits : looseUnits,
      totalUnits: isNegative ? -totalUnits : totalUnits,
      isNegative,
    };
  }

  const single = parseInt(stripped.replace(/\./g, ''), 10) || 0;
  return {
    skus: isNegative ? -single : single,
    looseUnits: 0,
    totalUnits: (isNegative ? -single : single) * factor,
    isNegative,
  };
}

export function parseSkuUnitFormat(val: string | undefined | null, fatorSku: number = 1): {
  skus: number;
  looseUnits: number;
  totalUnits: number;
  isNegative: boolean;
} {
  return parseSkuUnitPromax(val, fatorSku);
}

export interface DivergenciaCalculada {
  dispParsed: { skus: number; looseUnits: number; totalUnits: number; isNegative: boolean };
  invParsed: { skus: number; looseUnits: number; totalUnits: number; isNegative: boolean };
  difUnidades: number;
  difSkus: number;
  avulsas: number;
  status: 'OK' | 'SOBRA' | 'FALTA';
  diferencaRaw: string;
  impactoFinanceiro: number;
  prejuizoFinanceiro: number;
  sobraFinanceira: number;
  impactoHl: number;
  saldoNegativoDesconsiderado: boolean;
}

/**
 * Regra Única Oficial de Divergência Promax 02.05.02:
 * - Formato "SKU/UN": "387/06" = 387 caixas + 6 unidades. Sinal "-" no final = negativo.
 * - difUnidades = invUnidades - dispUnidades.
 * - difSkus = Math.trunc(difUnidades / fator); avulsas = |difUnidades % fator|.
 * - status: difUnidades === 0 → OK; > 0 → SOBRA; < 0 → FALTA.
 * - diferencaRaw no formato Promax: "4/04-" para falta e "3/10" para sobra.
 * - Valores: impactoFinanceiro = difUnidades * valorUnitario; impactoHl = (difUnidades / fator) * fatorHl.
 * - Saldo fiscal negativo (Disponivel terminando em "-", ex. "19/00-"): divergência zerada com saldoNegativoDesconsiderado.
 */
export function calcularDivergencia(
  dispRaw: string,
  invRaw: string,
  fator: number,
  valorUnitario: number = 0,
  fatorHl: number = 0
): DivergenciaCalculada {
  const factor = Math.max(1, fator || 1);
  const dispParsed = parseSkuUnitPromax(dispRaw, factor);
  const invParsed = parseSkuUnitPromax(invRaw, factor);

  const cleanDisp = String(dispRaw || '').trim();
  const saldoNegativoDesconsiderado = dispParsed.totalUnits < 0 || cleanDisp.endsWith('-') || cleanDisp.startsWith('-');

  if (saldoNegativoDesconsiderado) {
    return {
      dispParsed,
      invParsed,
      difUnidades: 0,
      difSkus: 0,
      avulsas: 0,
      status: 'OK',
      diferencaRaw: '0/00',
      impactoFinanceiro: 0,
      prejuizoFinanceiro: 0,
      sobraFinanceira: 0,
      impactoHl: 0,
      saldoNegativoDesconsiderado: true,
    };
  }

  const difUnidades = invParsed.totalUnits - dispParsed.totalUnits;
  const difSkus = Math.trunc(difUnidades / factor);
  const avulsas = Math.abs(difUnidades % factor);

  // REGRA OFICIAL DE CONCILIAÇÃO AMBEV DPO:
  // A divergência contábil, financeira e volumétrica é apurada estritamente sobre SKUs fechados (caixas/fardos inteiros).
  // Unidades avulsas após a barra (/XX) são preservadas em diferencaRaw para auditoria operacional Promax, mas não geram falta/sobra financeira.
  const status: 'OK' | 'SOBRA' | 'FALTA' = difSkus === 0 ? 'OK' : difSkus > 0 ? 'SOBRA' : 'FALTA';

  let diferencaRaw = '0/00';
  if (difUnidades !== 0) {
    const absSkus = Math.abs(difSkus);
    const padLen = factor > 100 ? String(factor - 1).length : 2;
    const formattedLoose = String(avulsas).padStart(padLen, '0');
    diferencaRaw = `${absSkus}/${formattedLoose}${difUnidades < 0 ? '-' : ''}`;
  }

  const valorCaixa = valorUnitario * factor;
  const impactoFinanceiro = difSkus * valorCaixa;
  const prejuizoFinanceiro = difSkus < 0 ? Math.abs(difSkus) * valorCaixa : 0;
  const sobraFinanceira = difSkus > 0 ? difSkus * valorCaixa : 0;
  const impactoHl = difSkus * fatorHl;

  return {
    dispParsed,
    invParsed,
    difUnidades,
    difSkus,
    avulsas,
    status,
    diferencaRaw,
    impactoFinanceiro,
    prejuizoFinanceiro,
    sobraFinanceira,
    impactoHl,
    saldoNegativoDesconsiderado: false,
  };
}

/**
 * Formats total units back to "SKU/UN" format, e.g. 62 units with fator 12 => "5/02"
 */
export function formatSkuUnit(totalUnits: number, fatorSku: number = 1): string {
  if (totalUnits === 0) return '0/00';
  const isNeg = totalUnits < 0;
  const absUnits = Math.abs(totalUnits);
  const factor = Math.max(1, fatorSku || 1);

  const skus = Math.floor(absUnits / factor);
  const units = absUnits % factor;
  const padLen = factor > 100 ? String(factor - 1).length : 2;

  const formattedSkus = skus.toLocaleString('pt-BR');
  const formattedUnits = String(units).padStart(padLen, '0');

  return `${isNeg ? '-' : ''}${formattedSkus}/${formattedUnits}`;
}

/**
 * Formata divergências no padrão oficial do Promax 02.05.02:
 * - Falta (físico < disponível): "2/03-" (com o sinal de menos no final)
 * - Sobra (físico > disponível): "2/03"
 * - Conciliado: "0/00"
 */
export function formatPromaxSkuDiff(totalUnits: number, fatorSku: number = 1): string {
  if (totalUnits === 0) return '0/00';
  const factor = Math.max(1, fatorSku || 1);
  const isNeg = totalUnits < 0;
  const absUnits = Math.abs(totalUnits);
  const skus = Math.floor(absUnits / factor);
  const units = absUnits % factor;
  const padLen = factor > 100 ? String(factor - 1).length : 2;

  const formattedSkus = skus.toLocaleString('pt-BR');
  const formattedUnits = String(units).padStart(padLen, '0');

  if (isNeg) {
    return `${formattedSkus}/${formattedUnits}-`;
  }
  return `${formattedSkus}/${formattedUnits}`;
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export function formatNumber(val: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);
}

export function formatHectoliters(val: number): string {
  return `${formatNumber(val, 3)} HL`;
}

/**
 * Normalizes SKU code by stripping leading zeros: "00000347" -> "347", "347" -> "347"
 */
export function normalizeSku(code: string | number | undefined | null): string {
  if (!code) return '';
  const str = String(code).trim().replace(/^0+/, '');
  return str === '' ? '0' : str;
}

/**
 * Splits CSV lines safely handling quotes
 */
export function splitCsvLines(csvText: string): string[] {
  return csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
}

export function splitCsvColumns(line: string, delimiter: string = ';'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Extrai o fator de embalagem (fator SKU) diretamente da descrição comercial do produto.
 * Suporta padrões Ambev/Promax como CX/12, C24, SIX-PACK BANDEJA C/4, SH C/12, CAIXA C/6, 1X12, etc.
 */
export function extractPackFactorFromDescription(desc: string | undefined | null): number | null {
  if (!desc) return null;
  const d = desc.toUpperCase();

  // Pattern 1: SIX-PACK BANDEJA C/4 => 6 * 4 = 24 garrafas/latas
  if (d.includes('SIX-PACK') || d.includes('SIX PACK') || d.includes('SIXPACK')) {
    const mSix = d.match(/C\/?\s*(\d+)/);
    if (mSix) {
      const packs = parseInt(mSix[1], 10);
      if (packs > 0) return 6 * packs;
    }
    return 6;
  }

  // Pattern 2: Multiplicações explícitas "1X12", "1X24", "2X12", "4X6", "1X200"
  const mMult = d.match(/(\d+)\s*[X]\s*(\d+)/);
  if (mMult) {
    const mult = parseInt(mMult[1], 10) * parseInt(mMult[2], 10);
    if (mult > 1 && mult <= 1000) return mult;
  }

  // Pattern 3: "MULTPACK 12" ou "MULTIPACK 12" ou "MULTPACK 15"
  const mMultPack = d.match(/MULT(?:I)?PACK\s*(\d+)/);
  if (mMultPack) {
    const n = parseInt(mMultPack[1], 10);
    if (n > 1 && n <= 1000) return n;
  }

  // Pattern 4: "CX/12", "CX/24", "CX/6", "CX/60", "CX/100", "CX200", "CX24", "CX12"
  const mCx = d.match(/(?:CX\/|CX\s*\/\s*|CX\s*C\/?\s*|CX\s+C\s+|CX\s*C|CX\s*)(\d+)/);
  if (mCx) {
    const n = parseInt(mCx[1], 10);
    if (n > 1 && n <= 1000) return n;
  }

  // Pattern 5: "SH C/12", "SH C15", "SH C/04", "SH C/6", "SHRINK C/6", "SH C 12", "SH12", "SH15"
  const mSh = d.match(/(?:SH\s*C\/?\s*|SHRINK\s*C\/?\s*|SH\s+C\s*|SH\s*)(\d+)/);
  if (mSh) {
    const n = parseInt(mSh[1], 10);
    if (n > 1 && n <= 1000) return n;
  }

  // Pattern 6: "CAIXA C/12", "FD C/6", "FD/36", "FARDO C/6", "DSP C/24", "DISPLAY C/24", "GARRAFEIRA C/24", "POTE C/40", "PT/50"
  const mCx2 = d.match(/(?:CAIXA\s+C\/?\s*|FD\s+C\/?\s*|FD\/?\s*|FARDO\s+C\/?\s*|DSP\s+C\/?\s*|DSP\/?\s*|DISPLAY\s+C\/?\s*|GARRAFEIRA\s+C\/?\s*|POTE\s+C\/?\s*|PT\/?\s*)(\d+)/);
  if (mCx2) {
    const n = parseInt(mCx2[1], 10);
    if (n > 1 && n <= 1000) return n;
  }

  // Pattern 7: "C/12", "C/24", "C/100", "C/200", "C24", "C48", "C50", "C60", "C200" genérico
  const mGeneric = d.match(/\bC\/?\s*(\d{1,4})\b/);
  if (mGeneric) {
    const n = parseInt(mGeneric[1], 10);
    if (n > 1 && n <= 1000) return n;
  }

  return null;
}

/**
 * Parses Product Master file ("Cadastro")
 */
/**
 * Parses Product Master/Cadastro CSV or clipboard table.
 * Dynamically detects delimiter (; , \t) and header names.
 * Supports partial tables (e.g. Código + Valor, or Código + Descrição + Valor),
 * preserving existing fields when updating.
 */
export function parseProductMasterCsv(csvText: string): Map<string, ProductMaster> {
  const map = new Map<string, ProductMaster>();
  const lines = splitCsvLines(csvText);
  if (lines.length === 0) return map;

  const delimiter = detectDelimiter(lines[0]);
  let headerIndexMap: { [key: string]: number } = {};
  let hasHeaders = false;

  const firstLineCols = splitCsvColumns(lines[0], delimiter).map(c => c.trim().toLowerCase());
  if (firstLineCols.some(c => c.includes('cód') || c.includes('cod') || c.includes('sku') || c.includes('material') || c.includes('item') || c.includes('descri') || c.includes('valor'))) {
    hasHeaders = true;
    firstLineCols.forEach((col, idx) => {
      if (col.includes('cód') || col.includes('cod') || col.includes('sku') || col.includes('material') || col === 'item') {
        if (headerIndexMap['codigo'] === undefined) headerIndexMap['codigo'] = idx;
      } else if (col.includes('descri') || col.includes('produto') || col.includes('nome')) {
        if (headerIndexMap['descricao'] === undefined) headerIndexMap['descricao'] = idx;
      } else if (col.includes('fator sku') || col.includes('ft sku') || col.includes('fator cx') || col.includes('fator_sku') || col === 'fator') {
        headerIndexMap['fatorSku'] = idx;
      } else if (col.includes('pallet') || col.includes('palete') || col.includes('fator pal')) {
        headerIndexMap['fatorPallet'] = idx;
      } else if (col.includes('unit') || col.includes('unitário') || col.includes('unitario') || col.includes('vl un')) {
        headerIndexMap['valorUnit'] = idx;
      } else if (col.includes('valor') || col.includes('preço') || col.includes('preco') || col.includes('custo')) {
        if (headerIndexMap['valor'] === undefined) headerIndexMap['valor'] = idx;
      } else if (col.includes('hecto') || col.includes('hl')) {
        headerIndexMap['fatorHl'] = idx;
      } else if (col.includes('grupo')) {
        headerIndexMap['grupo'] = idx;
      } else if (col.includes('embalagem') || col.includes('emb')) {
        headerIndexMap['embalagem'] = idx;
      } else if (col.includes('idade') || col.includes('shelf')) {
        headerIndexMap['idade'] = idx;
      }
    });
  }

  const startLine = hasHeaders ? 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    const currentDelim = detectDelimiter(line);
    const cols = splitCsvColumns(line, currentDelim);
    if (cols.length < 2) continue;

    let codigoRaw = '';
    let descricao = '';
    let fatorSku = 1;
    let fatorPallet = 1;
    let valor = 0;
    let valorUnit = 0;
    let fatorHl = 0;
    let grupo = 'GERAL';
    let embalagem = '';
    let idade = 0;

    if (hasHeaders && headerIndexMap['codigo'] !== undefined) {
      codigoRaw = cols[headerIndexMap['codigo']] || '';
      if (headerIndexMap['descricao'] !== undefined) descricao = cols[headerIndexMap['descricao']] || '';
      if (headerIndexMap['fatorSku'] !== undefined) fatorSku = parseInt(cols[headerIndexMap['fatorSku']], 10) || 1;
      if (headerIndexMap['fatorPallet'] !== undefined) fatorPallet = parseInt(cols[headerIndexMap['fatorPallet']], 10) || 1;
      if (headerIndexMap['valor'] !== undefined) valor = parseBrNumber(cols[headerIndexMap['valor']]);
      if (headerIndexMap['valorUnit'] !== undefined) valorUnit = parseBrNumber(cols[headerIndexMap['valorUnit']]);
      if (headerIndexMap['fatorHl'] !== undefined) fatorHl = parseBrNumber(cols[headerIndexMap['fatorHl']]);
      if (headerIndexMap['grupo'] !== undefined) grupo = (cols[headerIndexMap['grupo']] || 'GERAL').trim().toUpperCase();
      if (headerIndexMap['embalagem'] !== undefined) embalagem = (cols[headerIndexMap['embalagem']] || '').trim();
      if (headerIndexMap['idade'] !== undefined) idade = parseInt(cols[headerIndexMap['idade']], 10) || 0;

      // Autodedução de fator se vier 1 ou ausente
      if (fatorSku <= 1 && descricao) {
        const deduced = extractPackFactorFromDescription(descricao);
        if (deduced && deduced > 1) {
          fatorSku = deduced;
        }
      }

      // Se valorUnit não foi especificado, calcula a partir de valor / fatorSku
      if (!valorUnit && valor && fatorSku > 0) {
        valorUnit = valor / fatorSku;
      }
      // Se valor (caixa) não foi especificado, calcula a partir de valorUnit * fatorSku
      if (!valor && valorUnit && fatorSku > 0) {
        valor = valorUnit * fatorSku;
      }
    } else {
      // Formato posicional:
      // Se 2 colunas: Código; Valor (ou Valor Unitário)
      if (cols.length === 2) {
        codigoRaw = cols[0];
        const val = parseBrNumber(cols[1]);
        valor = val;
        valorUnit = val;
      } else if (cols.length === 3) {
        // Código; Descrição; Valor
        codigoRaw = cols[0];
        descricao = cols[1];
        const val = parseBrNumber(cols[2]);
        valor = val;
        valorUnit = val;
      } else {
        // Ambev padrão: Código; Descrição; Fator SKU; FATOR PALLET; VALOR; VALOR UNIT; Fator Hecto (HL); GRUPO; EMBALAGEM; IDADE
        codigoRaw = cols[0];
        descricao = cols[1] || '';
        fatorSku = parseInt(cols[2], 10) || 1;
        fatorPallet = parseInt(cols[3], 10) || 1;
        valor = parseBrNumber(cols[4]);
        valorUnit = cols[5] ? parseBrNumber(cols[5]) : (fatorSku > 0 ? valor / fatorSku : valor);
        fatorHl = cols[6] ? parseBrNumber(cols[6]) : 0;
        grupo = (cols[7] || 'GERAL').trim().toUpperCase();
        embalagem = (cols[8] || '').trim();
        idade = parseInt(cols[9], 10) || 0;

        // Autodedução de fator se vier 1 ou ausente
        if (fatorSku <= 1 && descricao) {
          const deduced = extractPackFactorFromDescription(descricao);
          if (deduced && deduced > 1) {
            fatorSku = deduced;
            if (valor > 0 && (valorUnit === valor || valorUnit <= 0)) {
              valorUnit = valor / fatorSku;
            }
          }
        }
      }
    }

    const codigo = normalizeSku(codigoRaw);
    if (!codigo || codigo === '0') continue;

    map.set(codigo, {
      codigo,
      descricao: descricao || `Produto ${codigo}`,
      fatorSku: Math.max(1, fatorSku),
      fatorPallet: Math.max(1, fatorPallet),
      valor,
      valorUnit,
      valorCaixa: valor,
      valorUnitario: valorUnit,
      fatorHl,
      grupo,
      embalagem,
      idade,
    });
  }

  return map;
}

export interface RejectedLineInfo {
  line: number;
  raw: string;
  reason: string;
}

export interface DivergentColNInfo {
  line: number;
  sku: string;
  calculated: string;
  colN: string;
}

export interface Parse020502DetailedResult {
  items: StockPositionItem[];
  totalLinesRead: number;
  dataLinesRead: number;
  rejectedLines: RejectedLineInfo[];
  divergentColNCount: number;
  divergentColNLines: DivergentColNInfo[];
  usedFallbackIndices: boolean;
  emptyDepositoAssumedCount: number;
  saldoNegativoCount: number;
  totalDispSkus: number;
  totalInvSkus: number;
  countOk: number;
  countSobra: number;
  countFalta: number;
}

// Regex para validação de formato SKU/UN do Promax:
// Suporta 1 a 4 dígitos após a barra (ex: 387/06, 12/000 em itens CX100/CX200 como 31766 ASSOLAN, 19/00-, -19/00)
// bem como quantidades inteiras (ex: 15, 0) quando o Excel suprime "/00".
export const PROMAX_QTY_REGEX = /^-?\d[\d.]*(?:\/\d{1,4})?-?$/;

const EXPLICIT_IGNORED_HEADERS = new Set([
  'diferenca congelamento',
  'qtd estoque',
  'qtd contagem',
  'estoque cm',
  'estoque ur',
  'estoque mr',
  'estoque cm/ur/mr',
  'contagem cm',
  'contagem ur',
  'contagem mr',
  'contagem cm/ur/mr',
  'sub-depositos',
  'sub depositos',
  'sub-deposito',
  'sub deposito',
  'saldo atual real',
  'saldo grade real',
]);

function normalizeHeaderString(h: string): string {
  return h
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Parses 02.05.02 Stock Position CSV com relatório detalhado de validação
 */
export function parse020502CsvDetailed(
  csvText: string,
  productsMap: Map<string, ProductMaster>,
  targetDeposito?: DepositoId | 'ALL'
): Parse020502DetailedResult {
  const items: StockPositionItem[] = [];
  const rejectedLines: RejectedLineInfo[] = [];
  const divergentColNLines: DivergentColNInfo[] = [];

  let totalLinesRead = 0;
  let dataLinesRead = 0;
  let usedFallbackIndices = false;
  let emptyDepositoAssumedCount = 0;
  let saldoNegativoCount = 0;
  let totalDispSkus = 0;
  let totalInvSkus = 0;
  let countOk = 0;
  let countSobra = 0;
  let countFalta = 0;

  const lines = splitCsvLines(csvText);
  totalLinesRead = lines.length;
  if (lines.length === 0) {
    return {
      items,
      totalLinesRead: 0,
      dataLinesRead: 0,
      rejectedLines,
      divergentColNCount: 0,
      divergentColNLines,
      usedFallbackIndices: false,
      emptyDepositoAssumedCount: 0,
      saldoNegativoCount: 0,
      totalDispSkus: 0,
      totalInvSkus: 0,
      countOk: 0,
      countSobra: 0,
      countFalta: 0,
    };
  }

  const delimiter = detectDelimiter(lines[0]);

  // Fallback padrão se os cabeçalhos não forem localizados por igualdade exata
  const colIndices = {
    armazem: 0,
    deposito: 1,      // Coluna B
    produto: 3,       // Coluna D
    descricao: 4,     // Coluna E
    unidade: 5,       // Coluna F
    saldoAnterior: 6, // Coluna G
    entradas: 7,      // Coluna H
    saidas: 8,        // Coluna I
    saldoAtual: 9,    // Coluna J
    transito: 10,     // Coluna K
    disponivel: 11,   // Coluna L (Saldo Fiscal)
    inventario: 12,   // Coluna M (Inventário Físico)
    diferenca: 13,    // Coluna N (Diferença Promax)
    tipo: 22,         // Coluna W
    fatorSku: 23,     // Coluna X
    custoMedio: 24,   // Coluna Y
    ultReposicao: 25, // Coluna Z
  };

  const assigned = new Set<string>();
  let headerIndex = -1;

  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const rawCols = splitCsvColumns(lines[i], delimiter);
    let matchedDisponivel = false;
    let matchedInventario = false;

    rawCols.forEach((colRaw) => {
      const norm = normalizeHeaderString(colRaw);
      if (norm === 'disponivel' || norm === 'saldo fiscal') matchedDisponivel = true;
      if (norm === 'inventario' || norm === 'contagem fisica') matchedInventario = true;
    });

    if (matchedDisponivel || matchedInventario) {
      headerIndex = i;
      rawCols.forEach((colRaw, idx) => {
        const norm = normalizeHeaderString(colRaw);
        if (EXPLICIT_IGNORED_HEADERS.has(norm)) {
          return;
        }

        // Mapeamento por IGUALDADE EXATA apenas (sem includes)
        // Cada campo é atribuído uma única vez, pela primeira ocorrência
        if ((norm === 'armazem' || norm === 'armaz') && !assigned.has('armazem')) {
          colIndices.armazem = idx;
          assigned.add('armazem');
        } else if ((norm === 'deposito' || norm === 'dep') && !assigned.has('deposito')) {
          colIndices.deposito = idx;
          assigned.add('deposito');
        } else if ((norm === 'produto' || norm === 'cod produto' || norm === 'codigo') && !assigned.has('produto')) {
          colIndices.produto = idx;
          assigned.add('produto');
        } else if ((norm === 'descricao' || norm === 'descricao do produto') && !assigned.has('descricao')) {
          colIndices.descricao = idx;
          assigned.add('descricao');
        } else if ((norm === 'unidade' || norm === 'un') && !assigned.has('unidade')) {
          colIndices.unidade = idx;
          assigned.add('unidade');
        } else if (norm === 'saldo anterior' && !assigned.has('saldoAnterior')) {
          colIndices.saldoAnterior = idx;
          assigned.add('saldoAnterior');
        } else if (norm === 'entradas' && !assigned.has('entradas')) {
          colIndices.entradas = idx;
          assigned.add('entradas');
        } else if (norm === 'saidas' && !assigned.has('saidas')) {
          colIndices.saidas = idx;
          assigned.add('saidas');
        } else if (norm === 'saldo atual' && !assigned.has('saldoAtual')) {
          colIndices.saldoAtual = idx;
          assigned.add('saldoAtual');
        } else if (norm === 'transito' && !assigned.has('transito')) {
          colIndices.transito = idx;
          assigned.add('transito');
        } else if ((norm === 'disponivel' || norm === 'saldo fiscal') && !assigned.has('disponivel')) {
          colIndices.disponivel = idx;
          assigned.add('disponivel');
        } else if ((norm === 'inventario' || norm === 'contagem fisica') && !assigned.has('inventario')) {
          colIndices.inventario = idx;
          assigned.add('inventario');
        } else if (norm === 'diferenca' && !assigned.has('diferenca')) {
          colIndices.diferenca = idx;
          assigned.add('diferenca');
        } else if (norm === 'tipo' && !assigned.has('tipo')) {
          colIndices.tipo = idx;
          assigned.add('tipo');
        } else if ((norm === 'fator' || norm === 'fator sku') && !assigned.has('fatorSku')) {
          colIndices.fatorSku = idx;
          assigned.add('fatorSku');
        } else if (norm === 'custo medio' && !assigned.has('custoMedio')) {
          colIndices.custoMedio = idx;
          assigned.add('custoMedio');
        } else if ((norm === 'ult. reposicao' || norm === 'ult reposicao' || norm === 'ultima reposicao') && !assigned.has('ultReposicao')) {
          colIndices.ultReposicao = idx;
          assigned.add('ultReposicao');
        }
      });
      break;
    }
  }

  if (headerIndex < 0 || !assigned.has('disponivel') || !assigned.has('inventario')) {
    usedFallbackIndices = true;
  }

  const startLine = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = splitCsvColumns(line, delimiter);
    if (cols.length < 5) continue;

    // Pular linhas de rodapé ou totalizadores
    const firstColClean = normalizeHeaderString(cols[0] || '');
    if (firstColClean.includes('total') || firstColClean.includes('media')) {
      continue;
    }

    const rawProduto = cols[colIndices.produto];
    const produto = normalizeSku(rawProduto);
    if (!produto || produto === '0') {
      continue;
    }

    dataLinesRead++;

    // Validação Promax (suporta /XX, /XXX para CX100/CX200 ex. 31766 ASSOLAN, inteiros e células zeradas/vazias quando a contraparte existe)
    const rawDispCell = (cols[colIndices.disponivel] || '').trim();
    const rawInvCell = (cols[colIndices.inventario] || '').trim();

    const isDispBlank = rawDispCell === '' || rawDispCell === '-';
    const isInvBlank = rawInvCell === '' || rawInvCell === '-';

    const rawDisp = isDispBlank && !isInvBlank && PROMAX_QTY_REGEX.test(rawInvCell) ? '0/00' : rawDispCell;
    const rawInv = isInvBlank && !isDispBlank && PROMAX_QTY_REGEX.test(rawDispCell) ? '0/00' : rawInvCell;

    if (!PROMAX_QTY_REGEX.test(rawDisp) || !PROMAX_QTY_REGEX.test(rawInv)) {
      rejectedLines.push({
        line: i + 1,
        raw: line,
        reason: `Valores de Disponível ("${rawDispCell}") ou Inventário ("${rawInvCell}") não seguem o formato Promax SKU/UN. Linha rejeitada.`
      });
      continue;
    }

    // Depósito (Coluna B): se vier vazio, assume "01" e contabiliza aviso
    let rawDep = (cols[colIndices.deposito] || '').trim();
    if (!rawDep) {
      rawDep = '01';
      emptyDepositoAssumedCount++;
    } else if (rawDep.length === 1) {
      rawDep = '0' + rawDep;
    }
    const deposito: DepositoId = (rawDep as DepositoId) || '01';

    if (targetDeposito && targetDeposito !== 'ALL' && deposito !== targetDeposito) {
      continue;
    }

    const armazem = cols[colIndices.armazem]?.trim() || '01';
    const descricao = cols[colIndices.descricao]?.trim() || `Produto ${produto}`;
    const unidade = cols[colIndices.unidade]?.trim() || 'cx';
    const saldoAnteriorRaw = cols[colIndices.saldoAnterior]?.trim() || '0/00';
    const entradasRaw = cols[colIndices.entradas]?.trim() || '0/00';
    const saidasRaw = cols[colIndices.saidas]?.trim() || '0/00';
    const saldoAtualRaw = cols[colIndices.saldoAtual]?.trim() || '0/00';
    const transitoRaw = cols[colIndices.transito]?.trim() || '0/00';
    const disponivelRaw = rawDisp;
    const inventarioRaw = rawInv;

    const prodInfo = productsMap.get(produto);
    let fatorSku = (cols[colIndices.fatorSku] ? parseInt(cols[colIndices.fatorSku], 10) : 0) || prodInfo?.fatorSku || 0;
    if (fatorSku <= 1) {
      const deduced = extractPackFactorFromDescription(descricao) || extractPackFactorFromDescription(prodInfo?.descricao);
      if (deduced && deduced > 1) {
        fatorSku = deduced;
      }
    }

    // Validação de unidades avulsas vs fator
    const rawDispLoose = parseSkuUnitPromax(disponivelRaw, 9999).looseUnits;
    const rawInvLoose = parseSkuUnitPromax(inventarioRaw, 9999).looseUnits;
    const maxLooseInRaw = Math.max(Math.abs(rawDispLoose), Math.abs(rawInvLoose));
    if (maxLooseInRaw >= fatorSku) {
      const deduced = extractPackFactorFromDescription(descricao) || extractPackFactorFromDescription(prodInfo?.descricao);
      if (deduced && deduced > maxLooseInRaw) {
        fatorSku = deduced;
      } else if (fatorSku <= maxLooseInRaw) {
        fatorSku = maxLooseInRaw + 1;
      }
    }

    fatorSku = Math.max(1, fatorSku);

    // Identidade contábil soberana: Custo Médio real da 02.05.02 (Promax) prevalece;
    // valorCaixa é SEMPRE exatamente valorUnitario * fatorSku (elimina divergência entre modos/telas).
    const parsedCm = cols[colIndices.custoMedio] ? parseBrNumber(cols[colIndices.custoMedio]) : 0;
    let valorUnitario = 0;
    let valorCaixa = 0;
    if (parsedCm > 0) {
      valorUnitario = parsedCm;
      valorCaixa = parsedCm * fatorSku;
    } else if (prodInfo?.valor && prodInfo.valor > 0) {
      valorCaixa = prodInfo.valor;
      valorUnitario = valorCaixa / fatorSku;
    } else if (prodInfo?.valorUnit && prodInfo.valorUnit > 0) {
      valorUnitario = prodInfo.valorUnit;
      valorCaixa = valorUnitario * fatorSku;
    } else {
      const metrics = getSkuUnitMetrics(produto, undefined, undefined, undefined, descricao);
      valorUnitario = metrics.unitPrice > 0 ? metrics.unitPrice : 1;
      valorCaixa = valorUnitario * fatorSku;
    }

    const fatorHl = prodInfo?.fatorHl || 0;
    const grupo = prodInfo?.grupo || (cols[colIndices.tipo] || 'PA').trim();

    // Aplicação da regra única de divergência
    const div = calcularDivergencia(
      disponivelRaw,
      inventarioRaw,
      fatorSku,
      valorUnitario,
      fatorHl
    );

    // Validação contra Coluna N (Diferença no arquivo Promax)
    const colNRaw = (cols[colIndices.diferenca] || '').trim();
    if (colNRaw && !div.saldoNegativoDesconsiderado) {
      const normN = colNRaw.replace(/\s+/g, '');
      const normCalc = div.diferencaRaw.replace(/\s+/g, '');
      if (normN !== normCalc) {
        divergentColNLines.push({
          line: i + 1,
          sku: produto,
          calculated: div.diferencaRaw,
          colN: colNRaw,
        });
      }
    }

    if (div.saldoNegativoDesconsiderado) {
      saldoNegativoCount++;
    } else {
      totalDispSkus += div.dispParsed.skus;
      totalInvSkus += div.invParsed.skus;
      if (div.status === 'OK') countOk++;
      else if (div.status === 'SOBRA') countSobra++;
      else if (div.status === 'FALTA') countFalta++;
    }

    const custoMedio = cols[colIndices.custoMedio] ? parseBrNumber(cols[colIndices.custoMedio]) : valorUnitario;
    const ultReposicao = cols[colIndices.ultReposicao] ? parseBrNumber(cols[colIndices.ultReposicao]) : valorUnitario;

    items.push({
      id: `${deposito}-${produto}`,
      armazem,
      deposito,
      produto,
      descricao: prodInfo?.descricao || descricao,
      unidade,
      saldoAnteriorRaw,
      entradasRaw,
      saidasRaw,
      saldoAtualRaw,
      transitoRaw,
      disponivelRaw,
      inventarioRaw,
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
      custoMedio,
      ultReposicao,
      grupo,
      recontado: false,
      saldoNegativoDesconsiderado: div.saldoNegativoDesconsiderado,
    });
  }

  return {
    items,
    totalLinesRead,
    dataLinesRead,
    rejectedLines,
    divergentColNCount: divergentColNLines.length,
    divergentColNLines,
    usedFallbackIndices,
    emptyDepositoAssumedCount,
    saldoNegativoCount,
    totalDispSkus,
    totalInvSkus,
    countOk,
    countSobra,
    countFalta,
  };
}

/**
 * Parses 02.05.02 Stock Position CSV (Retorna array padrão StockPositionItem[] para compatibilidade total)
 */
export function parse020502Csv(
  csvText: string,
  productsMap: Map<string, ProductMaster>,
  targetDeposito?: DepositoId | 'ALL'
): StockPositionItem[] {
  return parse020502CsvDetailed(csvText, productsMap, targetDeposito).items;
}

/**
 * Parses 02.11.01 (or 01.11) Recount CSV
 */
export function parse021101Csv(csvText: string, productsMap: Map<string, ProductMaster>): RecountItem[] {
  const recounts: RecountItem[] = [];
  const lines = splitCsvLines(csvText);

  for (const line of lines) {
    if (line.toLowerCase().includes('deposito') || line.toLowerCase().includes('qtdade')) {
      continue;
    }
    const cols = splitCsvColumns(line, ';');
    if (cols.length < 4) continue;

    let rawDep = cols[0]?.trim();
    if (rawDep && rawDep.length === 1) rawDep = '0' + rawDep;
    const deposito: DepositoId = (rawDep as DepositoId) || '01';

    const area = cols[1] || '1';
    const produto = normalizeSku(cols[2]);
    if (!produto) continue;

    const descricao = cols[3] || '';
    const embalagem = cols[4] || '';
    const unidadeVenda = cols[5] || '';
    const qtdPallet = parseInt(cols[7], 10) || 0;
    const status = cols[8] || 'OK';

    // Qtdade: in 02.11.01, boxes/SKUs or column 9/4
    const rawQtd = cols[9]?.replace(/\./g, '') || cols[4]?.replace(/\./g, '') || '0';
    const qtdadeSkus = parseInt(rawQtd, 10) || 0;

    const pallet1 = parseInt(cols[10], 10) || 0;
    const lastro1 = parseInt(cols[11], 10) || 0;
    const avulsa1 = parseInt(cols[13], 10) || 0;

    const prodInfo = productsMap.get(produto);
    const fatorSku = prodInfo?.fatorSku || 1;
    const totalUnits = (qtdadeSkus * fatorSku) + avulsa1;

    recounts.push({
      id: `${deposito}-${area}-${produto}`,
      deposito,
      area,
      produto,
      descricao: prodInfo?.descricao || descricao,
      embalagem,
      unidadeVenda,
      qtdPallet,
      status,
      qtdadeSkus,
      avulsa: avulsa1,
      totalUnits,
      palletsCount: pallet1,
      lastroCount: lastro1,
    });
  }

  return recounts;
}

// Alias for backwards compatibility
export const parse0111Csv = parse021101Csv;

/**
 * Updates stock position with recounts from 02.11.01:
 * Rule: Items present in 02.11.01 update physical inventory,
 * all other items remain untouched.
 * Rule 2: If available stock is negative, difference is zeroed out.
 */
export function apply021101Recounts(
  stock: StockPositionItem[],
  recounts: RecountItem[],
  targetDeposito?: DepositoId
): StockPositionItem[] {
  // Group recounts by deposito + produto (summing quantities if product appears across multiple areas)
  const recountMap = new Map<string, { totalUnits: number; skus: number; avulsa: number }>();

  for (const rec of recounts) {
    if (targetDeposito && rec.deposito !== targetDeposito) continue;
    const key = `${rec.deposito}-${rec.produto}`;
    const existing = recountMap.get(key) || { totalUnits: 0, skus: 0, avulsa: 0 };
    existing.totalUnits += rec.totalUnits;
    existing.skus += rec.qtdadeSkus;
    existing.avulsa += rec.avulsa;
    recountMap.set(key, existing);
  }

  return stock.map(item => {
    const key = `${item.deposito}-${item.produto}`;
    const rec = recountMap.get(key);

    if (!rec) {
      // Not counted in 02.11.01 -> Remains with previous inventory
      return item;
    }

    const newInventarioTotalUnits = rec.totalUnits;
    const newInventarioRaw = formatSkuUnit(newInventarioTotalUnits, item.fatorSku);

    const div = calcularDivergencia(
      item.disponivelRaw,
      newInventarioRaw,
      item.fatorSku,
      item.valorUnitario,
      item.fatorHl
    );

    return {
      ...item,
      inventarioRaw: newInventarioRaw,
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
      dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
    };
  });
}

// Alias for backwards compatibility
export const apply0111Recounts = apply021101Recounts;

// Alias for Cadastro CSV
export const parseCadastroCsv = parseProductMasterCsv;

/**
 * Parses Quebras from any Excel or CSV format
 * Dynamically detects headers or positional formats:
 * - Format Ambev/Promax: Data;Mês;CodProduto;Descricao;Quantidade;Area;Turno;CodQuebra;Motivo;Colaborador;Funcao;VALOR DA AVARIA;HECTO LITRO;HECTO PERDIDO
 * - Format Standard: DATA;SKU;DESCRICAO;QUANTIDADE;MOTIVO;AREA;TURNO;DEPOSITO
 * - Filters out statistical summary lines (MÉDIA, TOTAL, etc.)
 */
export function parseQuebrasCsv(
  csvText: string, 
  productsMap: Map<string, ProductMaster>,
  targetDeposito: DepositoId = '01',
  defaultDate?: string,
  defaultSemanaRef?: string
): QuebraItem[] {
  const quebras: QuebraItem[] = [];
  const lines = splitCsvLines(csvText);
  if (lines.length === 0) return quebras;

  const delimiter = detectDelimiter(lines[0]);

  // Clean and normalize header strings
  const cleanHeader = (h: string) => {
    const pre = String(h || '')
      .replace(/[\ufffd\?]/g, '')
      .replace(/c[óo\ufffd\?]?d\.?\s*/gi, 'cod')
      .replace(/[\ufffd\?]?rea/gi, 'area')
      .replace(/descri[çc\ufffd\?]{1,2}[aã\ufffd\?]?o/gi, 'descricao')
      .replace(/respons[aá\ufffd\?]?vel/gi, 'responsavel');
    return pre.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  };

  let headerIndex = -1;
  const colMap: Record<string, number> = {};

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const cols = splitCsvColumns(lines[i], delimiter);
    const cleaned = cols.map(cleanHeader);
    
    // Check if line contains header markers
    const hasData = cleaned.some(c => c.includes('data') || c === 'dt' || c === 'dia');
    const hasProduct = cleaned.some(c => c.includes('codproduto') || c.includes('sku') || c.includes('codsku') || c.includes('cdsku') || c.includes('codigo') || c.includes('cdigo') || c.includes('cdproduto') || c.includes('codprod') || c.includes('produto') || c.includes('item'));
    const hasQtd = cleaned.some(c => c.includes('quantidade') || c.includes('qtd') || c.includes('quant'));
    const hasValor = cleaned.some(c => c.includes('valortotal') || c.includes('valorestimado') || c.includes('valor') || c.includes('avaria') || c.includes('prejuizo'));
    const hasHecto = cleaned.some(c => c.includes('hlperdido') || c.includes('hecto') || c.includes('hl') || c.includes('volume'));
    const hasMotivo = cleaned.some(c => c.includes('motivo') || c.includes('codquebra') || c.includes('cdquebra') || c.includes('cdigomotivo') || c.includes('codigomotivo'));
    
    if ((hasProduct && (hasQtd || hasValor || hasHecto || hasMotivo)) || (hasData && (hasProduct || hasQtd))) {
      headerIndex = i;
      cols.forEach((col, idx) => {
        const c = cleanHeader(col);
        if ((c.includes('data') || c === 'dt' || c === 'dia') && colMap.data === undefined) colMap.data = idx;
        else if (c === 'mes' && colMap.mes === undefined) colMap.mes = idx;
        else if ((c.includes('codproduto') || c === 'sku' || c.includes('codsku') || c.includes('cdsku') || c.includes('codigo') || c.includes('cdigo') || c.includes('cdproduto') || c.includes('codprod') || c.includes('produto') || c.includes('item')) && colMap.sku === undefined) colMap.sku = idx;
        else if ((c.includes('descricao') || c.includes('descrio') || c === 'desc' || c.includes('nome')) && colMap.descricao === undefined) colMap.descricao = idx;
        else if ((c.includes('quantidade') || c.includes('qtd') || c.includes('quant')) && colMap.quantidade === undefined) colMap.quantidade = idx;
        else if ((c.includes('area') || c === 'rea' || c.includes('setor') || c.includes('local')) && colMap.area === undefined) colMap.area = idx;
        else if ((c.includes('turno') || c.includes('periodo')) && colMap.turno === undefined) colMap.turno = idx;
        else if ((c.includes('codquebra') || c.includes('cdquebra') || c.includes('codigoquebra') || c.includes('codq') || c.includes('motivocodigo') || c.includes('cdigomotivo') || c.includes('codigomotivo') || c.includes('codmotivo')) && colMap.codQuebra === undefined) colMap.codQuebra = idx;
        else if ((c.includes('motivo') || c.includes('tipoquebra') || c.includes('causa') || c.includes('tipo')) && !c.includes('cod') && !c.includes('cd') && colMap.motivo === undefined) colMap.motivo = idx;
        else if ((c.includes('colaborador') || c.includes('funcionario') || c.includes('operador') || c.includes('responsavel') || c.includes('responsvel')) && colMap.colaborador === undefined) colMap.colaborador = idx;
        else if ((c.includes('funcao') || c.includes('funco') || c.includes('cargo')) && colMap.funcao === undefined) colMap.funcao = idx;
        else if ((c.includes('valortotal') || c.includes('valorestimado') || c.includes('avaria') || c.includes('prejuizo') || (c.includes('valor') && !c.includes('unit'))) && colMap.valorTotal === undefined) colMap.valorTotal = idx;
        else if ((c.includes('hectototal') || c.includes('hectoperdido') || c.includes('volumehl') || c.includes('hlperdido') || c.includes('hecto') || c === 'hl') && colMap.volumeHl === undefined) colMap.volumeHl = idx;
        else if ((c.includes('hectolitro') || c.includes('fatorhl')) && colMap.fatorHl === undefined) colMap.fatorHl = idx;
        else if ((c.includes('semana') || c.includes('ref')) && colMap.semanaRef === undefined) colMap.semanaRef = idx;
        else if ((c.includes('origem') || c.includes('fonte')) && colMap.origem === undefined) colMap.origem = idx;
        else if ((c.includes('deposito') || c === 'cd') && colMap.deposito === undefined) colMap.deposito = idx;
      });
      break;
    }
  }

  const startLine = headerIndex >= 0 ? headerIndex + 1 : 0;
  let idCounter = 1;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = splitCsvColumns(line, delimiter);
    if (cols.length < 3) continue;

    let rawData = '';
    let rawMes = '';
    let rawSku = '';
    let rawDesc = '';
    let rawQtd = '';
    let rawArea = '';
    let rawTurno = '';
    let rawCodQuebra = '';
    let rawMotivo = '';
    let rawColaborador = '';
    let rawFuncao = '';
    let rawValorTotal = '';
    let rawVolumeHl = '';
    let rawFatorHl = '';
    let rawDeposito = '';
    let rawOrigem = '';
    let rawSemanaRef = '';

    if (headerIndex >= 0) {
      rawData = colMap.data !== undefined ? cols[colMap.data] : '';
      rawMes = colMap.mes !== undefined ? cols[colMap.mes] : '';
      rawSku = colMap.sku !== undefined ? cols[colMap.sku] : '';
      rawDesc = colMap.descricao !== undefined ? cols[colMap.descricao] : '';
      rawQtd = colMap.quantidade !== undefined ? cols[colMap.quantidade] : '';
      rawArea = colMap.area !== undefined ? cols[colMap.area] : '';
      rawTurno = colMap.turno !== undefined ? cols[colMap.turno] : '';
      rawCodQuebra = colMap.codQuebra !== undefined ? cols[colMap.codQuebra] : '';
      rawMotivo = colMap.motivo !== undefined ? cols[colMap.motivo] : '';
      rawColaborador = colMap.colaborador !== undefined ? cols[colMap.colaborador] : '';
      rawFuncao = colMap.funcao !== undefined ? cols[colMap.funcao] : '';
      rawValorTotal = colMap.valorTotal !== undefined ? cols[colMap.valorTotal] : '';
      rawVolumeHl = colMap.volumeHl !== undefined ? cols[colMap.volumeHl] : '';
      rawFatorHl = colMap.fatorHl !== undefined ? cols[colMap.fatorHl] : '';
      rawSemanaRef = colMap.semanaRef !== undefined ? cols[colMap.semanaRef] : '';
      rawDeposito = colMap.deposito !== undefined ? cols[colMap.deposito] : '';
      rawOrigem = colMap.origem !== undefined ? cols[colMap.origem] : '';
    } else {
      // Positional fallback
      if (cols.length >= 10) {
        // Ambev export format with 14 or 15 columns (Data first)
        rawData = cols[0];
        rawMes = cols[1];
        rawSku = cols[2];
        rawDesc = cols[3];
        rawQtd = cols[4];
        rawArea = cols[5];
        rawTurno = cols[6];
        rawCodQuebra = cols[7];
        rawMotivo = cols[8];
        rawColaborador = cols[9];
        rawFuncao = cols[10] || '';
        rawValorTotal = cols[11] || '';
        rawFatorHl = cols[12] || '';
        rawVolumeHl = cols[13] || '';
        rawOrigem = cols[14] || '';
      } else if (cols.length === 8 && /^\d+$/.test(cols[0]?.trim())) {
        // Standard 8-column format:
        // Col 0: Código SKU
        // Col 1: Descrição
        // Col 2: Quantidade
        // Col 3: Valor Total (R$)
        // Col 4: Hecto Total (HL)
        // Col 5: Código Motivo
        // Col 6: ÁREA
        // Col 7: MOTIVO
        rawSku = cols[0];
        rawDesc = cols[1];
        rawQtd = cols[2];
        rawValorTotal = cols[3];
        rawVolumeHl = cols[4];
        rawCodQuebra = cols[5];
        rawArea = cols[6];
        rawMotivo = cols[7];
      } else {
        // Standard 8-column format starting with Data
        rawData = cols[0];
        rawSku = cols[1];
        rawDesc = cols[2];
        rawQtd = cols[3];
        rawArea = cols[4];
        rawTurno = cols[5];
        rawCodQuebra = cols[6];
        rawMotivo = cols[7];
        rawColaborador = cols[8] || '';
      }
    }

    const upperSku = String(rawSku).toUpperCase().trim();
    // Strict business rule: Filter out statistical/average or subtotal rows from Promax/Excel export
    if (
      !rawSku ||
      upperSku.includes('MÉDIA') ||
      upperSku.includes('MDIA') ||
      upperSku.includes('MEDIA') ||
      upperSku.includes('TOTAL') ||
      upperSku === 'N/A' ||
      upperSku === 'N/D' ||
      upperSku === 'SUBTOTAL'
    ) {
      continue;
    }

    const sku = normalizeSku(rawSku);
    if (!sku) continue;

    const data = normalizeDate(rawData) || defaultDate || '11/09/2026';
    const quantidade = Math.round(parseBrNumber(rawQtd)) || 0;
    if (quantidade <= 0) continue;

    const prod = productsMap.get(sku);
    const descricao = cleanPortugueseText(rawDesc || prod?.descricao || `Produto ${sku}`);
    const area = cleanPortugueseText(rawArea) || 'PUXADA';
    const turno = cleanPortugueseText(rawTurno).toUpperCase() || 'GERAL';
    const codQuebra = String(rawCodQuebra || '').trim();
    const motivo = cleanPortugueseText(rawMotivo) || 'Avaria';
    const colaborador = cleanPortugueseText(rawColaborador) || '-';
    const funcao = cleanPortugueseText(rawFuncao);

    // Parse date safely to compute week and month if missing
    const parsedDt = parseDateSafe(data);

    let mes = cleanPortugueseText(rawMes);
    if (!mes && parsedDt) {
      const monthNames = [
        'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
        'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
      ];
      mes = monthNames[parsedDt.getMonth()];
    }

    let semanaRef = cleanPortugueseText(rawSemanaRef || defaultSemanaRef || '');
    if (!semanaRef && parsedDt) {
      const day = parsedDt.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      const mon = new Date(parsedDt.getFullYear(), parsedDt.getMonth(), parsedDt.getDate() + diffToMon);
      const fri = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 4);
      const ddM = String(mon.getDate()).padStart(2, '0');
      const mmM = String(mon.getMonth() + 1).padStart(2, '0');
      const ddF = String(fri.getDate()).padStart(2, '0');
      const mmF = String(fri.getMonth() + 1).padStart(2, '0');
      semanaRef = `${ddM}/${mmM} - ${ddF}/${mmF}`;
    }

    // Financial value: use exact declared avaria value from file if > 0, otherwise compute from product master
    let valorTotal = parseBrNumber(rawValorTotal);
    const metrics = getSkuUnitMetrics(sku, quantidade, valorTotal, undefined, descricao);
    if (valorTotal <= 0) {
      valorTotal = quantidade * metrics.unitPrice;
    }

    // Volume HL: estritamente calculado a partir do Hectolitro por Unidade Física (HL/UND)
    let volumeHl = parseBrNumber(rawVolumeHl);
    const parsedFatorHl = parseBrNumber(rawFatorHl);

    if (volumeHl <= 0) {
      if (parsedFatorHl > 0 && parsedFatorHl <= 0.05) {
        volumeHl = quantidade * parsedFatorHl;
      } else {
        volumeHl = quantidade * metrics.unitHl;
      }
    } else {
      // Se o volume declarado no arquivo for manifestamente um fator de caixa (ex: > 0.05 por unidade), calibra para HL da unidade
      const hlPerUnit = volumeHl / quantidade;
      if (hlPerUnit > 0.05 && metrics.unitHl > 0) {
        volumeHl = quantidade * metrics.unitHl;
      }
    }

    let itemDeposito: DepositoId = targetDeposito;
    const cleanDep = rawDeposito.trim();
    if (cleanDep === '01' || cleanDep === '05' || cleanDep === '02') {
      itemDeposito = cleanDep as DepositoId;
    }

    const isHistorical = parsedDt ? parsedDt < new Date(2026, 7, 31) : false;

    quebras.push({
      id: `q-${Date.now()}-${idCounter++}`,
      data,
      sku,
      descricao,
      quantidade,
      area,
      turno,
      codQuebra,
      motivo,
      colaborador,
      funcao,
      mes: mes || 'SETEMBRO',
      semanaRef: semanaRef || '07/09 - 11/09',
      origem: cleanPortugueseText(rawOrigem) || 'DRE Quebras',
      valorTotal: Math.round(valorTotal * 100) / 100,
      volumeHl: Math.round(volumeHl * 100000) / 100000,
      deposito: itemDeposito,
      faturado: isHistorical,
      dataFaturamento: isHistorical ? '30/08/2026' : null,
    });
  }

  return quebras;
}

/**
 * Parses Trocas & Reposições CSV
 * Note: Column B can have multiple codes e.g. "9083, 9068"
 * Column D is quantity in units
 */
export function parseTrocasCsv(
  csvText: string, 
  productsMap: Map<string, ProductMaster>,
  targetDeposito: DepositoId = '01'
): TrocaItem[] {
  const trocas: TrocaItem[] = [];
  const lines = splitCsvLines(csvText);

  // Check header type
  let isNbLayout = false;
  for (const line of lines.slice(0, 5)) {
    const l = line.toLowerCase();
    if (l.includes('nb') || (l.includes('u.m') && l.includes('setor'))) {
      isNbLayout = true;
      break;
    }
  }

  let idCounter = 1;
  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes('código') || l.includes('cdigo') || l.includes('cdigo') || l.includes('tipo de processo') || l.includes('descrio') || l.includes('descrição')) {
      continue;
    }
    const cols = splitCsvColumns(line, ';');
    if (cols.length < 4) continue;

    // Support NB document format: Código NB;Cód. do Produto;Descrição do Produto;U.M;QTD;SETOR
    if (isNbLayout || (cols.length <= 8 && (cols[3]?.trim().toUpperCase() === 'SKU' || cols[3]?.trim().toUpperCase() === 'UN'))) {
      const nb = cols[0] || '';
      const sku = cols[1] || '';
      const desc = cols[2] || '';
      const um = (cols[3] || 'UN').trim().toUpperCase();
      const quantidade = parseFloat((cols[4] || '0').replace(',', '.')) || 0;
      const setor = cols[5] || '';

      const p = productsMap.get(sku.trim());
      const fator = p?.fatorSku || 1;
      const valorCx = p?.valor || 0;
      const valorUnit = p?.valorUnit || (fator > 0 ? valorCx / fator : 0);
      const fatorHl = p?.fatorHl || 0;

      let valorTotal = 0;
      let volumeHl = 0;

      if (um === 'SKU') {
        const units = Math.round(quantidade * fator);
        valorTotal = valorCx > 0 ? (quantidade * valorCx) : (units * valorUnit);
        volumeHl = fatorHl > 0 ? (quantidade * fatorHl) : 0;
      } else {
        valorTotal = valorUnit > 0 ? (quantidade * valorUnit) : (fator > 0 ? (quantidade * valorCx / fator) : 0);
        volumeHl = (fator > 0 && fatorHl > 0) ? ((quantidade / fator) * fatorHl) : 0;
      }

      trocas.push({
        id: `tr-${idCounter++}`,
        data: '15/09/2026',
        codigos: sku,
        sku: sku,
        descricao: desc || p?.descricao || `Produto ${sku}`,
        quantidade,
        valorTotal: parseFloat(valorTotal.toFixed(2)),
        motorista: `Rota ${setor}`,
        ajudantes: '-',
        cliente: `NB ${nb}`,
        notaFiscal: nb,
        mapa: `M-${setor}`,
        setorRota: setor,
        unidadeMedida: um,
        volumeHl: parseFloat(volumeHl.toFixed(4)),
        motivoDeclarado: 'Produto Avariado',
        motivo: 'Produto Avariado',
        tipoProcesso: 'Troca',
        statusPromax: 'Pendente',
        observacoes: `[Documento NB ${nb} • Setor ${setor}]`,
        deposito: targetDeposito,
        faturado: false
      });
      continue;
    }

    if (cols.length < 5) continue;

    const data = cols[0] || '';
    const codigos = cols[1] || '';
    const descricao = cols[2] || '';
    const quantidade = parseInt(cols[3], 10) || 0;
    const valorTotal = parseBrNumber(cols[4]);
    const motorista = cols[5] || '-';
    const ajudantes = cols[6] || '-';
    const cliente = cols[7] || '';
    const notaFiscal = cols[8] || '';
    const mapa = cols[9] || '';
    const setorRota = cols[10] || '';
    const unidadeMedida = cols[11] || 'UND';
    const volumeHl = cols[12] ? parseBrNumber(cols[12]) : 0;
    const motivoDeclarado = cols[13] || 'Troca';
    const tipoProcesso = cols[14] || 'Troca';
    const statusPromax = cols[16] || '';
    const observacoes = cols[23] || '';

    trocas.push({
      id: `tr-${idCounter++}`,
      data,
      codigos,
      descricao,
      quantidade,
      valorTotal,
      motorista,
      ajudantes,
      cliente,
      notaFiscal,
      mapa,
      setorRota,
      unidadeMedida,
      volumeHl,
      motivoDeclarado,
      tipoProcesso,
      statusPromax,
      observacoes,
      deposito: targetDeposito,
    });
  }

  return trocas;
}

/**
 * Parses Vales CSV
 */
export function parseValesCsv(
  csvText: string, 
  productsMap: Map<string, ProductMaster>,
  targetDeposito: DepositoId = '01'
): ValeItem[] {
  const vales: ValeItem[] = [];
  const lines = splitCsvLines(csvText);

  let idCounter = 1;
  for (const line of lines) {
    if (line.toLowerCase().includes('código') || line.toLowerCase().includes('cdigo') || line.toLowerCase().includes('status do vale')) {
      continue;
    }
    const cols = splitCsvColumns(line, ';');
    if (cols.length < 5) continue;

    const data = cols[0] || '';
    const codigo = cols[1] || '';
    const descricao = cols[2] || '';
    const quantidade = parseInt(cols[3], 10) || 0;
    const valorTotal = parseBrNumber(cols[4]);
    const motorista = cols[5] || '-';
    const cpfMotorista = cols[6] || '';
    const equipeCompleta = cols[11] || cols[7] || motorista;
    const cliente = cols[13] || cols[12] || '';
    const notaFiscal = cols[14] || '';
    const mapa = cols[15] || '';
    const rotaSetor = cols[16] || '';
    const volumeHl = cols[17] ? parseBrNumber(cols[17]) : 0;
    const statusVale = cols[18] || 'Emitido';
    const totalIntegrantes = parseInt(cols[19], 10) || 1;
    const valorRateado = parseBrNumber(cols[20]) || (totalIntegrantes > 0 ? valorTotal / totalIntegrantes : valorTotal);
    const idValeSstr = cols[22] || `vale-${idCounter}`;
    const observacoes = cols[21] || '';

    vales.push({
      id: `v-${idCounter++}`,
      data,
      codigo,
      descricao,
      quantidade,
      valorTotal,
      motorista,
      cpfMotorista,
      equipeCompleta,
      cliente,
      notaFiscal,
      mapa,
      rotaSetor,
      volumeHl,
      statusVale,
      totalIntegrantes,
      valorRateado,
      idValeSstr,
      observacoes,
      deposito: targetDeposito,
    });
  }

  return vales;
}

/**
 * Parses Faltas Planilha: CODIGO; DESCRICAO; QUANTIDADE; OBSERVACAO
 */
export function parseFaltasCsv(
  csvText: string, 
  productsMap: Map<string, ProductMaster>,
  targetDeposito: DepositoId = '01'
): FaltaMapeadaItem[] {
  const faltas: FaltaMapeadaItem[] = [];
  const lines = splitCsvLines(csvText);

  let idCounter = 1;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('código') || lower.includes('cdigo') || lower.includes('produto') || lower.includes('historico') && lower.includes('data')) {
      // Header line
      continue;
    }
    
    // Auto-detect delimiter (; or , or \t)
    const delimiter = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ',';
    const cols = splitCsvColumns(line, delimiter);
    if (cols.length < 2) continue;

    // Detect if column 0 or 1 is the SKU code
    let rawCode = '';
    let descricao = '';
    let rawQtde = '0';
    let observacao = '';

    if (cols.length >= 4) {
      // Ideal format: CODIGO; DESCRICAO; QUANTIDADE; OBSERVACAO
      rawCode = cols[0];
      descricao = cols[1];
      rawQtde = cols[2];
      observacao = cols.slice(3).join('; ');
    } else if (cols.length === 3) {
      // CODIGO; DESCRICAO; QUANTIDADE or CODIGO; QUANTIDADE; OBSERVACAO
      rawCode = cols[0];
      if (isNaN(Number(cols[1])) && !cols[1].includes('/')) {
        descricao = cols[1];
        rawQtde = cols[2];
      } else {
        rawQtde = cols[1];
        observacao = cols[2];
      }
    } else {
      // 2 cols: CODIGO; QUANTIDADE
      rawCode = cols[0];
      rawQtde = cols[1];
    }

    const codigo = normalizeSku(rawCode);
    if (!codigo || codigo === '0') continue;

    const prod = productsMap.get(codigo);
    if (!descricao && prod?.descricao) {
      descricao = prod.descricao;
    } else if (!descricao) {
      descricao = `Produto ${codigo}`;
    }

    const metrics = getSkuUnitMetrics(codigo, undefined, undefined, undefined, descricao);
    const fatorSku = prod?.fatorSku || 1;
    const boxPrice = prod?.valor || (metrics.unitPrice * fatorSku > 0 ? metrics.unitPrice * fatorSku : 50.00);
    const valorUnit = prod?.valorUnit || (boxPrice / fatorSku);
    const fatorHl = prod?.fatorHl || metrics.unitHl || 0.00350;

    let quantidade = 0;
    if (rawQtde.includes('/')) {
      const parsed = parseSkuUnitFormat(rawQtde, fatorSku);
      quantidade = Math.abs(parsed.skus) + (Math.abs(parsed.looseUnits) / fatorSku);
    } else {
      quantidade = Math.abs(parseBrNumber(rawQtde));
    }

    const quantidadeSkus = Math.floor(quantidade);
    const quantidadeUnidades = Math.round(quantidade * fatorSku);
    
    let valorTotal = cols[4] ? parseBrNumber(cols[4]) : 0;
    if (isNaN(valorTotal) || valorTotal <= 0) {
      valorTotal = quantidadeSkus > 0 ? (quantidadeSkus * boxPrice) : (quantidadeUnidades * valorUnit);
      if (valorTotal <= 0) {
        valorTotal = quantidade * (boxPrice > 0 ? boxPrice : 50.00);
      }
    }
    const volumeHl = quantidadeUnidades * fatorHl;

    faltas.push({
      id: `falta-${idCounter++}`,
      codigo,
      produto: codigo,
      descricao,
      quantidade,
      quantidadeSkus,
      quantidadeUnidades,
      observacao: observacao.trim() || '',
      motivo: 'Falta Mapeada',
      valorTotal,
      volumeHl,
      deposito: targetDeposito,
      data: new Date().toLocaleDateString('pt-BR'),
      origem: 'PLANILHA',
    });
  }

  return faltas;
}

export interface Item020304 {
  grade: string;
  cod: string;
  cleanCod: string;
  descricao: string;
  un: string;
  inicial: number;
  entradas: number;
  saidas: number;
  disponivel: number;
}

/**
 * Faz o parse do arquivo oficial 02.03.04 (Saldo Inicial da Grade)
 * Formato padrão:
 * Grade;Cod;Descricao;UN;Inicial;Ent.;Ent.MCDD;Reserva;Trans.;Saidas;Sai.MCDD;Disp.;Res.Magali;Inic.Agend.;Ent.Agend.;Sai.Agend.;Disp.Agend.
 */
export function parse020304Csv(csvText: string): Item020304[] {
  const items: Item020304[] = [];
  const lines = splitCsvLines(csvText);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (lower.includes('grade') && lower.includes('cod') && lower.includes('inicial')) {
      continue;
    }

    const delimiter = trimmed.includes(';') ? ';' : trimmed.includes('\t') ? '\t' : ',';
    const cols = splitCsvColumns(trimmed, delimiter);
    if (cols.length < 5) continue;

    const grade = (cols[0] || '').trim();
    const rawCod = (cols[1] || '').trim();
    const cleanCod = rawCod.replace(/^0+/, '') || rawCod;
    const descricao = (cols[2] || '').trim();
    const un = (cols[3] || '').trim();
    const inicial = parseInt(cols[4] || '0', 10) || 0;
    const entradas = parseInt(cols[5] || '0', 10) || 0;
    const saidas = parseInt(cols[9] || cols[7] || '0', 10) || 0;
    const disponivel = parseInt(cols[11] || cols[8] || '0', 10) || 0;

    if (rawCod) {
      items.push({
        grade,
        cod: rawCod,
        cleanCod,
        descricao,
        un,
        inicial,
        entradas,
        saidas,
        disponivel
      });
    }
  }

  return items;
}

/**
 * Reconcilia e corrige integralmente um item de posição de estoque (02.05.02)
 * caso tenha sido importado com fator incorreto (ex: fator 1 em CX/12 ou SIX-PACK),
 * recalculando o disponível, físico, divergência e prejuízo segundo as regras oficiais da Ambev.
 */
export function healStockPositionItem(
  item: StockPositionItem,
  productsMap?: Map<string, ProductMaster>
): StockPositionItem {
  const prodInfo = productsMap?.get(normalizeSku(item.produto));
  let fatorSku = prodInfo?.fatorSku || item.fatorSku || 1;

  if (fatorSku <= 1) {
    const deduced = extractPackFactorFromDescription(item.descricao) || 
                    extractPackFactorFromDescription(prodInfo?.descricao);
    if (deduced && deduced > 1) {
      fatorSku = deduced;
    }
  }

  // Se o valor de estoque possui unidades avulsas (ex: 2/11 com fator 1):
  const rawDispLoose = parseSkuUnitFormat(item.disponivelRaw, 9999).looseUnits;
  const rawInvLoose = parseSkuUnitFormat(item.inventarioRaw, 9999).looseUnits;
  const maxLoose = Math.max(rawDispLoose, rawInvLoose);
  if (maxLoose >= fatorSku) {
    const deduced = extractPackFactorFromDescription(item.descricao) || 
                    extractPackFactorFromDescription(prodInfo?.descricao);
    if (deduced && deduced > maxLoose) {
      fatorSku = deduced;
    }
  }

  fatorSku = Math.max(1, fatorSku);

  // Cura de identidade contábil: garante valorCaixa === valorUnitario * fatorSku em 100% dos itens persistidos,
  // priorizando o Custo Médio real importado da 02.05.02 (custoMedio / valorUnitario) sobre preços estáticos de catálogo.
  let valorUnitario = 0;
  let valorCaixa = 0;
  if (item.custoMedio && item.custoMedio > 0) {
    valorUnitario = item.custoMedio;
    valorCaixa = valorUnitario * fatorSku;
  } else if (item.valorUnitario && item.valorUnitario > 0 && (!item.valorCaixa || item.valorCaixa !== item.valorUnitario || fatorSku === 1)) {
    valorUnitario = item.valorUnitario;
    valorCaixa = valorUnitario * fatorSku;
  } else if (item.valorCaixa && item.valorCaixa > 0) {
    valorCaixa = item.valorCaixa;
    valorUnitario = valorCaixa / fatorSku;
  } else if (prodInfo?.valor && prodInfo.valor > 0) {
    valorCaixa = prodInfo.valor;
    valorUnitario = valorCaixa / fatorSku;
  } else if (prodInfo?.valorUnit && prodInfo.valorUnit > 0) {
    valorUnitario = prodInfo.valorUnit;
    valorCaixa = valorUnitario * fatorSku;
  } else {
    const metrics = getSkuUnitMetrics(normalizeSku(item.produto), undefined, undefined, undefined, item.descricao);
    valorUnitario = metrics.unitPrice > 0 ? metrics.unitPrice : 1;
    valorCaixa = valorUnitario * fatorSku;
  }

  const fatorHl = item.fatorHl || prodInfo?.fatorHl || 0;

  // Aplica a regra única oficial de divergência
  const div = calcularDivergencia(
    item.disponivelRaw,
    item.inventarioRaw,
    fatorSku,
    valorUnitario,
    fatorHl
  );

  return {
    ...item,
    fatorSku,
    valorUnitario,
    valorCaixa,
    fatorHl,
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
    impactoFinanceiro: div.impactoFinanceiro,
    prejuizoFinanceiro: div.prejuizoFinanceiro,
    sobraFinanceira: div.sobraFinanceira,
    impactoHl: div.impactoHl,
    saldoNegativoDesconsiderado: div.saldoNegativoDesconsiderado,
  };
}

/**
 * Higieniza e cura uma lista completa de posições de estoque, corrigindo inconsistências de fator
 * e divergências espúrias causadas por unidades avulsas.
 */
export function healStockPositions(
  items: StockPositionItem[],
  productsMap?: Map<string, ProductMaster>
): StockPositionItem[] {
  if (!items || items.length === 0) return items;
  return items.map(it => healStockPositionItem(it, productsMap));
}

/**
 * Higieniza o cadastro de produtos mestre, garantindo fatores corretos
 */
export function healProductMasterMap(
  productsMap: Map<string, ProductMaster>
): Map<string, ProductMaster> {
  const updated = new Map<string, ProductMaster>();
  productsMap.forEach((prod, key) => {
    let fatorSku = prod.fatorSku || 1;
    let valor = prod.valor;
    let valorUnit = prod.valorUnit;

    if (fatorSku <= 1 && prod.descricao) {
      const deduced = extractPackFactorFromDescription(prod.descricao);
      if (deduced && deduced > 1) {
        fatorSku = deduced;
        if (valor > 0 && (valorUnit === valor || valorUnit <= 0)) {
          valorUnit = valor / fatorSku;
        }
      }
    }

    updated.set(key, {
      ...prod,
      fatorSku,
      valor,
      valorUnit,
      valorCaixa: valor,
      valorUnitario: valorUnit,
    });
  });
  return updated;
}


