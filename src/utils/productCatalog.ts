/**
 * Catálogo Oficial Ambev de Métricas Unitárias e Caixa por SKU
 * Baseado na tabela oficial de preços cadastrados (RAW_CADASTRO_CSV)
 *
 * REGRA CRÍTICA DE NEGÓCIO:
 * - Preço Unitário (unitPrice): Preço por lata/garrafa/unidade física avulsa (R$/un)
 * - Preço da Caixa (boxPrice): Preço por fardo/caixa fechada / SKU (R$/cx)
 * - Fator SKU (fatorSku): Quantidade de unidades em 1 caixa
 * - Fator Hectolitro (fatorHl): Volume em HL de 1 caixa
 * - Volume Unitário (unitHl): Volume em HL de 1 unidade avulsa
 */

import { ProductMaster } from '../types';

export interface SkuUnitMetrics {
  sku: string;
  descricao: string;
  unitPrice: number; // Preço unitário por unidade física (R$/un)
  unitHl: number;    // Volume unitário por unidade física (HL/un)
  boxPrice?: number; // Preço por caixa fechada (R$/cx)
  fatorSku?: number; // Unidades por caixa
  fatorHl?: number;  // Volume por caixa (HL/cx)
  grupo?: string;    // Grupo do produto (CERVEJA, NAB, etc.)
  embalagem?: string;
}

export const SKU_CATALOG: Record<string, SkuUnitMetrics> = {
  "347": {
    "sku": "347",
    "descricao": "SUKITA PET 1L CAIXA C/12",
    "unitPrice": 2.54,
    "unitHl": 0.01,
    "boxPrice": 30.48,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 1L"
  },
  "371": {
    "sku": "371",
    "descricao": "MALZBIER BRAHMA LONG NECK 355ML SIX-PACK BANDEJA C/4",
    "unitPrice": 2.97,
    "unitHl": 0.0035,
    "boxPrice": 71.36,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "503": {
    "sku": "503",
    "descricao": "SUKITA PET 2L CAIXA C/6",
    "unitPrice": 3.24,
    "unitHl": 0.02,
    "boxPrice": 19.45,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "504": {
    "sku": "504",
    "descricao": "PEPSI COLA PET 2L CAIXA C/6",
    "unitPrice": 4.5,
    "unitHl": 0.02,
    "boxPrice": 26.97,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "620": {
    "sku": "620",
    "descricao": "CARACU LONG NECK 355ML SIX-PACK BANDEJA C/4",
    "unitPrice": 3.26,
    "unitHl": 0.00375,
    "boxPrice": 78.2,
    "fatorSku": 24,
    "fatorHl": 0.09,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "838": {
    "sku": "838",
    "descricao": "CHOPP BRAHMA CLARO BARRIL KEG 50L",
    "unitPrice": 13.4,
    "unitHl": 0.5,
    "boxPrice": 13.4,
    "fatorSku": 1,
    "fatorHl": 0.5,
    "grupo": "CERVEJA",
    "embalagem": "BARRIL"
  },
  "982": {
    "sku": "982",
    "descricao": "SKOL 600ML",
    "unitPrice": 4.45,
    "unitHl": 0.00583,
    "boxPrice": 53.34,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "988": {
    "sku": "988",
    "descricao": "BRAHMA CHOPP 600ML",
    "unitPrice": 4.35,
    "unitHl": 0.00583,
    "boxPrice": 52.23,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "1114": {
    "sku": "1114",
    "descricao": "GUARANA CHP ANTARCTICA PET 3,3 L SH C/04",
    "unitPrice": 6.89,
    "unitHl": 0.0325,
    "boxPrice": 27.55,
    "fatorSku": 4,
    "fatorHl": 0.13,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "1116": {
    "sku": "1116",
    "descricao": "PEPSI COLA PET 3,3 L SH C/04",
    "unitPrice": 7.02,
    "unitHl": 0.0325,
    "boxPrice": 28.1,
    "fatorSku": 4,
    "fatorHl": 0.13,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "1164": {
    "sku": "1164",
    "descricao": "SUKITA UVA LATA 350ML SH C/12 NPAL",
    "unitPrice": 2.08,
    "unitHl": 0.00333,
    "boxPrice": 25,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "1166": {
    "sku": "1166",
    "descricao": "SUKITA UVA PET 2L CAIXA C/6",
    "unitPrice": 3.35,
    "unitHl": 0.02,
    "boxPrice": 20.09,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "1232": {
    "sku": "1232",
    "descricao": "SUKITA UVA PET 2L CAIXA C/8",
    "unitPrice": 3.47,
    "unitHl": 0.0025,
    "boxPrice": 27.78,
    "fatorSku": 8,
    "fatorHl": 0.02,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "1388": {
    "sku": "1388",
    "descricao": "SKOL GFA VD 1L 2,99",
    "unitPrice": 4.29,
    "unitHl": 0.01,
    "boxPrice": 51.44,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "CERVEJA",
    "embalagem": "LITRÃO"
  },
  "1695": {
    "sku": "1695",
    "descricao": "BRAHMA CHOPP GFA VD 1L COM TTC",
    "unitPrice": 4.99,
    "unitHl": 0.01,
    "boxPrice": 59.89,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "CERVEJA",
    "embalagem": "LITRÃO"
  },
  "1699": {
    "sku": "1699",
    "descricao": "STELLA ARTOIS LT 269ML CX C/8 FRIDGE PACK",
    "unitPrice": 2.74,
    "unitHl": 0.0025,
    "boxPrice": 21.95,
    "fatorSku": 8,
    "fatorHl": 0.02,
    "grupo": "CERVEJA",
    "embalagem": "LATA 269ML"
  },
  "1708": {
    "sku": "1708",
    "descricao": "GUARANA ANTARCTICA ZERO PET 2,5L CAIXA C/6",
    "unitPrice": 8,
    "unitHl": 0.005,
    "boxPrice": 48,
    "fatorSku": 6,
    "fatorHl": 0.03,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "1743": {
    "sku": "1743",
    "descricao": "ANTARCTICA PILSEN GFA VD 1L COM TTC",
    "unitPrice": 3.4,
    "unitHl": 0.01,
    "boxPrice": 40.76,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "CERVEJA",
    "embalagem": "LITRÃO"
  },
  "1745": {
    "sku": "1745",
    "descricao": "SKOL LT 269ML SH C15 NPAL",
    "unitPrice": 2.06,
    "unitHl": 0.00267,
    "boxPrice": 30.91,
    "fatorSku": 15,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 269ML"
  },
  "1898": {
    "sku": "1898",
    "descricao": "BRAHMA CHOPP LT 269ML SH C15 NPAL",
    "unitPrice": 2.06,
    "unitHl": 0.00267,
    "boxPrice": 30.92,
    "fatorSku": 15,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 269ML"
  },
  "2006": {
    "sku": "2006",
    "descricao": "ANTARCTICA SUBZERO 600ML",
    "unitPrice": 5,
    "unitHl": 0.00583,
    "boxPrice": 60,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "2008": {
    "sku": "2008",
    "descricao": "ANTARCTICA SUBZERO LATA 350ML SH C/12 NPAL",
    "unitPrice": 2.25,
    "unitHl": 0.00333,
    "boxPrice": 27.01,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "2104": {
    "sku": "2104",
    "descricao": "BRAHMA FRESH GFA VD 1L",
    "unitPrice": 35.45,
    "unitHl": 0.01,
    "boxPrice": 35.45,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "2319": {
    "sku": "2319",
    "descricao": "GUARANA CHP ANTARCTICA PET 1L CAIXA C/12",
    "unitPrice": 2.85,
    "unitHl": 0.01,
    "boxPrice": 34.22,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 1L"
  },
  "2320": {
    "sku": "2320",
    "descricao": "SODA LIMONADA ANTARCTICA PET 1L CAIXA C/12",
    "unitPrice": 2.65,
    "unitHl": 0.01,
    "boxPrice": 31.82,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 1L"
  },
  "2349": {
    "sku": "2349",
    "descricao": "GUARANA CHP ANTARCTICA PET 2L CAIXA C/6",
    "unitPrice": 4.73,
    "unitHl": 0.02,
    "boxPrice": 28.39,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "2350": {
    "sku": "2350",
    "descricao": "SODA LIMONADA ANTARCTICA PET 2L CAIXA C/6",
    "unitPrice": 4.5,
    "unitHl": 0.02,
    "boxPrice": 27.02,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "2353": {
    "sku": "2353",
    "descricao": "GUARANA CHP ANTARCTICA DIET PET 2L CAIXA C/6",
    "unitPrice": 4.68,
    "unitHl": 0.02,
    "boxPrice": 28.09,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "2354": {
    "sku": "2354",
    "descricao": "SODA LIMONADA ANTARCTICA DIET PET 2L CAIXA C/6",
    "unitPrice": 6.88,
    "unitHl": 0.02,
    "boxPrice": 41.28,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "2538": {
    "sku": "2538",
    "descricao": "ANTARCTICA PILSEN 600ML",
    "unitPrice": 4.02,
    "unitHl": 0.00583,
    "boxPrice": 48.22,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "2546": {
    "sku": "2546",
    "descricao": "ORIGINAL 600ML",
    "unitPrice": 5.09,
    "unitHl": 0.00583,
    "boxPrice": 61.02,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "2548": {
    "sku": "2548",
    "descricao": "BUDWEISER 600ML",
    "unitPrice": 4.47,
    "unitHl": 0.00583,
    "boxPrice": 53.65,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "2585": {
    "sku": "2585",
    "descricao": "GUARANA CHP ANTARCTICA GFA VD 1L",
    "unitPrice": 2.31,
    "unitHl": 0.01,
    "boxPrice": 27.69,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "GFA 1L"
  },
  "3733": {
    "sku": "3733",
    "descricao": "BOHEMIA NOVA EMBALAGEM 600ML",
    "unitPrice": 3.95,
    "unitHl": 0.00583,
    "boxPrice": 47.39,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "4141": {
    "sku": "4141",
    "descricao": "PATAGONIA AMB LAG NACIONAL LT SLEEK 350ML C 8 CX CARTAO",
    "unitPrice": 3.99,
    "unitHl": 0.00375,
    "boxPrice": 31.95,
    "fatorSku": 8,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "4143": {
    "sku": "4143",
    "descricao": "PATAGONIA BOH PILS NACIONAL LT SLEEK 350ML C 8 CX CARTAO",
    "unitPrice": 3.62,
    "unitHl": 0.00375,
    "boxPrice": 28.94,
    "fatorSku": 8,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "4198": {
    "sku": "4198",
    "descricao": "PATAGONIA IPA LT SLEEK 350ML C 8 CX CARTAO",
    "unitPrice": 3.99,
    "unitHl": 0.00375,
    "boxPrice": 31.94,
    "fatorSku": 8,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "4262": {
    "sku": "4262",
    "descricao": "MICHELOB ULTRA N LT SLEEK 350ML C 8 CX CARTAO",
    "unitPrice": 4.1,
    "unitHl": 0.00375,
    "boxPrice": 32.83,
    "fatorSku": 8,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "4293": {
    "sku": "4293",
    "descricao": "PEPSI BLACK PET 200ML SH C/12",
    "unitPrice": 1.04,
    "unitHl": 0.00167,
    "boxPrice": 12.48,
    "fatorSku": 12,
    "fatorHl": 0.02,
    "grupo": "NAB",
    "embalagem": "PET 200ML"
  },
  "4367": {
    "sku": "4367",
    "descricao": "INDAIA AGUA MINERAL S/GAS GFA PET 1,5L FD C/6",
    "unitPrice": 2.26,
    "unitHl": 0.015,
    "boxPrice": 13.57,
    "fatorSku": 6,
    "fatorHl": 0.09,
    "grupo": "NAB",
    "embalagem": "PET 1,5L"
  },
  "4409": {
    "sku": "4409",
    "descricao": "PEPSI TWIST PET 2L SHRINK C/6",
    "unitPrice": 5.33,
    "unitHl": 0.02,
    "boxPrice": 32,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "6181": {
    "sku": "6181",
    "descricao": "AGUA MIN DIAS DAVILA S/GAS PET 500ML CAIXA C/12",
    "unitPrice": 0.51,
    "unitHl": 0.00083,
    "boxPrice": 6.08,
    "fatorSku": 12,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "6183": {
    "sku": "6183",
    "descricao": "AGUA MIN DIAS DAVILA C/GAS PET 500ML CAIXA C/12",
    "unitPrice": 1.25,
    "unitHl": 0.00083,
    "boxPrice": 14.98,
    "fatorSku": 12,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "6185": {
    "sku": "6185",
    "descricao": "AGUA MIN DIAS DAVILA S/GAS PET 1,5L CAIXA C/6",
    "unitPrice": 1.55,
    "unitHl": 0.015,
    "boxPrice": 9.32,
    "fatorSku": 6,
    "fatorHl": 0.09,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "7325": {
    "sku": "7325",
    "descricao": "PEPSI COLA PET 1L CAIXA C/12",
    "unitPrice": 2.84,
    "unitHl": 0.01,
    "boxPrice": 34.09,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 1L"
  },
  "7945": {
    "sku": "7945",
    "descricao": "PEPSI COLA PET 2,5L CAIXA C/6",
    "unitPrice": 5.22,
    "unitHl": 0.025,
    "boxPrice": 31.34,
    "fatorSku": 6,
    "fatorHl": 0.15,
    "grupo": "NAB",
    "embalagem": "PET 2,5L"
  },
  "7947": {
    "sku": "7947",
    "descricao": "GUARANA CHP ANTARCTICA PET 2,5L CAIXA C/6",
    "unitPrice": 5.39,
    "unitHl": 0.025,
    "boxPrice": 32.35,
    "fatorSku": 6,
    "fatorHl": 0.15,
    "grupo": "NAB",
    "embalagem": "PET 2,5L"
  },
  "7977": {
    "sku": "7977",
    "descricao": "GATORADE UVA PET 500ML SIXPACK",
    "unitPrice": 3.86,
    "unitHl": 0.005,
    "boxPrice": 23.14,
    "fatorSku": 6,
    "fatorHl": 0.03,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "7979": {
    "sku": "7979",
    "descricao": "GATORADE FRUTAS CITRICAS PET 500ML SIXPACK",
    "unitPrice": 4.78,
    "unitHl": 0.005,
    "boxPrice": 28.68,
    "fatorSku": 6,
    "fatorHl": 0.03,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "7980": {
    "sku": "7980",
    "descricao": "GATORADE TANGERINA PET 500ML SIXPACK",
    "unitPrice": 3.9,
    "unitHl": 0.005,
    "boxPrice": 23.41,
    "fatorSku": 6,
    "fatorHl": 0.03,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "7981": {
    "sku": "7981",
    "descricao": "GATORADE LARANJA PET 500ML SIXPACK",
    "unitPrice": 3.87,
    "unitHl": 0.005,
    "boxPrice": 23.25,
    "fatorSku": 6,
    "fatorHl": 0.03,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "7982": {
    "sku": "7982",
    "descricao": "GATORADE LIMAO PET 500ML SIXPACK",
    "unitPrice": 3.9,
    "unitHl": 0.005,
    "boxPrice": 23.4,
    "fatorSku": 6,
    "fatorHl": 0.03,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "7983": {
    "sku": "7983",
    "descricao": "GATORADE MORANGO-MARACUJA PET 500ML SIXPACK",
    "unitPrice": 3.89,
    "unitHl": 0.005,
    "boxPrice": 23.32,
    "fatorSku": 6,
    "fatorHl": 0.03,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "7985": {
    "sku": "7985",
    "descricao": "GATORADE MARACUJA PET 500ML SIXPACK",
    "unitPrice": 3.97,
    "unitHl": 0.005,
    "boxPrice": 23.82,
    "fatorSku": 6,
    "fatorHl": 0.03,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "8411": {
    "sku": "8411",
    "descricao": "GUARANA CHP ANTARCTICA PET 1,5 SHRINK C/6",
    "unitPrice": 4.17,
    "unitHl": 0.0035,
    "boxPrice": 25,
    "fatorSku": 6,
    "fatorHl": 0,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "8791": {
    "sku": "8791",
    "descricao": "H2OH LIMAO C/GAS PET 500ML CAIXA C/12",
    "unitPrice": 2.51,
    "unitHl": 0.005,
    "boxPrice": 30.07,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "8793": {
    "sku": "8793",
    "descricao": "H2OH LIMAO C/GAS PET 1,5L CAIXA C/6",
    "unitPrice": 4.69,
    "unitHl": 0.015,
    "boxPrice": 28.15,
    "fatorSku": 6,
    "fatorHl": 0.09,
    "grupo": "NAB",
    "embalagem": "PET 1,5L"
  },
  "8919": {
    "sku": "8919",
    "descricao": "GUARANA CHP ANTARCTICA PET 600ML CX12 NPAL",
    "unitPrice": 2.44,
    "unitHl": 0.00583,
    "boxPrice": 29.33,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "NAB",
    "embalagem": "PET 600ML"
  },
  "9067": {
    "sku": "9067",
    "descricao": "ANTARCTICA PILSEN LATA 350ML SH C/12 NPAL",
    "unitPrice": 2.41,
    "unitHl": 0.00333,
    "boxPrice": 28.95,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "9068": {
    "sku": "9068",
    "descricao": "SKOL LATA 350ML SH C/12 NPAL",
    "unitPrice": 2.38,
    "unitHl": 0.00333,
    "boxPrice": 28.52,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "9069": {
    "sku": "9069",
    "descricao": "BRAHMA CHOPP LATA 350ML SH C/12 NPAL",
    "unitPrice": 2.38,
    "unitHl": 0.00333,
    "boxPrice": 28.51,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "9071": {
    "sku": "9071",
    "descricao": "CARACU LATA 350ML SH C/12 NPAL",
    "unitPrice": 4.26,
    "unitHl": 0.00333,
    "boxPrice": 51.1,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "9072": {
    "sku": "9072",
    "descricao": "BOHEMIA NOVA EMBALAGEM LATA 350ML SH C/12 NPAL",
    "unitPrice": 2.77,
    "unitHl": 0.00333,
    "boxPrice": 33.26,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "9081": {
    "sku": "9081",
    "descricao": "MALZBIER BRAHMA LATA 350ML SH C/12 NPAL",
    "unitPrice": 3.16,
    "unitHl": 0.00333,
    "boxPrice": 37.9,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "9083": {
    "sku": "9083",
    "descricao": "SKOL LT 473ML SH C/12 NPAL",
    "unitPrice": 3.15,
    "unitHl": 0.005,
    "boxPrice": 37.84,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "9084": {
    "sku": "9084",
    "descricao": "GUARANA CHP ANTARCTICA LATA 350ML SH C/12 NPAL",
    "unitPrice": 1.84,
    "unitHl": 0.00333,
    "boxPrice": 22.12,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "9085": {
    "sku": "9085",
    "descricao": "GUARANA CHP ANTARCTICA DIET LATA 350ML SH C/12 NPAL",
    "unitPrice": 1.86,
    "unitHl": 0.00333,
    "boxPrice": 22.33,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "9087": {
    "sku": "9087",
    "descricao": "SODA LIMONADA ANTARCTICA LATA 350ML SH C/12 NPAL",
    "unitPrice": 1.62,
    "unitHl": 0.00333,
    "boxPrice": 19.41,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "9088": {
    "sku": "9088",
    "descricao": "SODA LIMONADA ANTARCTICA DIET LATA 350ML SH C/12 NPAL",
    "unitPrice": 2.98,
    "unitHl": 0.00333,
    "boxPrice": 35.76,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 350ML"
  },
  "9089": {
    "sku": "9089",
    "descricao": "SUKITA LATA 350ML SH C/12 NPAL",
    "unitPrice": 1.72,
    "unitHl": 0.00333,
    "boxPrice": 20.64,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "9091": {
    "sku": "9091",
    "descricao": "TONICA ANTARCTICA LATA 350ML SH C/12 NPAL",
    "unitPrice": 2.08,
    "unitHl": 0.00333,
    "boxPrice": 24.92,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "9092": {
    "sku": "9092",
    "descricao": "TONICA ANTARCTICA DIET LATA 350ML SH C/12 NPAL",
    "unitPrice": 1.96,
    "unitHl": 0.00333,
    "boxPrice": 23.57,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "9093": {
    "sku": "9093",
    "descricao": "PEPSI TWIST LATA 350ML SH C/12 NPAL",
    "unitPrice": 2.41,
    "unitHl": 0.00333,
    "boxPrice": 28.92,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "9096": {
    "sku": "9096",
    "descricao": "PEPSI COLA LATA 350ML SH C/12 NPAL",
    "unitPrice": 1.67,
    "unitHl": 0.00333,
    "boxPrice": 20.03,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "9274": {
    "sku": "9274",
    "descricao": "PEPSI ZERO LATA 350ML SH C/12 NPAL",
    "unitPrice": 1.82,
    "unitHl": 0.00333,
    "boxPrice": 21.89,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "9276": {
    "sku": "9276",
    "descricao": "PEPSI ZERO PET 2L CAIXA C/6",
    "unitPrice": 4.36,
    "unitHl": 0.02,
    "boxPrice": 26.13,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "9320": {
    "sku": "9320",
    "descricao": "BRAHMA CHOPP LT 473ML SH C/12 NPAL",
    "unitPrice": 2.95,
    "unitHl": 0.005,
    "boxPrice": 35.46,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "9427": {
    "sku": "9427",
    "descricao": "ANTARCTICA PILSEN LT 473ML SH C/12 NPAL",
    "unitPrice": 3.82,
    "unitHl": 0.005,
    "boxPrice": 45.9,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "9795": {
    "sku": "9795",
    "descricao": "GUARANA ANTARCTICA ZERO PET 1L CAIXA C/12",
    "unitPrice": 2.79,
    "unitHl": 0.01,
    "boxPrice": 33.45,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 1L"
  },
  "10175": {
    "sku": "10175",
    "descricao": "ANTARCTICA SUBZERO LT 473ML SH C/12 NPAL",
    "unitPrice": 3.74,
    "unitHl": 0.005,
    "boxPrice": 44.85,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "10530": {
    "sku": "10530",
    "descricao": "ANTARCTICA SUBZERO GFA VD 1L",
    "unitPrice": 6.53,
    "unitHl": 0.01,
    "boxPrice": 78.4,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "CERVEJA",
    "embalagem": "LITRÃO"
  },
  "10537": {
    "sku": "10537",
    "descricao": "BOHEMIA GFA VD 990ML",
    "unitPrice": 51.64,
    "unitHl": 0.01,
    "boxPrice": 51.64,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "10949": {
    "sku": "10949",
    "descricao": "AGUA MINERAL PETROPOLIS S/GAS PET 1,5 SHRINK C/6",
    "unitPrice": 3.17,
    "unitHl": 0.0035,
    "boxPrice": 19,
    "fatorSku": 6,
    "fatorHl": 0,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "11593": {
    "sku": "11593",
    "descricao": "PEPSI COLA GFA VD 1L",
    "unitPrice": 33.9,
    "unitHl": 0.01,
    "boxPrice": 33.9,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "12948": {
    "sku": "12948",
    "descricao": "BRAHMA CHOPP ZERO LATA 350ML SH C/12 NPAL",
    "unitPrice": 2.57,
    "unitHl": 0.00333,
    "boxPrice": 30.89,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "12951": {
    "sku": "12951",
    "descricao": "BRAHMA CHOPP ZERO LN 355ML SIXPACK CX CART C/04",
    "unitPrice": 3.22,
    "unitHl": 0.00375,
    "boxPrice": 77.3,
    "fatorSku": 24,
    "fatorHl": 0.09,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "13061": {
    "sku": "13061",
    "descricao": "H2OH LIMONETO PET 500ML SHRINK C/12 NPAL",
    "unitPrice": 2.73,
    "unitHl": 0.005,
    "boxPrice": 32.79,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "13065": {
    "sku": "13065",
    "descricao": "H2OH LIMONETO PET 1,5 SHRINK C/06 NPAL",
    "unitPrice": 4.54,
    "unitHl": 0.015,
    "boxPrice": 27.23,
    "fatorSku": 6,
    "fatorHl": 0.09,
    "grupo": "NAB",
    "embalagem": "PET 1,5L"
  },
  "13194": {
    "sku": "13194",
    "descricao": "BRAHMA CHOPP ONE WAY 300ML CX C/23",
    "unitPrice": 2.68,
    "unitHl": 0.0035,
    "boxPrice": 61.72,
    "fatorSku": 23,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "13196": {
    "sku": "13196",
    "descricao": "SKOL ONE WAY 300ML CX C/23",
    "unitPrice": 2.68,
    "unitHl": 0.0035,
    "boxPrice": 61.72,
    "fatorSku": 23,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "13201": {
    "sku": "13201",
    "descricao": "BRAHMA CHOPP GFA VD 300ML CX C/23",
    "unitPrice": 1.7,
    "unitHl": 0.00304,
    "boxPrice": 39.08,
    "fatorSku": 23,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "LITRINHO"
  },
  "13203": {
    "sku": "13203",
    "descricao": "ANTARCTICA PILSEN GFA VD 300ML CX C/23",
    "unitPrice": 2.34,
    "unitHl": 0.00304,
    "boxPrice": 53.9,
    "fatorSku": 23,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "LITRINHO"
  },
  "13205": {
    "sku": "13205",
    "descricao": "SKOL GFA VD 300ML CX C/23",
    "unitPrice": 1.7,
    "unitHl": 0.00304,
    "boxPrice": 39.14,
    "fatorSku": 23,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "LITRINHO"
  },
  "13307": {
    "sku": "13307",
    "descricao": "BUDWEISER GFA VD 990ML CX C/12",
    "unitPrice": 4.75,
    "unitHl": 0.00083,
    "boxPrice": 56.96,
    "fatorSku": 12,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "13486": {
    "sku": "13486",
    "descricao": "FUSION PET 1L SH C/06",
    "unitPrice": 6.43,
    "unitHl": 0.00167,
    "boxPrice": 38.58,
    "fatorSku": 6,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "13566": {
    "sku": "13566",
    "descricao": "SKOL BEATS SENSES LT 269ML CX C/8 FRIDGE PACK",
    "unitPrice": 3.68,
    "unitHl": 0.0025,
    "boxPrice": 29.4,
    "fatorSku": 8,
    "fatorHl": 0.02,
    "grupo": "MATCH",
    "embalagem": "LATA 269ML"
  },
  "13839": {
    "sku": "13839",
    "descricao": "BUDWEISER LT 269ML CX C/8 FRIDGE PACK",
    "unitPrice": 2.28,
    "unitHl": 0.0035,
    "boxPrice": 18.23,
    "fatorSku": 8,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "14099": {
    "sku": "14099",
    "descricao": "BUDWEISER ONE WAY 600ML CX C/12 NPAL",
    "unitPrice": 5.02,
    "unitHl": 0.00083,
    "boxPrice": 60.3,
    "fatorSku": 12,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "14135": {
    "sku": "14135",
    "descricao": "BUDWEISER LATA 473ML SIX-PACK SH C/2 NPAL",
    "unitPrice": 3.23,
    "unitHl": 0.005,
    "boxPrice": 38.78,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "14283": {
    "sku": "14283",
    "descricao": "WALS DUBBEL ONE WAY 375ML CX C/12 ARTE",
    "unitPrice": 15.69,
    "unitHl": 0.0035,
    "boxPrice": 188.23,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "14293": {
    "sku": "14293",
    "descricao": "WALS TRIPPEL ONE WAY 375ML CX C/12 ARTE",
    "unitPrice": 13.88,
    "unitHl": 0.0035,
    "boxPrice": 166.59,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "14550": {
    "sku": "14550",
    "descricao": "COLORADO APPIA ONE WAY 600ML CX C-12 ARTE",
    "unitPrice": 133.46,
    "unitHl": 0.01,
    "boxPrice": 133.46,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "16503": {
    "sku": "16503",
    "descricao": "BOHEMIA GFA VD 300ML CX C/23",
    "unitPrice": 1.66,
    "unitHl": 0.0035,
    "boxPrice": 38.28,
    "fatorSku": 23,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "17266": {
    "sku": "17266",
    "descricao": "BOHEMIA LT 473ML CX CARTAO C/12",
    "unitPrice": 6.08,
    "unitHl": 0.005,
    "boxPrice": 73,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "17268": {
    "sku": "17268",
    "descricao": "PATAGONIA BOH PILS NACIONAL LN 355ML CX C/12",
    "unitPrice": 4.3,
    "unitHl": 0.0035,
    "boxPrice": 51.57,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "17276": {
    "sku": "17276",
    "descricao": "PATAGONIA AMB LAG NACIONAL LN 355ML CX C/12",
    "unitPrice": 4.32,
    "unitHl": 0.0035,
    "boxPrice": 51.89,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "17278": {
    "sku": "17278",
    "descricao": "PATAGONIA WEISSE NACIONAL LN 355ML CX C/12",
    "unitPrice": 4.51,
    "unitHl": 0.0035,
    "boxPrice": 54.15,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "17757": {
    "sku": "17757",
    "descricao": "BECKS N LONG NECK 330ML SIX-PACK SHRINK C/4",
    "unitPrice": 4.12,
    "unitHl": 0.0035,
    "boxPrice": 98.82,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "17808": {
    "sku": "17808",
    "descricao": "BUDWEISER OW 330ML CX C/24",
    "unitPrice": 3.78,
    "unitHl": 0.00333,
    "boxPrice": 90.67,
    "fatorSku": 24,
    "fatorHl": 0.08,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "18142": {
    "sku": "18142",
    "descricao": "GOOSE ISLAND MIDWAY NAC LN 355ML CX C/12",
    "unitPrice": 6.81,
    "unitHl": 0.0035,
    "boxPrice": 81.76,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "18152": {
    "sku": "18152",
    "descricao": "GUARANA CHP ANTARCTICA PET 200ML SH C/12",
    "unitPrice": 1.1,
    "unitHl": 0.00167,
    "boxPrice": 13.21,
    "fatorSku": 12,
    "fatorHl": 0.02,
    "grupo": "NAB",
    "embalagem": "PET 200ML"
  },
  "18266": {
    "sku": "18266",
    "descricao": "PEPSI COLA PET 200ML SH C/12",
    "unitPrice": 1.01,
    "unitHl": 0.00167,
    "boxPrice": 12.08,
    "fatorSku": 12,
    "fatorHl": 0.02,
    "grupo": "NAB",
    "embalagem": "PET 200ML"
  },
  "18267": {
    "sku": "18267",
    "descricao": "SODA LIMONADA ANTARCTICA PET 200ML SH C/12",
    "unitPrice": 1.02,
    "unitHl": 0.00167,
    "boxPrice": 12.24,
    "fatorSku": 12,
    "fatorHl": 0.02,
    "grupo": "NAB",
    "embalagem": "PET 200ML"
  },
  "18268": {
    "sku": "18268",
    "descricao": "SUKITA PET 200ML SH C/12",
    "unitPrice": 1.04,
    "unitHl": 0.00167,
    "boxPrice": 12.47,
    "fatorSku": 12,
    "fatorHl": 0.02,
    "grupo": "NAB",
    "embalagem": "PET 200ML"
  },
  "18676": {
    "sku": "18676",
    "descricao": "SKOL PURO MALTE LT 473ML SH C/12 NPAL",
    "unitPrice": 2.06,
    "unitHl": 0.0035,
    "boxPrice": 24.71,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "18677": {
    "sku": "18677",
    "descricao": "SKOL PURO MALTE 600ML",
    "unitPrice": 75,
    "unitHl": 0.01,
    "boxPrice": 75,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "18752": {
    "sku": "18752",
    "descricao": "PATAGONIA WEISSE NACIONAL ONE WAY 740ML CX6",
    "unitPrice": 71.96,
    "unitHl": 0.01,
    "boxPrice": 71.96,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "18772": {
    "sku": "18772",
    "descricao": "PATAGONIA AMB LAG NACIONAL ONE WAY 740ML CX6",
    "unitPrice": 71.96,
    "unitHl": 0.01,
    "boxPrice": 71.96,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "18780": {
    "sku": "18780",
    "descricao": "CORONITA EXTRA N OW 210ML CX C/4 SIX PACK",
    "unitPrice": 3.48,
    "unitHl": 0.00208,
    "boxPrice": 83.63,
    "fatorSku": 24,
    "fatorHl": 0.05,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "18807": {
    "sku": "18807",
    "descricao": "STELLA ARTOIS LONG NECK 330ML SIX-PACK SHRINK C/4",
    "unitPrice": 4.24,
    "unitHl": 0.00333,
    "boxPrice": 101.72,
    "fatorSku": 24,
    "fatorHl": 0.08,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "18833": {
    "sku": "18833",
    "descricao": "SKOL PURO MALTE LONG NECK 275ML SIX PACK CX04 PULL OFF",
    "unitPrice": 13.31,
    "unitHl": 0.0035,
    "boxPrice": 79.84,
    "fatorSku": 6,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "18836": {
    "sku": "18836",
    "descricao": "CORONA EXTRA N LONG NECK 330ML CX C/24 NPAL",
    "unitPrice": 4.92,
    "unitHl": 0.00333,
    "boxPrice": 118.01,
    "fatorSku": 24,
    "fatorHl": 0.08,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "19164": {
    "sku": "19164",
    "descricao": "GUARANA CHP ANTARCTICA PET 1L PACK C/2 MULTPACK",
    "unitPrice": 1.95,
    "unitHl": 0.01,
    "boxPrice": 3.9,
    "fatorSku": 2,
    "fatorHl": 0.02,
    "grupo": "NAB",
    "embalagem": "PET 1L"
  },
  "19166": {
    "sku": "19166",
    "descricao": "COLORADO LAGER ONE WAY 600ML CX C-12 ARTE",
    "unitPrice": 112.88,
    "unitHl": 0.01,
    "boxPrice": 112.88,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "19225": {
    "sku": "19225",
    "descricao": "RED BULL BR LATA 250ML CX C 24 NPAL .",
    "unitPrice": 5.76,
    "unitHl": 0.0025,
    "boxPrice": 138.15,
    "fatorSku": 24,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "LATA 250ML"
  },
  "19227": {
    "sku": "19227",
    "descricao": "RED BULL BR LATA 355ML FOUR PACK .",
    "unitPrice": 7.27,
    "unitHl": 0.0025,
    "boxPrice": 29.08,
    "fatorSku": 4,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "19229": {
    "sku": "19229",
    "descricao": "RED BULL BR LATA 250ML SIX PACK NPAL .",
    "unitPrice": 6.2,
    "unitHl": 0.00167,
    "boxPrice": 37.23,
    "fatorSku": 6,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "LATA 250ML"
  },
  "19231": {
    "sku": "19231",
    "descricao": "RED BULL SUGAR FREE BR LATA 250ML FOUR PACK NPAL .",
    "unitPrice": 6.2,
    "unitHl": 0.0025,
    "boxPrice": 24.82,
    "fatorSku": 4,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "LATA 250ML"
  },
  "19305": {
    "sku": "19305",
    "descricao": "TONICA ANTARCTICA ZERO LT 269ML SH C/15",
    "unitPrice": 1.73,
    "unitHl": 0.0035,
    "boxPrice": 26,
    "fatorSku": 15,
    "fatorHl": 0,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "19321": {
    "sku": "19321",
    "descricao": "GUARANA ANTARCTICA ZERO PET 200ML SH C/12",
    "unitPrice": 1.07,
    "unitHl": 0.00167,
    "boxPrice": 12.84,
    "fatorSku": 12,
    "fatorHl": 0.02,
    "grupo": "NAB",
    "embalagem": "PET 200ML"
  },
  "19644": {
    "sku": "19644",
    "descricao": "SKOL PURO MALTE LT SLEEK 350ML SH C 12",
    "unitPrice": 2.38,
    "unitHl": 0.0035,
    "boxPrice": 28.51,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "19668": {
    "sku": "19668",
    "descricao": "ORIGINAL LATA 350ML SH C/12 NPAL",
    "unitPrice": 3.13,
    "unitHl": 0.00333,
    "boxPrice": 37.58,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "19729": {
    "sku": "19729",
    "descricao": "STELLA ARTOIS LT SLEEK 350ML C 8 CX CARTAO",
    "unitPrice": 3.61,
    "unitHl": 0.00375,
    "boxPrice": 28.85,
    "fatorSku": 8,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "19849": {
    "sku": "19849",
    "descricao": "BOHEMIA_ LT SLEEK 350ML SH C 12",
    "unitPrice": 2.41,
    "unitHl": 0.0035,
    "boxPrice": 28.9,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "20164": {
    "sku": "20164",
    "descricao": "SKOL LT 473ML SH C/12 NPAL MULTPACK 12",
    "unitPrice": 3.12,
    "unitHl": 0.005,
    "boxPrice": 37.4,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "20217": {
    "sku": "20217",
    "descricao": "ORIGINAL GFA VD 300ML CX C/23",
    "unitPrice": 2,
    "unitHl": 0.00304,
    "boxPrice": 45.94,
    "fatorSku": 23,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "LITRINHO"
  },
  "20329": {
    "sku": "20329",
    "descricao": "BRAHMA DUPLO MALTE 600ML",
    "unitPrice": 54.69,
    "unitHl": 0.01,
    "boxPrice": 54.69,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "20498": {
    "sku": "20498",
    "descricao": "BRAHMA DUPLO MALTE LT SLEEK 350ML SH C 12",
    "unitPrice": 2.71,
    "unitHl": 0.00333,
    "boxPrice": 32.48,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "20530": {
    "sku": "20530",
    "descricao": "STELLA ARTOIS 600 ML",
    "unitPrice": 5.39,
    "unitHl": 0.00583,
    "boxPrice": 64.71,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "20533": {
    "sku": "20533",
    "descricao": "BRAHMA DUPLO MALTE GFA VD 1L",
    "unitPrice": 55.86,
    "unitHl": 0.01,
    "boxPrice": 55.86,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "20535": {
    "sku": "20535",
    "descricao": "STELLA ARTOIS ONE WAY 600ML CX C/12 NPAL",
    "unitPrice": 6.41,
    "unitHl": 0.00583,
    "boxPrice": 76.89,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "20549": {
    "sku": "20549",
    "descricao": "BRAHMA DUPLO MALTE GFA VD 300ML CX C/23",
    "unitPrice": 1.92,
    "unitHl": 0.0035,
    "boxPrice": 44.19,
    "fatorSku": 23,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "20647": {
    "sku": "20647",
    "descricao": "BRAHMA DUPLO MALTE LT 269ML SH C15 NPAL",
    "unitPrice": 1.72,
    "unitHl": 0.0035,
    "boxPrice": 25.81,
    "fatorSku": 15,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "20651": {
    "sku": "20651",
    "descricao": "CORONA EXTRA N LT SLEEK 350ML C 8 CX CARTAO",
    "unitPrice": 3.74,
    "unitHl": 0.00375,
    "boxPrice": 29.95,
    "fatorSku": 8,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "20853": {
    "sku": "20853",
    "descricao": "COLORADO LAGER LT SLEEK 350ML C 8 CX CARTAO",
    "unitPrice": 34.58,
    "unitHl": 0.0035,
    "boxPrice": 34.58,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "21020": {
    "sku": "21020",
    "descricao": "BUDWEISER LT SLEEK 350ML CX CART C 12",
    "unitPrice": 2.65,
    "unitHl": 0.00333,
    "boxPrice": 31.78,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "21025": {
    "sku": "21025",
    "descricao": "COLORADO APPIA LATA XSLEEK 410ML CX C12",
    "unitPrice": 5.18,
    "unitHl": 0.0035,
    "boxPrice": 62.2,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "21119": {
    "sku": "21119",
    "descricao": "SKOL BEATS GT LT 269ML CX CARTAO C/8 NPAL",
    "unitPrice": 3.91,
    "unitHl": 0.0025,
    "boxPrice": 31.27,
    "fatorSku": 8,
    "fatorHl": 0.02,
    "grupo": "MATCH",
    "embalagem": "LATA 269ML"
  },
  "21422": {
    "sku": "21422",
    "descricao": "BOHEMIA NOVA EMBALAGEM 600ML NE MG",
    "unitPrice": 71.08,
    "unitHl": 0.01,
    "boxPrice": 71.08,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "21441": {
    "sku": "21441",
    "descricao": "SUKITA LIMAO PET 2L CAIXA C/6",
    "unitPrice": 3.17,
    "unitHl": 0.02,
    "boxPrice": 19.02,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "21526": {
    "sku": "21526",
    "descricao": "JOHNNIE WALKER RED LABEL GARRAFA VIDRO 1 L",
    "unitPrice": 74,
    "unitHl": 0.01,
    "boxPrice": 74,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA WHISKY"
  },
  "21527": {
    "sku": "21527",
    "descricao": "TANQUERAY GIN LONDON DRY GARRAFA VIDRO 750ML",
    "unitPrice": 78.9,
    "unitHl": 0.01,
    "boxPrice": 78.9,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA GIN"
  },
  "21529": {
    "sku": "21529",
    "descricao": "ABSOLUT ORIGINAL GARRAFA VIDRO 1 L",
    "unitPrice": 77.85,
    "unitHl": 0.01,
    "boxPrice": 77.85,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "GFA VODKA"
  },
  "21530": {
    "sku": "21530",
    "descricao": "SMIRNOFF ORIGINAL GARRAFA VIDRO 998ML",
    "unitPrice": 30.28,
    "unitHl": 0.01,
    "boxPrice": 30.28,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "GFA VODKA"
  },
  "21632": {
    "sku": "21632",
    "descricao": "SPATEN N LN 355ML SIXPACK SH C/4",
    "unitPrice": 3.94,
    "unitHl": 0.00375,
    "boxPrice": 94.58,
    "fatorSku": 24,
    "fatorHl": 0.09,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "21658": {
    "sku": "21658",
    "descricao": "SPATEN N LT SLEEK 350ML CX CART C 12",
    "unitPrice": 3.35,
    "unitHl": 0.00333,
    "boxPrice": 40.16,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "21666": {
    "sku": "21666",
    "descricao": "RED BULL TROPICAL BR LATA 250ML FOUR PACK NPAL .",
    "unitPrice": 6.2,
    "unitHl": 0.0025,
    "boxPrice": 24.82,
    "fatorSku": 4,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "LATA 250ML"
  },
  "21668": {
    "sku": "21668",
    "descricao": "SPATEN N ONE WAY 600ML CX C/12 NP ARTE",
    "unitPrice": 5.86,
    "unitHl": 0.00583,
    "boxPrice": 70.31,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "21778": {
    "sku": "21778",
    "descricao": "JOHNNIE WALKER RED LABEL GARRAFA VIDRO 750ML",
    "unitPrice": 59,
    "unitHl": 0.01,
    "boxPrice": 59,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "21781": {
    "sku": "21781",
    "descricao": "SMIRNOFF ICE GARRAFA VD 275ML CX C24",
    "unitPrice": 6.45,
    "unitHl": 0.0025,
    "boxPrice": 154.89,
    "fatorSku": 24,
    "fatorHl": 0.06,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VODKA"
  },
  "21786": {
    "sku": "21786",
    "descricao": "MONTILLA CARTA BRANCA GARRAFA VIDRO 1 L",
    "unitPrice": 22,
    "unitHl": 0.01,
    "boxPrice": 22,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "21787": {
    "sku": "21787",
    "descricao": "DREHER GARRAFA VIDRO 900ML",
    "unitPrice": 18.51,
    "unitHl": 0.01,
    "boxPrice": 18.51,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA CONHAQUE"
  },
  "21788": {
    "sku": "21788",
    "descricao": "BALLANTINES FINEST GARRAFA VIDRO 1 L",
    "unitPrice": 83.39,
    "unitHl": 0.01,
    "boxPrice": 83.39,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "21789": {
    "sku": "21789",
    "descricao": "ORLOFF GARRAFA VIDRO 1 L",
    "unitPrice": 29.97,
    "unitHl": 0.01,
    "boxPrice": 29.97,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "21791": {
    "sku": "21791",
    "descricao": "PIRASSUNUNGA 51 GARRAFA VIDRO 965ML",
    "unitPrice": 9.3,
    "unitHl": 0.01,
    "boxPrice": 9.3,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "21792": {
    "sku": "21792",
    "descricao": "WHITE HORSE GARRAFA VIDRO 1 L",
    "unitPrice": 62.13,
    "unitHl": 0.01,
    "boxPrice": 62.13,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA WHISKY"
  },
  "21955": {
    "sku": "21955",
    "descricao": "CHIVAS REGAL 12 ANOS GARRAFA VIDRO 1 L",
    "unitPrice": 144.81,
    "unitHl": 0.01,
    "boxPrice": 144.81,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA WHISKY"
  },
  "21968": {
    "sku": "21968",
    "descricao": "TRIDENT HORTELA ENVELOPE 8G CX C/21",
    "unitPrice": 1.62,
    "unitHl": 0.00048,
    "boxPrice": 34.05,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY"
  },
  "21970": {
    "sku": "21970",
    "descricao": "TRIDENT MENTA ENVELOPE 8G CX C/21",
    "unitPrice": 1.62,
    "unitHl": 0.0035,
    "boxPrice": 34.05,
    "fatorSku": 21,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "21973": {
    "sku": "21973",
    "descricao": "TRIDENT MELANCIA ENVELOPE 8G CX C/21",
    "unitPrice": 1.62,
    "unitHl": 0.00048,
    "boxPrice": 34.04,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY"
  },
  "21974": {
    "sku": "21974",
    "descricao": "TRIDENT TUTTI-FRUTTI ENVELOPE 8G CX C/21",
    "unitPrice": 1.62,
    "unitHl": 0.00048,
    "boxPrice": 34.05,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY"
  },
  "22003": {
    "sku": "22003",
    "descricao": "HALLS CEREJA ENVELOPE 28G CX C/21",
    "unitPrice": 1.04,
    "unitHl": 0.00048,
    "boxPrice": 21.85,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "ENVELOPE"
  },
  "22005": {
    "sku": "22005",
    "descricao": "HALLS MENTA ENVELOPE 28G CX C/21",
    "unitPrice": 1.04,
    "unitHl": 0.00048,
    "boxPrice": 21.85,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY"
  },
  "22007": {
    "sku": "22007",
    "descricao": "HALLS EXTRA FORTE ENVELOPE 28G CX C/21",
    "unitPrice": 1.04,
    "unitHl": 0.00048,
    "boxPrice": 21.85,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "ENVELOPE"
  },
  "22009": {
    "sku": "22009",
    "descricao": "CHICLETE ADAMS HORTELA CAIXINHA 2,8G CX C/100",
    "unitPrice": 0.19,
    "unitHl": 0.0035,
    "boxPrice": 18.65,
    "fatorSku": 100,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22027": {
    "sku": "22027",
    "descricao": "COLORADO APPIA LT SLEEK 350ML C8 CX CARTAO NPAL",
    "unitPrice": 35,
    "unitHl": 0.0035,
    "boxPrice": 35,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22106": {
    "sku": "22106",
    "descricao": "MINI OREO PCT 35G CX C/10",
    "unitPrice": 1.81,
    "unitHl": 0.0035,
    "boxPrice": 18.07,
    "fatorSku": 10,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22177": {
    "sku": "22177",
    "descricao": "BUDWEISER ZERO LT SLEEK 350ML C 8 CX CARTAO",
    "unitPrice": 2.89,
    "unitHl": 0.00375,
    "boxPrice": 23.1,
    "fatorSku": 8,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "22180": {
    "sku": "22180",
    "descricao": "BUDWEISER ZERO LONG NECK 330ML SIX-PACK SHRINK C/4",
    "unitPrice": 3.6,
    "unitHl": 0.00333,
    "boxPrice": 86.52,
    "fatorSku": 24,
    "fatorHl": 0.08,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "22200": {
    "sku": "22200",
    "descricao": "TONICA ANTARCTICA PET 1 L SH C/06",
    "unitPrice": 4.55,
    "unitHl": 0.00167,
    "boxPrice": 27.31,
    "fatorSku": 6,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22202": {
    "sku": "22202",
    "descricao": "TONICA ANTARCTICA ZERO PET 1L SH C/06",
    "unitPrice": 4.28,
    "unitHl": 0.00167,
    "boxPrice": 25.67,
    "fatorSku": 6,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22326": {
    "sku": "22326",
    "descricao": "BRAHMA DUPLO MALTE LT 473ML SH C/12 NPAL",
    "unitPrice": 3.14,
    "unitHl": 0.0035,
    "boxPrice": 37.67,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22330": {
    "sku": "22330",
    "descricao": "MENDORATO PCT 27G CX C/60",
    "unitPrice": 0.44,
    "unitHl": 0.0035,
    "boxPrice": 26.53,
    "fatorSku": 60,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22382": {
    "sku": "22382",
    "descricao": "PASSPORT SELECTION GARRAFA VIDRO 1 L",
    "unitPrice": 31.79,
    "unitHl": 0.01,
    "boxPrice": 31.79,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA 1L"
  },
  "22508": {
    "sku": "22508",
    "descricao": "PERGOLA SEL. VINHO TINTO SUAVE GARRAFA VIDRO 750ML",
    "unitPrice": 19.93,
    "unitHl": 0.01,
    "boxPrice": 19.93,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22514": {
    "sku": "22514",
    "descricao": "BALLANTINES FINEST GARRAFA VIDRO 750ML",
    "unitPrice": 50.39,
    "unitHl": 0.01,
    "boxPrice": 50.39,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22543": {
    "sku": "22543",
    "descricao": "ROCKS STRAMBERRY GARRAFA VIDRO 1 L",
    "unitPrice": 24.32,
    "unitHl": 0.01,
    "boxPrice": 24.32,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22562": {
    "sku": "22562",
    "descricao": "DOMECQ COQ. COMPOSTO GARRAFA VIDRO 1 L",
    "unitPrice": 42.19,
    "unitHl": 0.01,
    "boxPrice": 42.19,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA CONHAQUE"
  },
  "22783": {
    "sku": "22783",
    "descricao": "BUDWEISER LATA 310ML CX CARTAO C/15 MULTPACK 15",
    "unitPrice": 6.58,
    "unitHl": 0.0035,
    "boxPrice": 98.63,
    "fatorSku": 15,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22859": {
    "sku": "22859",
    "descricao": "PIRAQUE LEITE MALTADO PCT 160G CX C/40",
    "unitPrice": 3.5,
    "unitHl": 0.0035,
    "boxPrice": 140,
    "fatorSku": 40,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22860": {
    "sku": "22860",
    "descricao": "PIRAQUE BISC AGUA GERGELIM PCT 240G CX C/40",
    "unitPrice": 1.75,
    "unitHl": 0.0035,
    "boxPrice": 70,
    "fatorSku": 40,
    "fatorHl": 0,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22871": {
    "sku": "22871",
    "descricao": "PIRAQUE ROLADINHO GOIABA PCT 75G CX C/40",
    "unitPrice": 3.02,
    "unitHl": 0.0035,
    "boxPrice": 120.8,
    "fatorSku": 40,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "22876": {
    "sku": "22876",
    "descricao": "PIRAQUE BISC SALG QUEIJINHO PCT 100G CX C/20",
    "unitPrice": 2.5,
    "unitHl": 0.0035,
    "boxPrice": 50,
    "fatorSku": 20,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23028": {
    "sku": "23028",
    "descricao": "BUCHANANS WHISKY DELUXE 12 ANOS GARRAFA VIDRO 1 L",
    "unitPrice": 180.86,
    "unitHl": 0.01,
    "boxPrice": 180.86,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA WHISKY"
  },
  "23029": {
    "sku": "23029",
    "descricao": "JOHNNIE WALKER BLACK LABEL GARRAFA VIDRO 1 L",
    "unitPrice": 122.34,
    "unitHl": 0.01,
    "boxPrice": 122.34,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23184": {
    "sku": "23184",
    "descricao": "PITU AGUARDENTE LT 350ML CX C/12",
    "unitPrice": 4,
    "unitHl": 0.00333,
    "boxPrice": 48.03,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 350ML"
  },
  "23186": {
    "sku": "23186",
    "descricao": "SPATEN N 600ML",
    "unitPrice": 5.05,
    "unitHl": 0.00583,
    "boxPrice": 60.57,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "23246": {
    "sku": "23246",
    "descricao": "PIRACANJUBA LEITE CONDENSADO TETRAPAK 395G CX C/27",
    "unitPrice": 4.48,
    "unitHl": 0.0035,
    "boxPrice": 120.96,
    "fatorSku": 27,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23256": {
    "sku": "23256",
    "descricao": "PIRACANJUBA CREME DE LEITE TETRAPAK 200G CX C/27",
    "unitPrice": 2.69,
    "unitHl": 0.0035,
    "boxPrice": 72.63,
    "fatorSku": 27,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23269": {
    "sku": "23269",
    "descricao": "SKOL BEATS GT LONG NECK 269ML SIX-PACK SH C/4",
    "unitPrice": 4.83,
    "unitHl": 0.0025,
    "boxPrice": 115.95,
    "fatorSku": 24,
    "fatorHl": 0.06,
    "grupo": "MATCH",
    "embalagem": "LONG NECK"
  },
  "23271": {
    "sku": "23271",
    "descricao": "SKOL BEATS SENSES LONG NECK 269ML SIX-PACK SH C/4",
    "unitPrice": 4.46,
    "unitHl": 0.0025,
    "boxPrice": 107.11,
    "fatorSku": 24,
    "fatorHl": 0.06,
    "grupo": "MATCH",
    "embalagem": "LONG NECK"
  },
  "23441": {
    "sku": "23441",
    "descricao": "SALINAS CRISTALINA CACHACA GARRAFA VIDRO 1 L",
    "unitPrice": 29.46,
    "unitHl": 0.01,
    "boxPrice": 29.46,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23443": {
    "sku": "23443",
    "descricao": "PITU AGUARDENTE GARRAFA VIDRO 965ML",
    "unitPrice": 9.5,
    "unitHl": 0.01,
    "boxPrice": 9.5,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23449": {
    "sku": "23449",
    "descricao": "MIKES HARD LEMONADE N LT 269ML SH C12 NP",
    "unitPrice": 3.33,
    "unitHl": 0.0035,
    "boxPrice": 40,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "MATCH",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23546": {
    "sku": "23546",
    "descricao": "INDAIA AGUA MINERAL C/GAS GFA PET 500ML PACK C/12",
    "unitPrice": 1.36,
    "unitHl": 0.005,
    "boxPrice": 16.34,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "23552": {
    "sku": "23552",
    "descricao": "INDAIA AGUA MINERAL S/GAS GFA PET 500ML PACK C/12",
    "unitPrice": 1.18,
    "unitHl": 0.005,
    "boxPrice": 14.21,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "23594": {
    "sku": "23594",
    "descricao": "PIRAKIDS BEBIDA LACTEA CHOCOLATE TETRA PAK 200 ML CX C/27",
    "unitPrice": 1.15,
    "unitHl": 0.0035,
    "boxPrice": 31.07,
    "fatorSku": 27,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23600": {
    "sku": "23600",
    "descricao": "PIRACANJUBA WHEY BEB. LACT. ZL CACAU TETRAPAK 250ML CX C/12",
    "unitPrice": 4.2,
    "unitHl": 0.0035,
    "boxPrice": 50.4,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23602": {
    "sku": "23602",
    "descricao": "PIRACANJUBA WHEY BEB. LACT. ZL BAUNILHA TETRAPAK 250ML CX C/",
    "unitPrice": 50.4,
    "unitHl": 0.0035,
    "boxPrice": 50.4,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23651": {
    "sku": "23651",
    "descricao": "PARATUDO RAIZES AMARGAS GARRAFA VIDRO 900ML",
    "unitPrice": 16.11,
    "unitHl": 0.01,
    "boxPrice": 16.11,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23671": {
    "sku": "23671",
    "descricao": "CERVEGELA PLASTICA BRAHMA 1 UN P/ GFA 1L CX C/3",
    "unitPrice": 17.26,
    "unitHl": 0.01,
    "boxPrice": 51.77,
    "fatorSku": 3,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "CERVEGELA"
  },
  "23672": {
    "sku": "23672",
    "descricao": "CERVEGELA PLASTICA BRAHMA 1 UN P/ GFA 600ML CX C/3",
    "unitPrice": 17.26,
    "unitHl": 0.00667,
    "boxPrice": 51.77,
    "fatorSku": 3,
    "fatorHl": 0.02,
    "grupo": "CERVEJA",
    "embalagem": "CERVEGELA"
  },
  "23673": {
    "sku": "23673",
    "descricao": "CERVEGELA PLASTICA SKOL 1 UN P/ GFA 1L CX C/3",
    "unitPrice": 17.26,
    "unitHl": 0.00333,
    "boxPrice": 51.77,
    "fatorSku": 3,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23674": {
    "sku": "23674",
    "descricao": "CERVEGELA PLASTICA SKOL 1 UN P/ GFA 600ML CX C/3",
    "unitPrice": 17.26,
    "unitHl": 0.00333,
    "boxPrice": 51.77,
    "fatorSku": 3,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "23731": {
    "sku": "23731",
    "descricao": "GATORADE MELANCIA-MORANGO PET 500ML SIXPACK",
    "unitPrice": 4.67,
    "unitHl": 0.00167,
    "boxPrice": 28,
    "fatorSku": 6,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "24161": {
    "sku": "24161",
    "descricao": "S. JOAO BARRA CONHAQUE ALC. GARRAFA VIDRO 900ML",
    "unitPrice": 19.3,
    "unitHl": 0.01,
    "boxPrice": 19.3,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA CONHAQUE"
  },
  "24168": {
    "sku": "24168",
    "descricao": "MICHELOB ULTRA N LONG NECK 330ML SIX-PACK SHRINK C/4",
    "unitPrice": 5.45,
    "unitHl": 0.00333,
    "boxPrice": 130.86,
    "fatorSku": 24,
    "fatorHl": 0.08,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "24184": {
    "sku": "24184",
    "descricao": "PIRAQUE MALTADO COBERTO CHOCOLATE PCT 80G CX C/40",
    "unitPrice": 3.02,
    "unitHl": 0.0035,
    "boxPrice": 120.8,
    "fatorSku": 40,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "24256": {
    "sku": "24256",
    "descricao": "PETROPOLIS AGUA MIN SEM GAS PET 1,5 SHRINK C/6",
    "unitPrice": 1.58,
    "unitHl": 0.015,
    "boxPrice": 9.5,
    "fatorSku": 6,
    "fatorHl": 0.09,
    "grupo": "NAB",
    "embalagem": "PET 1,5L"
  },
  "24304": {
    "sku": "24304",
    "descricao": "TODDYNHO 200ML TETRA PAK 200 ML CX C/27",
    "unitPrice": 2.06,
    "unitHl": 0.00185,
    "boxPrice": 55.56,
    "fatorSku": 27,
    "fatorHl": 0.05,
    "grupo": "MARKETPLACE",
    "embalagem": "CAIXA"
  },
  "24306": {
    "sku": "24306",
    "descricao": "RED BULL MELANCIA LATA 250ML FOUR PACK NPAL",
    "unitPrice": 5.96,
    "unitHl": 0.0025,
    "boxPrice": 23.86,
    "fatorSku": 4,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "LATA 250ML"
  },
  "24408": {
    "sku": "24408",
    "descricao": "QUINTA DO MORGADO VINHO TINTO SECO GFA VD 750 ML",
    "unitPrice": 13.77,
    "unitHl": 0.01,
    "boxPrice": 13.77,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VINHO"
  },
  "24409": {
    "sku": "24409",
    "descricao": "QUINTA DO MORGADO VINHO TINTO SUAVE GFA VD 750 ML",
    "unitPrice": 14.24,
    "unitHl": 0.01,
    "boxPrice": 14.24,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VINHO"
  },
  "24410": {
    "sku": "24410",
    "descricao": "QUINTA DO MORGADO VINHO BRANCO SUAVE GFA VD 750 ML",
    "unitPrice": 16,
    "unitHl": 0.01,
    "boxPrice": 16,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VINHO"
  },
  "24411": {
    "sku": "24411",
    "descricao": "QUINTA DO MORGADO VINHO BRANCO SECO GFA VD 750 ML",
    "unitPrice": 13.77,
    "unitHl": 0.01,
    "boxPrice": 13.77,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "24479": {
    "sku": "24479",
    "descricao": "BOHEMIA LONG NECK 330ML SIX-PACK SHRINK C/4",
    "unitPrice": 3.27,
    "unitHl": 0.0035,
    "boxPrice": 78.42,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "24486": {
    "sku": "24486",
    "descricao": "GALLO AZEITE OLIVA EX. VIR. GFA VDR 500ML",
    "unitPrice": 29.97,
    "unitHl": 0.01,
    "boxPrice": 29.97,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA 500 ML"
  },
  "24488": {
    "sku": "24488",
    "descricao": "GALLO AZEITE OLIVA EX. VIR. GFA VDR 250ML",
    "unitPrice": 17.21,
    "unitHl": 0.0035,
    "boxPrice": 17.21,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA 250 ML"
  },
  "24604": {
    "sku": "24604",
    "descricao": "MINALBA AGUA PREMIUM C/GAS GFA VDR 300ML CX/12",
    "unitPrice": 4.73,
    "unitHl": 0.0035,
    "boxPrice": 56.7,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "24609": {
    "sku": "24609",
    "descricao": "MINALBA AGUA PREMIUM S/GAS GFA VDR 300ML CX/12",
    "unitPrice": 4.08,
    "unitHl": 0.00333,
    "boxPrice": 49,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "VD 300ML"
  },
  "25151": {
    "sku": "25151",
    "descricao": "OLD PARR WHISKY GFA VDR 1L",
    "unitPrice": 108.92,
    "unitHl": 0.01,
    "boxPrice": 108.92,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA WHISKY"
  },
  "25160": {
    "sku": "25160",
    "descricao": "BLACK & WHITE WHISKY GFA VDR 1L",
    "unitPrice": 53,
    "unitHl": 0.01,
    "boxPrice": 53,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA WHISKY"
  },
  "25174": {
    "sku": "25174",
    "descricao": "51 ICE BALADA GARRAFA VD 275ML CX C24",
    "unitPrice": 4.83,
    "unitHl": 0.0035,
    "boxPrice": 116,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "25176": {
    "sku": "25176",
    "descricao": "51 ICE FRUIT MIX MORANGO + LARANJA GARRAFA VD 275ML CX C24",
    "unitPrice": 4.83,
    "unitHl": 0.0035,
    "boxPrice": 116,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "25178": {
    "sku": "25178",
    "descricao": "51 ICE LIMAO GARRAFA VD 275ML CX C24",
    "unitPrice": 4.19,
    "unitHl": 0.0025,
    "boxPrice": 100.48,
    "fatorSku": 24,
    "fatorHl": 0.06,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VODKA"
  },
  "25194": {
    "sku": "25194",
    "descricao": "CACHACA 51 LT 350ML CX C/12",
    "unitPrice": 2.48,
    "unitHl": 0.01,
    "boxPrice": 29.82,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "MARKETPLACE",
    "embalagem": "LATA 350ML"
  },
  "25220": {
    "sku": "25220",
    "descricao": "CACHACA 51 PIRASS OURO DESCARTAVEL GFA DE VDRO 965ML",
    "unitPrice": 12.3,
    "unitHl": 0.01,
    "boxPrice": 12.3,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "25303": {
    "sku": "25303",
    "descricao": "GARRAFEIRA PL. PRETO BEES 1 UN P/24 GFA 600ML",
    "unitPrice": 31.16,
    "unitHl": 0.01,
    "boxPrice": 31.16,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GARRAFEIRA"
  },
  "25329": {
    "sku": "25329",
    "descricao": "SALTON ESPUMANTE BRUT GFA VD 750 ML",
    "unitPrice": 40.18,
    "unitHl": 0.01,
    "boxPrice": 40.18,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA ESPUMANTE"
  },
  "25335": {
    "sku": "25335",
    "descricao": "SALTON ESPUMANTE BRUT ROSE GFA VD 750 ML",
    "unitPrice": 40.18,
    "unitHl": 0.01,
    "boxPrice": 40.18,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA ESPUMANTE"
  },
  "25347": {
    "sku": "25347",
    "descricao": "SALTON ESPUMANTE CLASSIC MOSCATEL GFA VD 750 ML",
    "unitPrice": 40.18,
    "unitHl": 0.01,
    "boxPrice": 40.18,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA ESPUMANTE"
  },
  "25429": {
    "sku": "25429",
    "descricao": "MATUTA CACHACA CRISTAL GARRAFA VIDRO 1 L",
    "unitPrice": 21.92,
    "unitHl": 0.01,
    "boxPrice": 21.92,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA CACHAÇA"
  },
  "25430": {
    "sku": "25430",
    "descricao": "MATUTA CACHACA UMBURANA GARRAFA VIDRO 1 L",
    "unitPrice": 25.28,
    "unitHl": 0.01,
    "boxPrice": 25.28,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA CACHAÇA"
  },
  "25434": {
    "sku": "25434",
    "descricao": "MATUTA CACHACA MEL E LIMAO GARRAFA VIDRO 1 L",
    "unitPrice": 42.8,
    "unitHl": 0.01,
    "boxPrice": 42.8,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "25546": {
    "sku": "25546",
    "descricao": "GARRAFEIRA PL. AL. LAT. AB. PRETA BEES 1 UN P/ 23 GFA 300ML",
    "unitPrice": 25,
    "unitHl": 0.0035,
    "boxPrice": 25,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "GARRAFEIRA"
  },
  "25700": {
    "sku": "25700",
    "descricao": "FUSION PET 2L SHRINK C/6",
    "unitPrice": 5.17,
    "unitHl": 0.02,
    "boxPrice": 31.02,
    "fatorSku": 6,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 2L"
  },
  "25837": {
    "sku": "25837",
    "descricao": "SPATEN N LT 473ML CX CARTAO C/12",
    "unitPrice": 7.16,
    "unitHl": 0.005,
    "boxPrice": 85.9,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "26037": {
    "sku": "26037",
    "descricao": "MONTILLA CARTA CRISTAL GFA VDR 1L",
    "unitPrice": 22.97,
    "unitHl": 0.01,
    "boxPrice": 22.97,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA RUM"
  },
  "26099": {
    "sku": "26099",
    "descricao": "TRIDENT XFRESH INTENSE ENVELOPE 8G CX21_",
    "unitPrice": 37.9,
    "unitHl": 0.0035,
    "boxPrice": 37.9,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "26462": {
    "sku": "26462",
    "descricao": "ORIGINAL LT 473ML CX CARTAO C/12",
    "unitPrice": 3.47,
    "unitHl": 0.005,
    "boxPrice": 41.67,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "26607": {
    "sku": "26607",
    "descricao": "RED BULL PITAYA LATA 250ML FOUR PACK NPAL",
    "unitPrice": 25.01,
    "unitHl": 0.0035,
    "boxPrice": 25.01,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "27001": {
    "sku": "27001",
    "descricao": "GORDONS GIN DRY GFA VD 750 ML",
    "unitPrice": 54.9,
    "unitHl": 0.01,
    "boxPrice": 54.9,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "27177": {
    "sku": "27177",
    "descricao": "HALLS MENTOL ENVELOPE 28G CX C/21",
    "unitPrice": 1.04,
    "unitHl": 0.00048,
    "boxPrice": 21.85,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "ENVELOPE"
  },
  "27179": {
    "sku": "27179",
    "descricao": "HALLS MORANGO ENVELOPE 28G CX C/21",
    "unitPrice": 1.04,
    "unitHl": 0.0035,
    "boxPrice": 21.85,
    "fatorSku": 21,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "27522": {
    "sku": "27522",
    "descricao": "CACHACA 51 PIRASSUNUNGA GFA VD 965ML RET CX/12",
    "unitPrice": 5.36,
    "unitHl": 0.00917,
    "boxPrice": 64.28,
    "fatorSku": 12,
    "fatorHl": 0.11,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA CACHAÇA"
  },
  "27559": {
    "sku": "27559",
    "descricao": "CACHACA 51 PIRASSUNUNGA OURO GFA VD 965ML RET CX/12",
    "unitPrice": 7.47,
    "unitHl": 0.00917,
    "boxPrice": 89.64,
    "fatorSku": 12,
    "fatorHl": 0.11,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA CACHAÇA"
  },
  "27560": {
    "sku": "27560",
    "descricao": "CASILLERO DEL DIABLO VINH RESERVA MALBEC GFA VD 750 ML",
    "unitPrice": 51.57,
    "unitHl": 0.01,
    "boxPrice": 51.57,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VINHO"
  },
  "27562": {
    "sku": "27562",
    "descricao": "CASILLERO DEL DIABLO VINH RESERVA MERLOT GFA VD 750 ML",
    "unitPrice": 51.57,
    "unitHl": 0.01,
    "boxPrice": 51.57,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VINHO"
  },
  "27566": {
    "sku": "27566",
    "descricao": "RESERVADO VINHO SWEET RED GFA VD 750 ML",
    "unitPrice": 28.81,
    "unitHl": 0.01,
    "boxPrice": 28.81,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VINHO"
  },
  "27613": {
    "sku": "27613",
    "descricao": "CASILLERO DEL DIABLO VNH RSV CABER SAUVG GFA VD 750 ML",
    "unitPrice": 51.57,
    "unitHl": 0.01,
    "boxPrice": 51.57,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VINHO"
  },
  "27624": {
    "sku": "27624",
    "descricao": "RESERVADO VINHO MALBEC GFA VD 750 ML",
    "unitPrice": 28.81,
    "unitHl": 0.01,
    "boxPrice": 28.81,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "27686": {
    "sku": "27686",
    "descricao": "MIKES HARD LEMONADE N LONG NECK 275ML SIX PACK SH C/4",
    "unitPrice": 5.27,
    "unitHl": 0.0035,
    "boxPrice": 126.46,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "MATCH",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "27704": {
    "sku": "27704",
    "descricao": "MIKES HARD LEMONADE PITAIA N LONG NECK 275ML SIX PACK SH C/4",
    "unitPrice": 5.28,
    "unitHl": 0.0035,
    "boxPrice": 126.76,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "MATCH",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "27866": {
    "sku": "27866",
    "descricao": "CORONA CERO SUNBREW N LONG NECK 330 ML SP BASKET CX C4",
    "unitPrice": 4.99,
    "unitHl": 0.00333,
    "boxPrice": 119.8,
    "fatorSku": 24,
    "fatorHl": 0.08,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "28137": {
    "sku": "28137",
    "descricao": "SKOL BEATS CAIPIRINHA LT 269ML CX CARTAO C/8 NPAL",
    "unitPrice": 4.07,
    "unitHl": 0.0035,
    "boxPrice": 32.58,
    "fatorSku": 8,
    "fatorHl": 0,
    "grupo": "MATCH",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "28203": {
    "sku": "28203",
    "descricao": "BUBBALOO MORANGO DISPLAY 300G",
    "unitPrice": 11.31,
    "unitHl": 0.0035,
    "boxPrice": 11.31,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "28204": {
    "sku": "28204",
    "descricao": "BUBBALOO UVA DISPLAY 300G",
    "unitPrice": 10.99,
    "unitHl": 0.0035,
    "boxPrice": 10.99,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "29197": {
    "sku": "29197",
    "descricao": "TANG REFRESCO EM PO LIMAO PCT 18G DP C/18",
    "unitPrice": 0.74,
    "unitHl": 0.00056,
    "boxPrice": 13.38,
    "fatorSku": 18,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "CAIXA"
  },
  "29199": {
    "sku": "29199",
    "descricao": "TANG REFRESCO EM PO LARANJA PCT 18G DP C/18",
    "unitPrice": 0.74,
    "unitHl": 0.00056,
    "boxPrice": 13.37,
    "fatorSku": 18,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "CAIXA"
  },
  "29201": {
    "sku": "29201",
    "descricao": "TANG REFRESCO EM PO ABACAXI PCT 18G DP C/18",
    "unitPrice": 0.74,
    "unitHl": 0.00056,
    "boxPrice": 13.38,
    "fatorSku": 18,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "CAIXA"
  },
  "29207": {
    "sku": "29207",
    "descricao": "TANG REFRESCO EM PO MORANGO PCT 18G DP C/18",
    "unitPrice": 0.74,
    "unitHl": 0.00056,
    "boxPrice": 13.37,
    "fatorSku": 18,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "CAIXA"
  },
  "29209": {
    "sku": "29209",
    "descricao": "TANG REFRESCO EM PO MARACUJA PCT 18G DP C/18",
    "unitPrice": 0.74,
    "unitHl": 0.00056,
    "boxPrice": 13.37,
    "fatorSku": 18,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "CAIXA"
  },
  "29215": {
    "sku": "29215",
    "descricao": "TANG REFRESCO EM PO UVA PCT 18G DP C/18",
    "unitPrice": 0.74,
    "unitHl": 0.00056,
    "boxPrice": 13.37,
    "fatorSku": 18,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "CAIXA"
  },
  "29253": {
    "sku": "29253",
    "descricao": "ORIGINAL GFA VD 1L",
    "unitPrice": 5.24,
    "unitHl": 0.01,
    "boxPrice": 62.85,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "CERVEJA",
    "embalagem": "LITRÃO"
  },
  "29323": {
    "sku": "29323",
    "descricao": "INDAIA BEB MISTA CITRUS LARANJA GFA PET 330ML FD C/12",
    "unitPrice": 1.57,
    "unitHl": 0.00333,
    "boxPrice": 18.88,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "PET 330ML"
  },
  "29326": {
    "sku": "29326",
    "descricao": "INDAIA BEB MISTA CITRUS LARANJA GFA PET 1,5L FD C/6",
    "unitPrice": 4.72,
    "unitHl": 0.015,
    "boxPrice": 28.3,
    "fatorSku": 6,
    "fatorHl": 0.09,
    "grupo": "NAB",
    "embalagem": "PET 1,5L"
  },
  "29416": {
    "sku": "29416",
    "descricao": "CERVEGELA BUDWEISER 1 UN P/ GF 600ML CX3",
    "unitPrice": 17.26,
    "unitHl": 0.00667,
    "boxPrice": 51.77,
    "fatorSku": 3,
    "fatorHl": 0.02,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "29418": {
    "sku": "29418",
    "descricao": "CERVEGELA BUDWEISER LITRAO 1 UN P/ GF 1L PACK C3",
    "unitPrice": 17.26,
    "unitHl": 0.01,
    "boxPrice": 51.77,
    "fatorSku": 3,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "CERVEGELA"
  },
  "29485": {
    "sku": "29485",
    "descricao": "SKOL BEATS CAIPIRINHA LONG NECK 269ML SIX-PACK SH C/4",
    "unitPrice": 5.11,
    "unitHl": 0.0035,
    "boxPrice": 122.65,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "MATCH",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "29504": {
    "sku": "29504",
    "descricao": "OLD PARR WHISKY 12 ANOS GFA VD 750 ML",
    "unitPrice": 98.9,
    "unitHl": 0.01,
    "boxPrice": 98.9,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA 750 ML"
  },
  "29505": {
    "sku": "29505",
    "descricao": "CIROC VODKA GFA VD 750 ML",
    "unitPrice": 162.39,
    "unitHl": 0.01,
    "boxPrice": 162.39,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VODKA"
  },
  "29508": {
    "sku": "29508",
    "descricao": "JOHNNIE WALKER WHISKY GOLD LABEL RESERVE GFA VD 750 ML",
    "unitPrice": 201.64,
    "unitHl": 0.01,
    "boxPrice": 201.64,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA WHISKY"
  },
  "29518": {
    "sku": "29518",
    "descricao": "JOHNNIE WALKER WHISKY BLONDE GFA VD 750 ML",
    "unitPrice": 50.61,
    "unitHl": 0.01,
    "boxPrice": 50.61,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "29580": {
    "sku": "29580",
    "descricao": "STELLA ARTOIS PURE GOLD LONG NECK 330ML SP SH C/4",
    "unitPrice": 4.46,
    "unitHl": 0.00333,
    "boxPrice": 106.95,
    "fatorSku": 24,
    "fatorHl": 0.08,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "29733": {
    "sku": "29733",
    "descricao": "HALLS MELANCIA ENVELOPE 28G CX C/21",
    "unitPrice": 0.95,
    "unitHl": 0.00048,
    "boxPrice": 19.97,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY"
  },
  "29845": {
    "sku": "29845",
    "descricao": "PEPSI BLACK PET 1 L SH C/12",
    "unitPrice": 2.87,
    "unitHl": 0.01,
    "boxPrice": 34.44,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "NAB",
    "embalagem": "PET 1L"
  },
  "29891": {
    "sku": "29891",
    "descricao": "ROCKS DRY GIN GARRAFA VIDRO 1 L",
    "unitPrice": 24.32,
    "unitHl": 0.01,
    "boxPrice": 24.32,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "29926": {
    "sku": "29926",
    "descricao": "JOHNNIE WALKER BLACK LABEL WHISKY ICONS GARRAFA VIDRO 1 L",
    "unitPrice": 177.42,
    "unitHl": 0.01,
    "boxPrice": 177.42,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA WHISKY"
  },
  "30045": {
    "sku": "30045",
    "descricao": "RED BULL BR LATA 473ML CX C 12",
    "unitPrice": 8.02,
    "unitHl": 0.005,
    "boxPrice": 96.18,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "LATA 473ML"
  },
  "30132": {
    "sku": "30132",
    "descricao": "VITARELLA BISC MARIA TRADICIONAL PCT 350G CX 24",
    "unitPrice": 70,
    "unitHl": 0.0035,
    "boxPrice": 70,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "30134": {
    "sku": "30134",
    "descricao": "VITARELLA BISC MAIZENA TRADICIONAL PCT 350G CX 24",
    "unitPrice": 70,
    "unitHl": 0.0035,
    "boxPrice": 70,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "30136": {
    "sku": "30136",
    "descricao": "VITARELLA CREAM CRACKER TRADICIONAL PCT 350G CX 24",
    "unitPrice": 89.75,
    "unitHl": 0.0035,
    "boxPrice": 89.75,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "30148": {
    "sku": "30148",
    "descricao": "TRELOSO BISCOITO RECHEADO CHOCOLATE PCT 120G CX/36",
    "unitPrice": 1.48,
    "unitHl": 0.0035,
    "boxPrice": 53.28,
    "fatorSku": 36,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "30151": {
    "sku": "30151",
    "descricao": "TRELOSO RECHEADO BAUNILHA CHOCORESCO PCT 120G CX/36",
    "unitPrice": 1.48,
    "unitHl": 0.0035,
    "boxPrice": 53.28,
    "fatorSku": 36,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "30152": {
    "sku": "30152",
    "descricao": "TRELOSO BISCOITO RECHEADO MORANGO PCT 120G CX/36",
    "unitPrice": 1.48,
    "unitHl": 0.0035,
    "boxPrice": 53.28,
    "fatorSku": 36,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "30220": {
    "sku": "30220",
    "descricao": "PIRAQUE NEWAFER CHOCOLATE PCT PLAST 100G CX/20",
    "unitPrice": 2.53,
    "unitHl": 0.0035,
    "boxPrice": 50.6,
    "fatorSku": 20,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "30440": {
    "sku": "30440",
    "descricao": "ISABELA BISCOITO SABOR LEITE PCT 350G CX 24",
    "unitPrice": 70,
    "unitHl": 0.0035,
    "boxPrice": 70,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "30852": {
    "sku": "30852",
    "descricao": "BUBBALOO BALA TUTTI FRUTI DISPLAY 15G CX/12",
    "unitPrice": 1.17,
    "unitHl": 0.0035,
    "boxPrice": 14,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "30854": {
    "sku": "30854",
    "descricao": "BUBBALOO BALA MIX DISPLAY 15G CX/12",
    "unitPrice": 1.17,
    "unitHl": 0.0035,
    "boxPrice": 14,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "30878": {
    "sku": "30878",
    "descricao": "YPE AMACIANTE TRADICIONAL ACONCHEGO FRASCO PLASTICO 2L",
    "unitPrice": 58.43,
    "unitHl": 0.02,
    "boxPrice": 58.43,
    "fatorSku": 1,
    "fatorHl": 0.02,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "31064": {
    "sku": "31064",
    "descricao": "BUDWEISER LT 269ML SH C 15",
    "unitPrice": 2.25,
    "unitHl": 0.00267,
    "boxPrice": 33.68,
    "fatorSku": 15,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 269ML"
  },
  "31272": {
    "sku": "31272",
    "descricao": "FUSION LT 473ML SH C/12 NPAL",
    "unitPrice": 3.75,
    "unitHl": 0.0035,
    "boxPrice": 45,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "31582": {
    "sku": "31582",
    "descricao": "YPE LAVA LOUCAS LIQUIDO CLEAR FRASCO PLASTICO 500 ML C24",
    "unitPrice": 1.92,
    "unitHl": 0.005,
    "boxPrice": 46.1,
    "fatorSku": 24,
    "fatorHl": 0.12,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "31589": {
    "sku": "31589",
    "descricao": "YPE LAVA LOUCAS LIQUIDO MACA FRASCO PLASTICO 500 ML C24",
    "unitPrice": 1.92,
    "unitHl": 0.005,
    "boxPrice": 46.1,
    "fatorSku": 24,
    "fatorHl": 0.12,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "31667": {
    "sku": "31667",
    "descricao": "YPE LAVA LOUCAS LIQUIDO NEUTRO FRASCO PLASTICO 500 ML C24",
    "unitPrice": 1.92,
    "unitHl": 0.005,
    "boxPrice": 46.1,
    "fatorSku": 24,
    "fatorHl": 0.12,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "31669": {
    "sku": "31669",
    "descricao": "YPE LAVA LOUCAS LIQUIDO COCO FRASCO PLASTICO 500 ML C24",
    "unitPrice": 1.92,
    "unitHl": 0.005,
    "boxPrice": 46.1,
    "fatorSku": 24,
    "fatorHl": 0.12,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "31674": {
    "sku": "31674",
    "descricao": "YPE AMACIANTE INTENSO FRASCO PLASTICO 2 L CX6",
    "unitPrice": 47.68,
    "unitHl": 0.02,
    "boxPrice": 47.68,
    "fatorSku": 1,
    "fatorHl": 0.02,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "31678": {
    "sku": "31678",
    "descricao": "YPE AMACIANTE CONC BLUE GARDEN FRASCO PLAST 1 L CX12",
    "unitPrice": 13.83,
    "unitHl": 0.01,
    "boxPrice": 166,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "31708": {
    "sku": "31708",
    "descricao": "YPE AMACIANTE CONC BLUE GARDEN FRASCO PLAST 500ML CX/12",
    "unitPrice": 6.98,
    "unitHl": 0.005,
    "boxPrice": 83.8,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "31713": {
    "sku": "31713",
    "descricao": "YPE AMACIANTE CONC PINK FRASCO PLAST 500ML CX/12",
    "unitPrice": 7.18,
    "unitHl": 0.005,
    "boxPrice": 86.21,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "31766": {
    "sku": "31766",
    "descricao": "YPE ASSOLAN ESPONJA LA ACO PCT 45 G CX200",
    "unitPrice": 250.35,
    "unitHl": 0.0035,
    "boxPrice": 250.35,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "31789": {
    "sku": "31789",
    "descricao": "YPE AMACIANTE TRADICIONAL ACONCHEGO FRASCO PLASTICO 2 L CX6",
    "unitPrice": 47.68,
    "unitHl": 0.02,
    "boxPrice": 47.68,
    "fatorSku": 1,
    "fatorHl": 0.02,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "31795": {
    "sku": "31795",
    "descricao": "BRUTAL FRUIT LONG NECK 275ML SIX PACK SH C 2",
    "unitPrice": 8.65,
    "unitHl": 0.0035,
    "boxPrice": 103.8,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "MATCH",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "31805": {
    "sku": "31805",
    "descricao": "YPE TIXAN LAVA ROUPAS LIQ PRIMAVERA FRASCO PLAST 1 L CX12",
    "unitPrice": 10.05,
    "unitHl": 0.01,
    "boxPrice": 120.6,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "31807": {
    "sku": "31807",
    "descricao": "YPE LAVA ROUPAS LIQ POWER ACT FRASCO PLAST 1",
    "unitPrice": 12.08,
    "unitHl": 0.01,
    "boxPrice": 144.96,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "32036": {
    "sku": "32036",
    "descricao": "PIRAQUE MAIZENA PCT PLAST 175G C48",
    "unitPrice": 94.08,
    "unitHl": 0.0035,
    "boxPrice": 94.08,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32043": {
    "sku": "32043",
    "descricao": "YPE SABAO BARRA ALOE VERA PCT PL 900G C10",
    "unitPrice": 11.49,
    "unitHl": 0.0035,
    "boxPrice": 11.49,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32045": {
    "sku": "32045",
    "descricao": "YPE SABAO BARRA FRESH PCT PL 900G C10",
    "unitPrice": 10.08,
    "unitHl": 0.0035,
    "boxPrice": 10.08,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32067": {
    "sku": "32067",
    "descricao": "GATORADE BERRY BLUE PET 500ML SIXPACK",
    "unitPrice": 3.79,
    "unitHl": 0.005,
    "boxPrice": 22.72,
    "fatorSku": 6,
    "fatorHl": 0.03,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "32126": {
    "sku": "32126",
    "descricao": "AMINDUS GRELHADITOS AMEND. TOR. S/ PELE PCT 24G FD C/60",
    "unitPrice": 0.44,
    "unitHl": 0.00017,
    "boxPrice": 26.53,
    "fatorSku": 60,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "FARDO"
  },
  "32128": {
    "sku": "32128",
    "descricao": "PACOQUITA QUADRADA PCT PL 18G DSP C/24",
    "unitPrice": 0.42,
    "unitHl": 0.0035,
    "boxPrice": 10.01,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32131": {
    "sku": "32131",
    "descricao": "PACOQUITA ROLHA EMBALADA PCT 15G PT/50",
    "unitPrice": 18.35,
    "unitHl": 0.0035,
    "boxPrice": 18.35,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32155": {
    "sku": "32155",
    "descricao": "PACOQUITA ZERO QUADRADA PCT PL 18G DSP C/24",
    "unitPrice": 0.89,
    "unitHl": 0.0035,
    "boxPrice": 21.25,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32175": {
    "sku": "32175",
    "descricao": "CROKISSIMO AMEND CROC LEV SALGADO PCT 24G FD/36",
    "unitPrice": 127.38,
    "unitHl": 0.0035,
    "boxPrice": 127.38,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32349": {
    "sku": "32349",
    "descricao": "BEATS TROPICAL LT 269ML CX CARTAO C/8 NPAL",
    "unitPrice": 4.02,
    "unitHl": 0.0025,
    "boxPrice": 32.12,
    "fatorSku": 8,
    "fatorHl": 0.02,
    "grupo": "MATCH",
    "embalagem": "LATA 269ML"
  },
  "32361": {
    "sku": "32361",
    "descricao": "BEATS TROPICAL LONG NECK 269ML SIX-PACK SH C/4",
    "unitPrice": 5.14,
    "unitHl": 0.0025,
    "boxPrice": 123.34,
    "fatorSku": 24,
    "fatorHl": 0.06,
    "grupo": "MATCH",
    "embalagem": "LONG NECK"
  },
  "32425": {
    "sku": "32425",
    "descricao": "FUSION MELANCIA LT 473ML SH C/12 NPAL",
    "unitPrice": 4.29,
    "unitHl": 0.0035,
    "boxPrice": 51.48,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32427": {
    "sku": "32427",
    "descricao": "FUSION TROPICAL LT 473ML SH C/12 NPAL",
    "unitPrice": 3.75,
    "unitHl": 0.0035,
    "boxPrice": 45,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32473": {
    "sku": "32473",
    "descricao": "STELLA ARTOIS PURE GOLD LT 473ML CX CARTAO C/12",
    "unitPrice": 5.07,
    "unitHl": 0.0035,
    "boxPrice": 60.82,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32500": {
    "sku": "32500",
    "descricao": "STELLA ARTOIS PURE GOLD LT SLEEK 350ML C 8 CX CARTAO",
    "unitPrice": 3.79,
    "unitHl": 0.00375,
    "boxPrice": 30.3,
    "fatorSku": 8,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "32526": {
    "sku": "32526",
    "descricao": "PETROPOLIS AGUA MIN SEM GAS GARRAFA PET 500MLCX C12",
    "unitPrice": 0.88,
    "unitHl": 0.005,
    "boxPrice": 10.58,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "32528": {
    "sku": "32528",
    "descricao": "PETROPOLIS AGUA MIN COM GAS GARRAFA PET 500MLCX C12",
    "unitPrice": 1.01,
    "unitHl": 0.005,
    "boxPrice": 12.17,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "32538": {
    "sku": "32538",
    "descricao": "PERGOLA SEL. VINHO TINTO SUAVE GARRAFA VIDRO 1 L",
    "unitPrice": 21.5,
    "unitHl": 0.01,
    "boxPrice": 21.5,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VINHO"
  },
  "32644": {
    "sku": "32644",
    "descricao": "BUBBALOO UVA DISPLAY 5G CX/60",
    "unitPrice": 0.21,
    "unitHl": 0.00017,
    "boxPrice": 12.44,
    "fatorSku": 60,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY 5G"
  },
  "32646": {
    "sku": "32646",
    "descricao": "BUBBALOO TUTTI FRUTTI DISPLAY 5G CX/60",
    "unitPrice": 0.21,
    "unitHl": 0.0035,
    "boxPrice": 12.44,
    "fatorSku": 60,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32648": {
    "sku": "32648",
    "descricao": "BUBBALOO MORANGO DISPLAY 5G CX/60",
    "unitPrice": 0.21,
    "unitHl": 0.00017,
    "boxPrice": 12.44,
    "fatorSku": 60,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY 5G"
  },
  "32749": {
    "sku": "32749",
    "descricao": "CORONA EXTRA LONG NECK 330ML",
    "unitPrice": 4.92,
    "unitHl": 0.00333,
    "boxPrice": 118.01,
    "fatorSku": 24,
    "fatorHl": 0.08,
    "grupo": "CERVEJA",
    "embalagem": "LONG NECK"
  },
  "32754": {
    "sku": "32754",
    "descricao": "PIRAQUE BISC LEITE MALTADO BLACK PCT PLAST 132G C50",
    "unitPrice": 159,
    "unitHl": 0.0035,
    "boxPrice": 159,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32785": {
    "sku": "32785",
    "descricao": "CORONA EXTRA N ONE WAY 600ML GARRAFEIRA C/24",
    "unitPrice": 8.77,
    "unitHl": 0.00042,
    "boxPrice": 210.48,
    "fatorSku": 24,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "32969": {
    "sku": "32969",
    "descricao": "RED BULL SUMMER MORANGO E PESSEGO LATA 250ML FOUR PACK NPAL",
    "unitPrice": 7.99,
    "unitHl": 0.0025,
    "boxPrice": 31.96,
    "fatorSku": 4,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "LATA 250ML"
  },
  "33042": {
    "sku": "33042",
    "descricao": "YPE LAVA LOUCAS LIQUIDO LIMAO FRASCO PLASTICO 500 ML C24",
    "unitPrice": 46.93,
    "unitHl": 0.01,
    "boxPrice": 46.93,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "33046": {
    "sku": "33046",
    "descricao": "YPE TIXAN LAVA ROUPAS PO MACIEZ SACHE PLASTICO 800G CX20",
    "unitPrice": 8.42,
    "unitHl": 0.008,
    "boxPrice": 168.4,
    "fatorSku": 20,
    "fatorHl": 0.16,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "33048": {
    "sku": "33048",
    "descricao": "YPE TIXAN LAVA ROUPAS PO PRIMAV SACHE PLASTICO 800G CX20",
    "unitPrice": 8.42,
    "unitHl": 0.008,
    "boxPrice": 168.4,
    "fatorSku": 20,
    "fatorHl": 0.16,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "33061": {
    "sku": "33061",
    "descricao": "YPE TIXAN LAVA ROUPAS PO MACIEZ SACHE 400G CX C/24",
    "unitPrice": 3.75,
    "unitHl": 0.00417,
    "boxPrice": 90.06,
    "fatorSku": 24,
    "fatorHl": 0.1,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "33066": {
    "sku": "33066",
    "descricao": "YPE TIXAN LAVA ROUPAS PO PRIMAV SACHE 400G CX C/24",
    "unitPrice": 3.75,
    "unitHl": 0.0035,
    "boxPrice": 90.06,
    "fatorSku": 24,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "33109": {
    "sku": "33109",
    "descricao": "51 OURO AGUARDENTE COMPOSTA LT 350ML CX C/12",
    "unitPrice": 4.17,
    "unitHl": 0.00333,
    "boxPrice": 50.02,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 350ML"
  },
  "33212": {
    "sku": "33212",
    "descricao": "SKOL BEATS SENSES PET 1 L SH C/06",
    "unitPrice": 10,
    "unitHl": 0.01,
    "boxPrice": 60,
    "fatorSku": 6,
    "fatorHl": 0.06,
    "grupo": "MATCH",
    "embalagem": "PET 1L"
  },
  "33239": {
    "sku": "33239",
    "descricao": "PIRAQUE RECH MORANGO PCT 160G CX C/30",
    "unitPrice": 2.55,
    "unitHl": 0.0035,
    "boxPrice": 76.4,
    "fatorSku": 30,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "33250": {
    "sku": "33250",
    "descricao": "PIRAQUE RECH CHOCOLATE PCT 160G CX C/30",
    "unitPrice": 2.55,
    "unitHl": 0.0035,
    "boxPrice": 76.4,
    "fatorSku": 30,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "33251": {
    "sku": "33251",
    "descricao": "PIRAQUE RECH PRETTY PCT 160G CX C/30",
    "unitPrice": 2.55,
    "unitHl": 0.0035,
    "boxPrice": 76.4,
    "fatorSku": 30,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "33252": {
    "sku": "33252",
    "descricao": "PIRAQUE RECH LIMAO PCT 160G CX C/30",
    "unitPrice": 2.55,
    "unitHl": 0.0035,
    "boxPrice": 76.4,
    "fatorSku": 30,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "33318": {
    "sku": "33318",
    "descricao": "VITARELLA NIKITO REC CHOC C MORANGO PCT 120G CX/36",
    "unitPrice": 1.94,
    "unitHl": 0.0035,
    "boxPrice": 70,
    "fatorSku": 36,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "33734": {
    "sku": "33734",
    "descricao": "BEATS RED MIX LT 269ML SH C/8",
    "unitPrice": 4.41,
    "unitHl": 0.0025,
    "boxPrice": 35.29,
    "fatorSku": 8,
    "fatorHl": 0.02,
    "grupo": "MATCH",
    "embalagem": "LATA 269ML"
  },
  "33738": {
    "sku": "33738",
    "descricao": "BEATS RED MIX LONG NECK 269ML SIX-PACK SH C/2",
    "unitPrice": 5.6,
    "unitHl": 0.0025,
    "boxPrice": 67.23,
    "fatorSku": 12,
    "fatorHl": 0.03,
    "grupo": "MATCH",
    "embalagem": "LONG NECK"
  },
  "33818": {
    "sku": "33818",
    "descricao": "ORIGINAL LATA 350ML SHRINK C/12 MULTPACK",
    "unitPrice": 3.13,
    "unitHl": 0.00333,
    "boxPrice": 37.58,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "33820": {
    "sku": "33820",
    "descricao": "BRAHMA CHOPP LATA 350ML SH C/12 NPAL MULTIPACK .",
    "unitPrice": 2.91,
    "unitHl": 0.00333,
    "boxPrice": 34.9,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "33854": {
    "sku": "33854",
    "descricao": "YPE TIXAN LAVA ROUPAS LIQ PRIMAVERA FRASCO PLAST 1L",
    "unitPrice": 120.6,
    "unitHl": 0.01,
    "boxPrice": 120.6,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "33857": {
    "sku": "33857",
    "descricao": "STELLA ARTOIS PURE GOLD 600ML",
    "unitPrice": 9,
    "unitHl": 0.00583,
    "boxPrice": 108,
    "fatorSku": 12,
    "fatorHl": 0.07,
    "grupo": "CERVEJA",
    "embalagem": "INTEIRA"
  },
  "34027": {
    "sku": "34027",
    "descricao": "GUARANA CHP ANTARCTICA LATA 350ML SH C/12 NPAL MULTIPACK",
    "unitPrice": 2.54,
    "unitHl": 0.00333,
    "boxPrice": 30.48,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "34263": {
    "sku": "34263",
    "descricao": "CORONA CERO SUNBREW N LT SLEEK 350ML C 8 CX CARTAO",
    "unitPrice": 3.53,
    "unitHl": 0.00375,
    "boxPrice": 28.21,
    "fatorSku": 8,
    "fatorHl": 0.03,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "34296": {
    "sku": "34296",
    "descricao": "TRIDENT CANELA ENVELOPE 8G CX C/21",
    "unitPrice": 1.49,
    "unitHl": 0.00048,
    "boxPrice": 31.23,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY"
  },
  "34298": {
    "sku": "34298",
    "descricao": "TRIDENT MORANGO ENVELOPE 8G CX C/21",
    "unitPrice": 1.49,
    "unitHl": 0.00048,
    "boxPrice": 31.23,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY"
  },
  "34320": {
    "sku": "34320",
    "descricao": "GUARANA ANTARCTICA ZERO LATA 350ML SH C/12 NPAL MULTIPACK",
    "unitPrice": 2.99,
    "unitHl": 0.00333,
    "boxPrice": 35.88,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 355ML"
  },
  "34325": {
    "sku": "34325",
    "descricao": "ELEVE AGUA MIN C GAS GFA PET 510ML FD C/12",
    "unitPrice": 1.49,
    "unitHl": 0.005,
    "boxPrice": 17.9,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "PET 510ML"
  },
  "34410": {
    "sku": "34410",
    "descricao": "HALLS UVA VERDE ENVELOPE 28G CX C/21",
    "unitPrice": 1.47,
    "unitHl": 0.00048,
    "boxPrice": 30.9,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY"
  },
  "34420": {
    "sku": "34420",
    "descricao": "RED BULL SUMMER MARACUJA E MELAO LATA 250ML FOUR PACK NPAL",
    "unitPrice": 7.29,
    "unitHl": 0.0025,
    "boxPrice": 29.16,
    "fatorSku": 4,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "LATA 250ML"
  },
  "34429": {
    "sku": "34429",
    "descricao": "RED BULL SUGAR FREE AMORA LATA 250ML FOUR PACK NPAL",
    "unitPrice": 7.99,
    "unitHl": 0.0025,
    "boxPrice": 31.96,
    "fatorSku": 4,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "LATA 250ML"
  },
  "34432": {
    "sku": "34432",
    "descricao": "RED BULL TROPICAL BR LATA 473ML CX C 12",
    "unitPrice": 11.7,
    "unitHl": 0.0035,
    "boxPrice": 140.44,
    "fatorSku": 12,
    "fatorHl": 0,
    "grupo": "NAB",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "34454": {
    "sku": "34454",
    "descricao": "H2OH LIMONETO LT SLEEK 350ML SH C 12",
    "unitPrice": 2.8,
    "unitHl": 0.00333,
    "boxPrice": 33.6,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "NAB",
    "embalagem": "LATA 350ML"
  },
  "34475": {
    "sku": "34475",
    "descricao": "ELEVE AGUA MIN S GAS GFA PET 510ML FD C/12",
    "unitPrice": 0.84,
    "unitHl": 0.005,
    "boxPrice": 10.04,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "PET 510ML"
  },
  "34479": {
    "sku": "34479",
    "descricao": "ELEVE AGUA MIN S GAS PET 1,5 SHRINK C/6",
    "unitPrice": 2.24,
    "unitHl": 0.015,
    "boxPrice": 13.42,
    "fatorSku": 6,
    "fatorHl": 0.09,
    "grupo": "NAB",
    "embalagem": "PET 1,5L"
  },
  "34527": {
    "sku": "34527",
    "descricao": "YPE AMACIANTE TRADICIONAL ACONCHEGO FRASCO PLASTICO 500 ML C",
    "unitPrice": 62.51,
    "unitHl": 0.01,
    "boxPrice": 62.51,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "34529": {
    "sku": "34529",
    "descricao": "YPE TIXAN LAVA ROUPAS LIQ MACIEZ FRASCO PLAST 1L CX12",
    "unitPrice": 10.05,
    "unitHl": 0.01,
    "boxPrice": 120.6,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "MARKETPLACE",
    "embalagem": "LIMPEZA"
  },
  "34530": {
    "sku": "34530",
    "descricao": "YPE AMACIANTE TRADICIONAL ACONCHEGO FRASCO PLAST 500ML",
    "unitPrice": 75.33,
    "unitHl": 0.01,
    "boxPrice": 75.33,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "34608": {
    "sku": "34608",
    "descricao": "SKOL LATA 350ML SH C/12 NPAL MULTIPACK",
    "unitPrice": 3.25,
    "unitHl": 0.00333,
    "boxPrice": 39,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 355ML"
  },
  "34681": {
    "sku": "34681",
    "descricao": "PIRAQUE RECH PRETTY PCT 76G CX40",
    "unitPrice": 65,
    "unitHl": 0.0035,
    "boxPrice": 65,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "34683": {
    "sku": "34683",
    "descricao": "PIRAQUE RECH LIMAO PCT 76G CX40",
    "unitPrice": 90,
    "unitHl": 0.0035,
    "boxPrice": 90,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "34685": {
    "sku": "34685",
    "descricao": "PIRAQUE RECH CHOCOLATE PCT 76G CX40",
    "unitPrice": 90,
    "unitHl": 0.0035,
    "boxPrice": 90,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "34687": {
    "sku": "34687",
    "descricao": "PIRAQUE RECH MORANGO PCT 76G CX40",
    "unitPrice": 65,
    "unitHl": 0.0035,
    "boxPrice": 65,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "34770": {
    "sku": "34770",
    "descricao": "RED BULL SUGAR FREE POMELO LATA 250ML FOUR PACK NPAL",
    "unitPrice": 7.99,
    "unitHl": 0.0025,
    "boxPrice": 31.96,
    "fatorSku": 4,
    "fatorHl": 0.01,
    "grupo": "NAB",
    "embalagem": "LATA 250ML"
  },
  "34890": {
    "sku": "34890",
    "descricao": "YPE ASSOLAN ESPONJA LA ACO CX PAPEL CART 1,6KG LEVE 20 PAG 1",
    "unitPrice": 25,
    "unitHl": 0.0035,
    "boxPrice": 25,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "34918": {
    "sku": "34918",
    "descricao": "DIAS DAVILA AGUA MINERAL S GAS GFA PET 500ML PACK C/12",
    "unitPrice": 1.63,
    "unitHl": 0.005,
    "boxPrice": 19.54,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "34920": {
    "sku": "34920",
    "descricao": "DIAS DAVILA AGUA MINERAL S GAS GFA PET 1,5L FD C/6",
    "unitPrice": 3.35,
    "unitHl": 0.015,
    "boxPrice": 20.12,
    "fatorSku": 6,
    "fatorHl": 0.09,
    "grupo": "NAB",
    "embalagem": "PET 1,5L"
  },
  "34923": {
    "sku": "34923",
    "descricao": "DIAS DAVILA AGUA MINERAL C GAS GFA PET 500ML PACK C/12",
    "unitPrice": 1.63,
    "unitHl": 0.005,
    "boxPrice": 19.59,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "NAB",
    "embalagem": "PET 500ML"
  },
  "35003": {
    "sku": "35003",
    "descricao": "TRIDENT XFRESH 5S PRETO CEREJA ENVELOPE 8G CX C/21",
    "unitPrice": 1.62,
    "unitHl": 0.00048,
    "boxPrice": 34.04,
    "fatorSku": 21,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DISPLAY"
  },
  "35012": {
    "sku": "35012",
    "descricao": "MENDORATO PCT 45G DISPLAY C10",
    "unitPrice": 1.4,
    "unitHl": 0.001,
    "boxPrice": 13.95,
    "fatorSku": 10,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "FARDO"
  },
  "35061": {
    "sku": "35061",
    "descricao": "YPE AMACIANTE CONC BLUE GARDEN FRASCO PLAST 500 ML",
    "unitPrice": 83.8,
    "unitHl": 0.01,
    "boxPrice": 83.8,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "35108": {
    "sku": "35108",
    "descricao": "CERVEGELA PLASTICA SPATEN 1 UN P/ GFA 600ML CX3",
    "unitPrice": 51.77,
    "unitHl": 0.01,
    "boxPrice": 51.77,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "35134": {
    "sku": "35134",
    "descricao": "YPE SABAO BARRA NEUTRO PCT PLAST 800G",
    "unitPrice": 8.95,
    "unitHl": 0.01,
    "boxPrice": 8.95,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "35136": {
    "sku": "35136",
    "descricao": "YPE SABAO BARRA MULTIATIVO PCT PLAST 800G",
    "unitPrice": 8.95,
    "unitHl": 0.0035,
    "boxPrice": 8.95,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "35331": {
    "sku": "35331",
    "descricao": "BUDWEISER GFA VD 1L",
    "unitPrice": 5.47,
    "unitHl": 0.01,
    "boxPrice": 65.61,
    "fatorSku": 12,
    "fatorHl": 0.12,
    "grupo": "CERVEJA",
    "embalagem": "LITRÃO"
  },
  "35338": {
    "sku": "35338",
    "descricao": "BUDWEISER ZERO LT 473ML SH C/12 NPAL",
    "unitPrice": 4.66,
    "unitHl": 0.005,
    "boxPrice": 55.9,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "35617": {
    "sku": "35617",
    "descricao": "BEATS GREEN MIX LT 269ML SH C/8",
    "unitPrice": 4.84,
    "unitHl": 0.0025,
    "boxPrice": 38.71,
    "fatorSku": 8,
    "fatorHl": 0.02,
    "grupo": "MATCH",
    "embalagem": "LATA 269"
  },
  "35620": {
    "sku": "35620",
    "descricao": "BEATS GREEN MIX LONG NECK 269ML SIX-PACK SH C/4",
    "unitPrice": 5.63,
    "unitHl": 0.0025,
    "boxPrice": 135,
    "fatorSku": 24,
    "fatorHl": 0.06,
    "grupo": "MATCH",
    "embalagem": "LONG NECK"
  },
  "35980": {
    "sku": "35980",
    "descricao": "CASAL GARCIA VINHO ROSE GFA VD 750 ML",
    "unitPrice": 53.49,
    "unitHl": 0.01,
    "boxPrice": 53.49,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "35992": {
    "sku": "35992",
    "descricao": "CASAL GARCIA VINHO BR VERDE GFA VD 750 ML",
    "unitPrice": 51,
    "unitHl": 0.01,
    "boxPrice": 51,
    "fatorSku": 1,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "GFA VINHO"
  },
  "36024": {
    "sku": "36024",
    "descricao": "SKOL ZERO LONG NECK 330ML SIX-PACK SHRINK C/4",
    "unitPrice": 3.91,
    "unitHl": 0.00333,
    "boxPrice": 93.8,
    "fatorSku": 24,
    "fatorHl": 0.08,
    "grupo": "CERVEJA",
    "embalagem": ""
  },
  "36028": {
    "sku": "36028",
    "descricao": "SKOL ZERO LT SLEEK 350ML SH C 12",
    "unitPrice": 2.84,
    "unitHl": 0.00333,
    "boxPrice": 34.09,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": ""
  },
  "36034": {
    "sku": "36034",
    "descricao": "BUDWEISER LT 473ML SH C12 NP MULTIPACK",
    "unitPrice": 5.41,
    "unitHl": 0.005,
    "boxPrice": 64.88,
    "fatorSku": 12,
    "fatorHl": 0.06,
    "grupo": "CERVEJA",
    "embalagem": "LATA 473ML"
  },
  "37123": {
    "sku": "37123",
    "descricao": "YPE SABAO BARRA ALOE VERA PCT PL 160G",
    "unitPrice": 11.49,
    "unitHl": 0.0035,
    "boxPrice": 11.49,
    "fatorSku": 1,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "37450": {
    "sku": "37450",
    "descricao": "BUDWEISER LT SLEEK 350ML SH C 12 MULTIPACK",
    "unitPrice": 3.47,
    "unitHl": 0.00333,
    "boxPrice": 41.69,
    "fatorSku": 12,
    "fatorHl": 0.04,
    "grupo": "CERVEJA",
    "embalagem": "LATA 350ML"
  },
  "37576": {
    "sku": "37576",
    "descricao": "DOCES VIEIRA PE DE MOCA PCT PLAST 23G POTE C/40",
    "unitPrice": 0.82,
    "unitHl": 0.00025,
    "boxPrice": 32.8,
    "fatorSku": 40,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DOCES"
  },
  "37579": {
    "sku": "37579",
    "descricao": "DOCES VIEIRA BEIJO DE LEITE PCT PLAST 23G POTE C/40",
    "unitPrice": 0.98,
    "unitHl": 0.00025,
    "boxPrice": 39.2,
    "fatorSku": 40,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DOCES"
  },
  "37580": {
    "sku": "37580",
    "descricao": "DOCES VIEIRA CHURRITOS PCT PLAST 23G POTE C/40",
    "unitPrice": 0.98,
    "unitHl": 0.00025,
    "boxPrice": 39.2,
    "fatorSku": 40,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DOCES"
  },
  "37581": {
    "sku": "37581",
    "descricao": "DOCES VIEIRA COCADA BAIANA PCT PLAST 23G POTE C/40",
    "unitPrice": 0.98,
    "unitHl": 0.00025,
    "boxPrice": 39.2,
    "fatorSku": 40,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DOCES"
  },
  "37582": {
    "sku": "37582",
    "descricao": "DOCES VIEIRA COCADA BRANCA PCT PLAST 23G POTE C/40",
    "unitPrice": 0.98,
    "unitHl": 0.00025,
    "boxPrice": 39.2,
    "fatorSku": 40,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DOCES"
  },
  "37583": {
    "sku": "37583",
    "descricao": "DOCES VIEIRA BEIJO DE MOCA PCT PLAST 23G POTE C/40",
    "unitPrice": 0.98,
    "unitHl": 0.00025,
    "boxPrice": 39.2,
    "fatorSku": 40,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DOCES"
  },
  "37820": {
    "sku": "37820",
    "descricao": "MENDORATO AMENDOIM S PELE SALGADO PCT 24G FD C/60",
    "unitPrice": 0.44,
    "unitHl": 0.0035,
    "boxPrice": 26.53,
    "fatorSku": 60,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "37933": {
    "sku": "37933",
    "descricao": "DOCES VIEIRA BRIGADEIRO PCT PLAST 23G POTE C/40",
    "unitPrice": 0.98,
    "unitHl": 0.00025,
    "boxPrice": 39.2,
    "fatorSku": 40,
    "fatorHl": 0.01,
    "grupo": "MARKETPLACE",
    "embalagem": "DOCES"
  },
  "38172": {
    "sku": "38172",
    "descricao": "STELLA ARTOIS PURE GOLD ONE WAY 600ML CX C12 NP",
    "unitPrice": 9.71,
    "unitHl": 0.00083,
    "boxPrice": 116.55,
    "fatorSku": 12,
    "fatorHl": 0.01,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "38404": {
    "sku": "38404",
    "descricao": "CORONA EXTRA N LN 330ML SIXPACK",
    "unitPrice": 5.86,
    "unitHl": 0.0035,
    "boxPrice": 35.14,
    "fatorSku": 6,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "38405": {
    "sku": "38405",
    "descricao": "BUDWEISER ZERO LN 330ML SIXPACK",
    "unitPrice": 4.21,
    "unitHl": 0.0035,
    "boxPrice": 25.24,
    "fatorSku": 6,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "38406": {
    "sku": "38406",
    "descricao": "CORONA CERO SUNBREW N LN 330ML SIX-PACK",
    "unitPrice": 5.69,
    "unitHl": 0.0035,
    "boxPrice": 34.14,
    "fatorSku": 6,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "38418": {
    "sku": "38418",
    "descricao": "HALLS BLUEBERRY ENVELOPE 28G CX C/21",
    "unitPrice": 1.27,
    "unitHl": 0.0035,
    "boxPrice": 26.77,
    "fatorSku": 21,
    "fatorHl": 0,
    "grupo": "MARKETPLACE",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "39024": {
    "sku": "39024",
    "descricao": "STELLA ARTOIS PURE GOLD LN 330ML SIXPACK",
    "unitPrice": 5.11,
    "unitHl": 0.0035,
    "boxPrice": 30.64,
    "fatorSku": 6,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  },
  "39025": {
    "sku": "39025",
    "descricao": "MICHELOB ULTRA N LN 330ML SIXPACK",
    "unitPrice": 4.71,
    "unitHl": 0.0035,
    "boxPrice": 28.24,
    "fatorSku": 6,
    "fatorHl": 0,
    "grupo": "CERVEJA",
    "embalagem": "NÃO IDENTIFICADA"
  }
};

/**
 * Dedução analítica do volume unitário (HL/un) a partir de termos no nome da embalagem/descrição.
 */
export function deduceUnitHlFromDescription(desc: string | undefined | null): number {
  if (!desc) return 0.00350;
  const d = desc.toUpperCase();

  if (d.includes('3,3 L') || d.includes('3.3 L') || d.includes('3,3L') || d.includes('3.3L')) return 0.03300;
  if (d.includes('2,5 L') || d.includes('2.5 L') || d.includes('2,5L') || d.includes('2.5L')) return 0.02500;
  if (d.includes('2L') || d.includes('2 L') || d.includes('P2')) return 0.02000;
  if (d.includes('1,5L') || d.includes('1.5L') || d.includes('1,5 L') || d.includes('1.5 L')) return 0.01500;
  if (d.includes('1L') || d.includes('1 L') || d.includes('P1') || d.includes('LITRAO') || d.includes('LITRÃO')) return 0.01000;
  if (d.includes('750ML') || d.includes('750 ML')) return 0.00750;
  if (d.includes('600ML') || d.includes('600 ML') || d.includes(' 600')) return 0.00600;
  if (d.includes('510ML') || d.includes('510 ML')) return 0.00510;
  if (d.includes('500ML') || d.includes('500 ML')) return 0.00500;
  if (d.includes('473ML') || d.includes('473 ML') || d.includes('LATAO') || d.includes('LATÃO')) return 0.00473;
  if (d.includes('355ML') || d.includes('355 ML')) return 0.00355;
  if (d.includes('350ML') || d.includes('350 ML')) return 0.00350;
  if (d.includes('330ML') || d.includes('330 ML')) return 0.00330;
  if (d.includes('300ML') || d.includes('300 ML') || d.includes('LITRINHO')) return 0.00300;
  if (d.includes('269ML') || d.includes('269 ML')) return 0.00269;
  if (d.includes('250ML') || d.includes('250 ML')) return 0.00250;
  if (d.includes('200ML') || d.includes('200 ML')) return 0.00200;

  return 0.00350;
}

/**
 * Retorna as métricas unitárias oficiais (preço unitário e volume por unidade física) de um SKU
 */
export function getSkuUnitMetrics(
  sku: string | undefined | null,
  currentQty?: number,
  currentVal?: number,
  currentHl?: number,
  desc?: string
): SkuUnitMetrics {
  const cleanSku = (sku || '').trim().replace(/^0+/, '');
  const catalogEntry = SKU_CATALOG[cleanSku];

  if (catalogEntry) {
    return catalogEntry;
  }

  // Dedução automática a partir da descrição
  const deducedHl = deduceUnitHlFromDescription(desc);

  const qty = Number(currentQty) || 1;
  const val = Number(currentVal) || 0;
  const rawHl = Number(currentHl) || 0;

  const unitPrice = qty > 0 ? Number((val / qty).toFixed(4)) : val;
  let unitHl = deducedHl;
  if (qty > 0 && rawHl > 0) {
    const candidate = rawHl / qty;
    if (candidate > 0 && candidate <= 0.05) {
      unitHl = Number(candidate.toFixed(5));
    }
  }

  return {
    sku: cleanSku,
    descricao: desc || 'PRODUTO NÃO CATALOGADO',
    unitPrice: unitPrice > 0 ? unitPrice : 3.00,
    unitHl,
    boxPrice: unitPrice * 12,
    fatorSku: 12,
    fatorHl: unitHl * 12,
    grupo: 'GERAL',
    embalagem: ''
  };
}

/**
 * Retorna todos os detalhes completos de um SKU (preço unitário, preço caixa, fator, HL e grupo).
 * Prioriza o mapa dinâmico de produtos carregado em memória, seguido pelo catálogo oficial Ambev.
 */
export function getSkuComprehensiveDetails(
  sku: string | undefined | null,
  productsMap?: Map<string, ProductMaster>,
  descFallback?: string
): {
  sku: string;
  descricao: string;
  unitPrice: number;
  boxPrice: number;
  fatorSku: number;
  unitHl: number;
  fatorHl: number;
  grupo: string;
  embalagem: string;
  hasCatalog: boolean;
} {
  const cleanSku = String(sku || '').trim().replace(/^0+/, '');
  
  // 1. Procura no mapa dinâmico de produtos (productsMap)
  if (productsMap && productsMap.size > 0) {
    let prod = productsMap.get(cleanSku);
    if (!prod) {
      // Tenta com padding ou sem padding
      for (const [k, v] of productsMap.entries()) {
        const kClean = String(k).trim().replace(/^0+/, '');
        if (kClean === cleanSku) {
          prod = v;
          break;
        }
      }
    }

    if (prod) {
      const fatorSku = Math.max(1, prod.fatorSku || 1);
      const boxPrice = prod.valor > 0 ? prod.valor : (prod.valorUnit > 0 ? prod.valorUnit * fatorSku : 0);
      const unitPrice = prod.valorUnit > 0 ? prod.valorUnit : (boxPrice > 0 ? boxPrice / fatorSku : 0);
      const fatorHl = prod.fatorHl > 0 ? prod.fatorHl : 0.042;
      const unitHl = (fatorHl > 0 && fatorSku > 0) ? Number((fatorHl / fatorSku).toFixed(5)) : deduceUnitHlFromDescription(prod.descricao);

      return {
        sku: cleanSku,
        descricao: prod.descricao || descFallback || 'PRODUTO CADASTRADO',
        unitPrice,
        boxPrice,
        fatorSku,
        unitHl,
        fatorHl,
        grupo: prod.grupo || 'GERAL',
        embalagem: prod.embalagem || '',
        hasCatalog: true
      };
    }
  }

  // 2. Procura no catálogo embutido SKU_CATALOG
  const cat = SKU_CATALOG[cleanSku];
  if (cat) {
    const fatorSku = Math.max(1, cat.fatorSku || 1);
    const boxPrice = (cat.boxPrice && cat.boxPrice > 0) ? cat.boxPrice : cat.unitPrice * fatorSku;
    const unitPrice = cat.unitPrice > 0 ? cat.unitPrice : (boxPrice > 0 ? boxPrice / fatorSku : 3.00);
    const fatorHl = (cat.fatorHl && cat.fatorHl > 0) ? cat.fatorHl : cat.unitHl * fatorSku;
    const unitHl = cat.unitHl > 0 ? cat.unitHl : (fatorHl > 0 ? Number((fatorHl / fatorSku).toFixed(5)) : 0.00350);

    return {
      sku: cleanSku,
      descricao: cat.descricao || descFallback || 'PRODUTO AMBEV',
      unitPrice,
      boxPrice,
      fatorSku,
      unitHl,
      fatorHl,
      grupo: cat.grupo || 'GERAL',
      embalagem: cat.embalagem || '',
      hasCatalog: true
    };
  }

  // 3. Fallback inteligente
  const deducedHl = deduceUnitHlFromDescription(descFallback);
  const defaultFator = 12;

  return {
    sku: cleanSku,
    descricao: descFallback || 'PRODUTO NÃO CATALOGADO',
    unitPrice: 3.00,
    boxPrice: 36.00,
    fatorSku: defaultFator,
    unitHl: deducedHl,
    fatorHl: Number((deducedHl * defaultFator).toFixed(3)),
    grupo: 'GERAL',
    embalagem: '',
    hasCatalog: false
  };
}

/**
 * Recalcula de forma transparente e coerente os valores totais e hectolitros de um item operacional
 */
export function recalculateDeviationValues(
  type: 'quebra' | 'vale' | 'troca' | 'falta',
  sku: string,
  quantidade: number,
  unidadeMedida?: string,
  productsMap?: Map<string, ProductMaster>,
  descFallback?: string
): {
  valorTotal: number;
  volumeHl: number;
  unitPrice: number;
  boxPrice: number;
  fatorSku: number;
  fatorHl: number;
  unitHl: number;
  isBox: boolean;
} {
  const details = getSkuComprehensiveDetails(sku, productsMap, descFallback);

  const isBox = type === 'quebra'
    ? false // Quebras são sempre em unidades físicas avulsas
    : type === 'troca'
      ? ['CX', 'CAIXA', 'CAIXAS', 'SKU', 'SKUS', 'FD', 'FARDO'].includes(String(unidadeMedida).trim().toUpperCase())
      : !['UND', 'UN', 'UNIDADE', 'UNIDADES', 'LATA', 'GFA'].includes(String(unidadeMedida).trim().toUpperCase());

  const refPrice = isBox ? details.boxPrice : details.unitPrice;
  const refHl = isBox ? details.fatorHl : details.unitHl;

  const valorTotal = Number((quantidade * refPrice).toFixed(2));
  const volumeHl = Number((quantidade * refHl).toFixed(4));

  return {
    valorTotal,
    volumeHl,
    unitPrice: details.unitPrice,
    boxPrice: details.boxPrice,
    fatorSku: details.fatorSku,
    fatorHl: details.fatorHl,
    unitHl: details.unitHl,
    isBox
  };
}

/**
 * Calcula os valores proporcionais exatos dado uma quantidade em UNIDADES (UND)
 */
export function calculateProportionalValues(
  sku: string,
  quantidade: number,
  customUnitPrice?: number,
  customUnitHl?: number,
  desc?: string
) {
  const metrics = getSkuUnitMetrics(sku, quantidade, undefined, undefined, desc);
  const uPrice = customUnitPrice !== undefined && customUnitPrice > 0 ? customUnitPrice : metrics.unitPrice;
  const uHl = customUnitHl !== undefined && customUnitHl > 0 ? customUnitHl : metrics.unitHl;

  const valorTotal = Number((uPrice * quantidade).toFixed(2));
  const volumeHl = Number((uHl * quantidade).toFixed(5));

  return {
    unitPrice: uPrice,
    unitHl: uHl,
    valorTotal,
    volumeHl
  };
}

/**
 * Verifica se um registro de quebra pertence ao WQI (Warehouse Quality Index) do Armazém
 */
export function isWqiRecord(item: {
  area?: string;
  codQuebra?: string;
  motivo?: string;
  descricao?: string;
}): boolean {
  if (!item) return false;
  const area = (item.area || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const motivo = (item.motivo || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const codQ = String(item.codQuebra || '').trim();

  if (codQ === '539') return true;

  const isArmazem = area.includes('ARMAZ') || area === 'ARMAZEM' || area === 'DEPOSITO' || area === 'PNC';
  const isMovimentacao = motivo.includes('MOVIMENTA') || motivo.includes('EMPILHADEIRA') || motivo.includes('MANUSEIO');

  return isArmazem && isMovimentacao;
}
