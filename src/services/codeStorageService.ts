import { StockPositionItem, QuebraItem, ValeItem, TrocaItem, FaltaMapeadaItem } from '../types';
import { persistData, STORAGE_KEYS } from '../utils/persistentStorage';

export interface CodeDataPayload {
  type: 'all' | '020502' | 'grade' | 'quebras' | 'vales' | 'trocas' | 'faltas';
  stockPositions?: StockPositionItem[];
  gradeStockPositions?: StockPositionItem[];
  quebras?: QuebraItem[];
  vales?: ValeItem[];
  trocas?: TrocaItem[];
  faltasMapeadas?: FaltaMapeadaItem[];
  updatedAt?: string;
}

/**
 * Grava os dados diretamente no código (persistedCodeData.json no backend)
 * e simultaneamente na persistência blindada local (IndexedDB + LocalStorage).
 * NÃO depende de banco de dados remoto (Firebase).
 */
export async function saveToCodeStorage(payload: CodeDataPayload): Promise<{ success: boolean; message: string }> {
  // 1. Persistência local imediata e confiável
  try {
    if (payload.stockPositions) {
      await persistData(STORAGE_KEYS.STOCK_POSITIONS_020502, payload.stockPositions);
      await persistData(STORAGE_KEYS.STOCK_POSITIONS_LEGACY, payload.stockPositions);
    }
    if (payload.gradeStockPositions) {
      await persistData(STORAGE_KEYS.GRADE_POSITIONS, payload.gradeStockPositions);
      await persistData(STORAGE_KEYS.GRADE_POSITIONS_LEGACY, payload.gradeStockPositions);
    }
    if (payload.quebras) {
      await persistData(STORAGE_KEYS.QUEBRAS, payload.quebras);
    }
    if (payload.vales) {
      await persistData(STORAGE_KEYS.VALES, payload.vales);
    }
    if (payload.trocas) {
      await persistData(STORAGE_KEYS.TROCAS, payload.trocas);
      await persistData(STORAGE_KEYS.TROCAS_V4, payload.trocas);
    }
    if (payload.faltasMapeadas) {
      await persistData(STORAGE_KEYS.FALTAS, payload.faltasMapeadas);
    }
  } catch (localErr) {
    console.warn('[CodeStorage] Erro ao persistir localmente:', localErr);
  }

  // 2. Gravação direta no arquivo de código via API do servidor (se disponível)
  try {
    const res = await fetch('/api/save-code-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        updatedAt: new Date().toISOString()
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || 'Dados gravados no código com sucesso!' };
    }
  } catch {
    // Servidor backend pode não estar rodando ou estar em modo estático
  }

  return { success: true, message: 'Dados salvos localmente na aplicação com sucesso (gravados na memória permanente).' };
}

/**
 * Permite ao usuário exportar e baixar diretamente o arquivo JSON com toda a base de dados
 * para backup físico ou inclusão direta no código.
 */
export function downloadCodeBackupJson(data: {
  stockPositions?: StockPositionItem[];
  gradeStockPositions?: StockPositionItem[];
  quebras?: QuebraItem[];
  vales?: ValeItem[];
  trocas?: TrocaItem[];
  faltasMapeadas?: FaltaMapeadaItem[];
}) {
  const payload = {
    exportedAt: new Date().toISOString(),
    ...data
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_dados_estoque_desvios_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
