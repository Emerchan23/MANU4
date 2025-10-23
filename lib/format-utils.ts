// Utilitários de formatação

/**
 * Formatar CNPJ com máscara
 * @param cnpj - CNPJ sem formatação
 * @returns CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = cnpj.replace(/\D/g, '');
  
  // Se não tem 14 dígitos, retorna como está
  if (numbers.length !== 14) return cnpj;
  
  // Aplica a máscara XX.XXX.XXX/XXXX-XX
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formatar telefone com máscara
 * @param phone - Telefone sem formatação
 * @returns Telefone formatado
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Celular com 11 dígitos: (XX) XXXXX-XXXX
  if (numbers.length === 11) {
    return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  
  // Telefone fixo com 10 dígitos: (XX) XXXX-XXXX
  if (numbers.length === 10) {
    return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  
  // Se não tem formato padrão, retorna como está
  return phone;
}

/**
 * Formatar CEP com máscara
 * @param cep - CEP sem formatação
 * @returns CEP formatado (XXXXX-XXX)
 */
export function formatCEP(cep: string): string {
  if (!cep) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = cep.replace(/\D/g, '');
  
  // Se não tem 8 dígitos, retorna como está
  if (numbers.length !== 8) return cep;
  
  // Aplica a máscara XXXXX-XXX
  return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}