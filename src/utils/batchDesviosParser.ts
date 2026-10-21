import * as XLSX from 'xlsx';
import { QuebraItem, ValeItem, TrocaItem, FaltaMapeadaItem, DepositoId, ProductMaster } from '../types';
import { 
  parseQuebrasCsv, 
  parseValesCsv, 
  parseTrocasCsv, 
  parseFaltasCsv, 
  splitCsvLines, 
  splitCsvColumns, 
  detectDelimiter,
  normalizeSku,
  parseBrNumber
} from './parsers';

export interface BatchDesviosResult {
  quebras: QuebraItem[];
  vales: ValeItem[];
  trocas: TrocaItem[];
  faltasMapeadas: FaltaMapeadaItem[];
  summary: {
    quebrasCount: number;
    valesCount: number;
    trocasCount: number;
    faltasCount: number;
    totalItems: number;
    detectedSheets: string[];
    formatType: 'multi-sheet' | 'consolidated' | 'auto-detected';
  };
}

/**
 * Normaliza strings de cabeçalho removendo acentos, pontuações e espaços.
 */
function normalizeHeader(h: string): string {
  return String(h || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Lê e processa qualquer formato de arquivo Excel (.xlsx, .xls, .xlsm, .xlsb) ou CSV
 * contendo desvios operacionais em lote (Quebras, Vales, Trocas e Faltas Mapeadas).
 */
export function parseBatchDesviosWorkbook(
  buffer: ArrayBuffer,
  productsMap: Map<string, ProductMaster>,
  targetDeposito: DepositoId | 'ALL' = 'ALL'
): BatchDesviosResult {
  const result: BatchDesviosResult = {
    quebras: [],
    vales: [],
    trocas: [],
    faltasMapeadas: [],
    summary: {
      quebrasCount: 0,
      valesCount: 0,
      trocasCount: 0,
      faltasCount: 0,
      totalItems: 0,
      detectedSheets: [],
      formatType: 'auto-detected'
    }
  };

  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true, raw: false });
  const sheetNames = workbook.SheetNames || [];
  result.summary.detectedSheets = sheetNames;

  let foundSpecificSheet = false;

  // 1. ESTRATÉGIA A: Abas específicas por tipo de desvio (Multi-Abas)
  sheetNames.forEach(name => {
    const norm = normalizeHeader(name);
    const sheet = workbook.Sheets[name];
    if (!sheet) return;

    const csvText = XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
    if (!csvText || !csvText.trim()) return;

    if (norm.includes('quebra') || norm.includes('avaria') || norm.includes('pnc')) {
      foundSpecificSheet = true;
      const parsed = parseQuebrasCsv(csvText, productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
      result.quebras.push(...parsed);
    } else if (norm.includes('vale') || norm.includes('debito') || norm.includes('rota')) {
      foundSpecificSheet = true;
      const parsed = parseValesCsv(csvText, productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
      const filtered = targetDeposito === 'ALL' ? parsed : parsed.filter(v => v.deposito === targetDeposito);
      result.vales.push(...filtered);
    } else if (norm.includes('troca') || norm.includes('reposicao') || norm.includes('atendimento')) {
      foundSpecificSheet = true;
      const parsed = parseTrocasCsv(csvText, productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
      const filtered = targetDeposito === 'ALL' ? parsed : parsed.filter(t => t.deposito === targetDeposito);
      result.trocas.push(...filtered);
    } else if (norm.includes('falta') || norm.includes('doca') || norm.includes('obs')) {
      foundSpecificSheet = true;
      const parsed = parseFaltasCsv(csvText, productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
      const filtered = targetDeposito === 'ALL' ? parsed : parsed.filter(f => !f.deposito || f.deposito === targetDeposito);
      result.faltasMapeadas.push(...filtered);
    }
  });

  if (foundSpecificSheet) {
    result.summary.formatType = 'multi-sheet';
    result.summary.quebrasCount = result.quebras.length;
    result.summary.valesCount = result.vales.length;
    result.summary.trocasCount = result.trocas.length;
    result.summary.faltasCount = result.faltasMapeadas.length;
    result.summary.totalItems = result.quebras.length + result.vales.length + result.trocas.length + result.faltasMapeadas.length;
    return result;
  }

  // 2. ESTRATÉGIA B: Planilha única com coluna TIPO / TIPO_DESVIO ou detecção automática
  const firstSheetName = sheetNames[0];
  if (!firstSheetName) return result;

  const firstSheet = workbook.Sheets[firstSheetName];
  const csvText = XLSX.utils.sheet_to_csv(firstSheet, { FS: ';' });
  const lines = splitCsvLines(csvText);
  if (lines.length === 0) return result;

  const delimiter = detectDelimiter(lines[0]);
  const headerCols = splitCsvColumns(lines[0], delimiter).map(normalizeHeader);

  // Procura por coluna de tipo de desvio
  const tipoIdx = headerCols.findIndex(h => 
    h === 'tipo' || h === 'tipodesvio' || h === 'desvio' || h === 'origem' || h === 'categoria'
  );

  if (tipoIdx >= 0) {
    result.summary.formatType = 'consolidated';
    // Linhas agrupadas por tipo de desvio
    const quebraLines: string[] = [lines[0]];
    const valeLines: string[] = [lines[0]];
    const trocaLines: string[] = [lines[0]];
    const faltaLines: string[] = [lines[0]];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = splitCsvColumns(line, delimiter);
      const rowType = normalizeHeader(cols[tipoIdx] || '');

      if (rowType.includes('quebra') || rowType.includes('avaria')) {
        quebraLines.push(line);
      } else if (rowType.includes('vale') || rowType.includes('debito')) {
        valeLines.push(line);
      } else if (rowType.includes('troca') || rowType.includes('reposicao')) {
        trocaLines.push(line);
      } else if (rowType.includes('falta') || rowType.includes('doca')) {
        faltaLines.push(line);
      }
    }

    if (quebraLines.length > 1) {
      result.quebras = parseQuebrasCsv(quebraLines.join('\n'), productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
    }
    if (valeLines.length > 1) {
      const parsed = parseValesCsv(valeLines.join('\n'), productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
      result.vales = targetDeposito === 'ALL' ? parsed : parsed.filter(v => v.deposito === targetDeposito);
    }
    if (trocaLines.length > 1) {
      const parsed = parseTrocasCsv(trocaLines.join('\n'), productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
      result.trocas = targetDeposito === 'ALL' ? parsed : parsed.filter(t => t.deposito === targetDeposito);
    }
    if (faltaLines.length > 1) {
      const parsed = parseFaltasCsv(faltaLines.join('\n'), productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
      result.faltasMapeadas = targetDeposito === 'ALL' ? parsed : parsed.filter(f => !f.deposito || f.deposito === targetDeposito);
    }
  } else {
    // 3. ESTRATÉGIA C: Detecção automática por colunas dominantes
    const hasMotorista = headerCols.some(h => h.includes('motorista') || h.includes('equipe'));
    const hasCodQuebra = headerCols.some(h => h.includes('quebra') || h.includes('avaria') || h.includes('motivo'));
    const hasProtocolo = headerCols.some(h => h.includes('protocolo') || h.includes('troca'));
    const hasObs = headerCols.some(h => h.includes('observacao') || h.includes('justificativa'));

    if (hasMotorista) {
      const parsed = parseValesCsv(csvText, productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
      result.vales = targetDeposito === 'ALL' ? parsed : parsed.filter(v => v.deposito === targetDeposito);
    } else if (hasProtocolo) {
      const parsed = parseTrocasCsv(csvText, productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
      result.trocas = targetDeposito === 'ALL' ? parsed : parsed.filter(t => t.deposito === targetDeposito);
    } else if (hasCodQuebra) {
      result.quebras = parseQuebrasCsv(csvText, productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
    } else if (hasObs) {
      const parsed = parseFaltasCsv(csvText, productsMap, targetDeposito === 'ALL' ? '01' : targetDeposito);
      result.faltasMapeadas = targetDeposito === 'ALL' ? parsed : parsed.filter(f => !f.deposito || f.deposito === targetDeposito);
    }
  }

  result.summary.quebrasCount = result.quebras.length;
  result.summary.valesCount = result.vales.length;
  result.summary.trocasCount = result.trocas.length;
  result.summary.faltasCount = result.faltasMapeadas.length;
  result.summary.totalItems = result.quebras.length + result.vales.length + result.trocas.length + result.faltasMapeadas.length;

  return result;
}

/**
 * Gera e realiza o download de um arquivo Excel (.xlsx) modelo padrão com abas para
 * Quebras, Vales, Trocas, Faltas e Consolidado, pronto para preenchimento.
 */
export function downloadBatchDesviosExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // 1. Aba de Instruções
  const instrucoesData = [
    ['SISTEMA DE GESTÃO DE ESTOQUE AMBEV - IMPORTAÇÃO EM LOTE DE DESVIOS OPERACIONAIS'],
    [''],
    ['COMO USAR ESTE MODELO EXCEL:'],
    ['1. Você pode preencher as abas separadas ("Quebras", "Vales", "Trocas", "Faltas") OU usar a aba "Consolidado".'],
    ['2. O sistema aceita qualquer formato Excel (.xlsx, .xls, .xlsm, .xlsb) ou CSV sem distinção.'],
    ['3. Os dados importados são gravados diretamente no código da aplicação e memória permanente, ficando editáveis a qualquer momento.'],
    ['4. Linhas com informações incorretas podem ser editadas através do ícone de lápis ou excluídas pela lixeira em suas respectivas telas.'],
    ['5. A coluna Depósito aceita 01, 02, 03, 05, 06, 31. Se não informada, o sistema assume Depósito 01.'],
    [''],
    ['ESTRUTURA DAS ABAS:'],
    ['- Quebras: Avarias operacionais, estufados, vazamentos e quebras de transporte ou puxada.'],
    ['- Vales: Débitos de rota de motoristas e ajudantes que amortizam a conciliação enquanto pendentes.'],
    ['- Trocas: Reposições comerciais com clientes por defeito, data de validade ou quebra.'],
    ['- Faltas: Divergências de conferência na doca de carregamento com justificativas.'],
  ];
  const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoesData);
  XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instrucoes');

  // 2. Aba Quebras
  const quebrasData = [
    ['DATA', 'SKU', 'DESCRICAO', 'QUANTIDADE', 'VALOR_TOTAL', 'VOLUME_HL', 'COD_QUEBRA', 'MOTIVO', 'AREA', 'TURNO', 'COLABORADOR', 'DEPOSITO'],
    ['16/10/2026', '988', 'BRAHMA CHOPP 600ML', 34, 147.98, 2.4480, '577', 'QUEBRADA', 'PUXADA', 'MANHÃ', 'JOAO DA SILVA', '01'],
    ['16/10/2026', '21658', 'SPATEN LT 350ML', 12, 40.20, 0.0420, '575', 'ESTUFADO', 'ENTREGA', 'NOITE', 'CARLOS SOUZA', '01'],
    ['15/10/2026', '2353', 'GUARANA ANTARCTICA DIET PET 2L C/6', 18, 84.24, 0.3600, '578', 'VAZAMENTO', 'ARMAZÉM', 'MANHÃ', 'MARCOS LIMA', '01'],
  ];
  const wsQuebras = XLSX.utils.aoa_to_sheet(quebrasData);
  XLSX.utils.book_append_sheet(wb, wsQuebras, 'Quebras');

  // 3. Aba Vales
  const valesData = [
    ['DATA', 'CODIGO', 'DESCRICAO', 'QUANTIDADE', 'MOTORISTA', 'EQUIPE', 'CLIENTE', 'NF', 'STATUS_VALE', 'VALOR_TOTAL', 'VOLUME_HL', 'DEPOSITO'],
    ['16/10/2026', '33818', 'ORIGINAL LATA 350ML SH C/12 MULTIPACK', 1, 'JOSE MESQUITA FABRICIO', 'JOALISON JACINTO DOS SANTOS', 'AMBEV CDD', '242267', 'Emitido', 37.58, 0.0420, '01'],
    ['15/10/2026', '20164', 'SKOL LT 473ML SH C/12 NPAL MULTIPACK 12', 4, 'JOSE MATUZALEM PONTES DE OLIVEIRA', 'ROMARIO RODRIGUES DA SILVA', 'FRIGORIFICO E MERCAD', '258676', 'Assinado', 149.60, 0.2400, '01'],
    ['14/10/2026', '37450', 'BUDWEISER LT SLEEK 350ML SH C 12 MULTIPACK', 1, 'JEFFERSON JONES PAULINO DA SILVA', 'IRIMARQUE JOSE BATISTA DOS SANTOS', 'AMBEV CDD', '701084', 'Emitido', 41.69, 0.0420, '01'],
  ];
  const wsVales = XLSX.utils.aoa_to_sheet(valesData);
  XLSX.utils.book_append_sheet(wb, wsVales, 'Vales');

  // 4. Aba Trocas
  const trocasData = [
    ['DATA', 'SKU', 'DESCRICAO', 'QUANTIDADE', 'MOTIVO', 'MOTORISTA', 'CLIENTE', 'NF', 'PROTOCOLO', 'DEPOSITO'],
    ['16/10/2026', '8821', 'STELLA ARTOIS LATA 350ML', 6, 'LATA AMASSADA', 'ROBERTO COSTA', 'BAR DO ZE', 'TRC-9921', 'PRT-4401', '01'],
    ['15/10/2026', '33820', 'BRAHMA CHOPP LATA 350ML MULTIPACK', 10, 'VAZAMENTO DE FABRICA', 'CARLOS EDUARDO', 'SUPERMERCADO CENTRAL', 'TRC-9922', 'PRT-4402', '01'],
    ['14/10/2026', '18836', 'CORONA EXTRA N LONG NECK 330ML CX C/24', 2, 'GARRAFA TRINCADA', 'PAULO SANTOS', 'RESTAURANTE MAR AZUL', 'TRC-9923', 'PRT-4403', '01'],
  ];
  const wsTrocas = XLSX.utils.aoa_to_sheet(trocasData);
  XLSX.utils.book_append_sheet(wb, wsTrocas, 'Trocas');

  // 5. Aba Faltas
  const faltasData = [
    ['DATA', 'CODIGO', 'DESCRICAO', 'QUANTIDADE', 'OBSERVACAO', 'DEPOSITO'],
    ['16/10/2026', '347', 'SKOL LATA 350ML', 12, 'Falta na conferência da doca 2 com nota emitida', '01'],
    ['15/10/2026', '988', 'BRAHMA CHOPP 600ML', 5, 'Divergência de picking confirmada pelo conferente', '01'],
    ['14/10/2026', '21658', 'SPATEN LT 350ML', 8, 'Falta na doca identificada no fechamento do mapa 17040', '01'],
  ];
  const wsFaltas = XLSX.utils.aoa_to_sheet(faltasData);
  XLSX.utils.book_append_sheet(wb, wsFaltas, 'Faltas');

  // 6. Aba Consolidado (opcional para quem quer todas em uma planilha só)
  const consolidadoData = [
    ['TIPO_DESVIO', 'DATA', 'CODIGO_SKU', 'DESCRICAO', 'QUANTIDADE', 'MOTIVO_OBSERVACAO', 'MOTORISTA', 'CLIENTE_NF', 'VALOR_TOTAL', 'DEPOSITO'],
    ['QUEBRA', '16/10/2026', '988', 'BRAHMA CHOPP 600ML', 34, 'QUEBRADA', 'N/A', 'N/A', 147.98, '01'],
    ['VALE', '16/10/2026', '33818', 'ORIGINAL LATA 350ML SH C/12 MULTIPACK', 1, 'Vale de Rota', 'JOSE MESQUITA FABRICIO', 'AMBEV CDD - NF 242267', 37.58, '01'],
    ['TROCA', '16/10/2026', '8821', 'STELLA ARTOIS LATA 350ML', 6, 'LATA AMASSADA', 'ROBERTO COSTA', 'BAR DO ZE', 22.44, '01'],
    ['FALTA', '16/10/2026', '347', 'SKOL LATA 350ML', 12, 'Falta na conferência da doca 2', 'N/A', 'N/A', 30.48, '01'],
  ];
  const wsConsolidado = XLSX.utils.aoa_to_sheet(consolidadoData);
  XLSX.utils.book_append_sheet(wb, wsConsolidado, 'Consolidado');

  XLSX.writeFile(wb, `modelo_lote_desvios_operacionais_ambev_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
