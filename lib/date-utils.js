/**
 * Utilitário de formatação de datas para o padrão brasileiro (DD/MM/AAAA)
 * Este arquivo centraliza todas as funções de formatação de data do sistema
 */

import { format, parse, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formatar data para o padrão brasileiro DD/MM/AAAA
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada no padrão DD/MM/AAAA
 */
export function formatDateBR(date) {
  if (!date) return '';
  
  try {
    let dateObj;
    
    if (typeof date === 'string') {
      // Tentar parsear diferentes formatos de string
      if (date.includes('T')) {
        // ISO string
        dateObj = parseISO(date);
      } else if (date.includes('/')) {
        // Formato brasileiro DD/MM/AAAA
        dateObj = parse(date, 'dd/MM/yyyy', new Date());
      } else if (date.includes('-')) {
        // Formato americano YYYY-MM-DD
        dateObj = parse(date, 'yyyy-MM-dd', new Date());
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      console.warn('Data inválida:', date);
      return '';
    }
    
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return '';
  }
}

/**
 * Formatar data e hora para o padrão brasileiro DD/MM/AAAA HH:mm
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada no padrão DD/MM/AAAA HH:mm
 */
export function formatDateTimeBR(date) {
  if (!date) return '';
  
  try {
    let dateObj;
    
    if (typeof date === 'string') {
      if (date.includes('T')) {
        dateObj = parseISO(date);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      console.warn('Data inválida:', date);
      return '';
    }
    
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error, date);
    return '';
  }
}

/**
 * Converter data do formato brasileiro DD/MM/AAAA para ISO (YYYY-MM-DD)
 * @param {string} dateBR - Data no formato DD/MM/AAAA
 * @returns {string} Data no formato ISO YYYY-MM-DD
 */
export function convertBRToISO(dateBR) {
  if (!dateBR) return '';
  
  try {
    const dateObj = parse(dateBR, 'dd/MM/yyyy', new Date());
    
    if (!isValid(dateObj)) {
      console.warn('Data brasileira inválida:', dateBR);
      return '';
    }
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Erro ao converter data BR para ISO:', error, dateBR);
    return '';
  }
}

/**
 * Converter data do formato ISO (YYYY-MM-DD) para brasileiro DD/MM/AAAA
 * @param {string} dateISO - Data no formato ISO YYYY-MM-DD
 * @returns {string} Data no formato DD/MM/AAAA
 */
export function convertISOToBR(dateISO) {
  if (!dateISO) return '';
  
  try {
    const dateObj = parseISO(dateISO);
    
    if (!isValid(dateObj)) {
      console.warn('Data ISO inválida:', dateISO);
      return '';
    }
    
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao converter data ISO para BR:', error, dateISO);
    return '';
  }
}

/**
 * Validar se uma data está no formato brasileiro DD/MM/AAAA
 * @param {string} dateBR - Data no formato DD/MM/AAAA
 * @returns {boolean} True se a data é válida
 */
export function isValidBRDate(dateBR) {
  if (!dateBR || typeof dateBR !== 'string') return false;
  
  try {
    const dateObj = parse(dateBR, 'dd/MM/yyyy', new Date());
    return isValid(dateObj);
  } catch (error) {
    return false;
  }
}

/**
 * Obter data atual no formato brasileiro DD/MM/AAAA
 * @returns {string} Data atual no formato DD/MM/AAAA
 */
export function getCurrentDateBR() {
  return format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Obter data e hora atual no formato brasileiro DD/MM/AAAA HH:mm
 * @returns {string} Data e hora atual no formato DD/MM/AAAA HH:mm
 */
export function getCurrentDateTimeBR() {
  return format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

/**
 * Formatar data para input HTML do tipo date (YYYY-MM-DD)
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada para input HTML
 */
export function formatForHTMLInput(date) {
  if (!date) return '';
  
  try {
    let dateObj;
    
    if (typeof date === 'string') {
      if (date.includes('/')) {
        // Formato brasileiro DD/MM/AAAA
        dateObj = parse(date, 'dd/MM/yyyy', new Date());
      } else if (date.includes('T')) {
        // ISO string
        dateObj = parseISO(date);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      console.warn('Data inválida para input HTML:', date);
      return '';
    }
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Erro ao formatar data para input HTML:', error, date);
    return '';
  }
}

/**
 * Converter valor de input HTML (YYYY-MM-DD) para formato brasileiro
 * @param {string} htmlDate - Data do input HTML
 * @returns {string} Data no formato DD/MM/AAAA
 */
export function convertHTMLInputToBR(htmlDate) {
  if (!htmlDate) return '';
  
  try {
    const dateObj = parse(htmlDate, 'yyyy-MM-dd', new Date());
    
    if (!isValid(dateObj)) {
      console.warn('Data HTML inválida:', htmlDate);
      return '';
    }
    
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao converter data HTML para BR:', error, htmlDate);
    return '';
  }
}

/**
 * Formatar data relativa (ex: "há 2 dias", "em 3 horas")
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada de forma relativa
 */
export function formatRelativeDate(date) {
  if (!date) return '';
  
  try {
    let dateObj;
    
    if (typeof date === 'string') {
      if (date.includes('T')) {
        dateObj = parseISO(date);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return formatDateBR(date);
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return 'agora';
    } else if (diffInMinutes < 60) {
      return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 7) {
      return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    } else {
      return formatDateBR(dateObj);
    }
  } catch (error) {
    console.error('Erro ao formatar data relativa:', error, date);
    return formatDateBR(date);
  }
}

/**
 * Configurações padrão para componentes de data
 */
export const dateConfig = {
  locale: ptBR,
  dateFormat: 'dd/MM/yyyy',
  dateTimeFormat: 'dd/MM/yyyy HH:mm',
  inputFormat: 'yyyy-MM-dd',
  placeholder: 'DD/MM/AAAA'
};

// Exportar todas as funções como default também
const dateUtils = {
  formatDateBR,
  formatDateTimeBR,
  convertBRToISO,
  convertISOToBR,
  isValidBRDate,
  getCurrentDateBR,
  getCurrentDateTimeBR,
  formatForHTMLInput,
  convertHTMLInputToBR,
  formatRelativeDate,
  dateConfig
};

export default dateUtils;