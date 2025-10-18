/**
 * Utilitários para formatação de moeda brasileira
 */

/**
 * Formata um valor numérico para moeda brasileira
 * @param value - Valor numérico
 * @returns String formatada como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Aplica máscara de moeda brasileira em uma string
 * @param value - String com o valor
 * @returns String formatada com máscara de moeda
 */
export function applyCurrencyMask(value: string): string {
  // Remove tudo que não é dígito
  const numericValue = value.replace(/\D/g, '')
  
  if (!numericValue) return ''
  
  // Converte para número (centavos)
  const number = parseInt(numericValue) / 100
  
  // Formata como moeda brasileira
  return formatCurrency(number)
}

/**
 * Remove a formatação de moeda e retorna apenas o valor numérico
 * @param value - String formatada como moeda
 * @returns Valor numérico
 */
export function parseCurrencyValue(value: string): number {
  // Remove símbolos de moeda e espaços
  const numericString = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '') // Remove pontos (separadores de milhares)
    .replace(',', '.') // Substitui vírgula por ponto (separador decimal)
  
  return parseFloat(numericString) || 0
}

/**
 * Formata valor para input (sem símbolo R$, apenas com formatação numérica)
 * @param value - String com o valor
 * @returns String formatada para input
 */
export function formatCurrencyInput(value: string): string {
  const numericValue = value.replace(/\D/g, '')
  
  if (!numericValue) return ''
  
  const number = parseInt(numericValue) / 100
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)
}