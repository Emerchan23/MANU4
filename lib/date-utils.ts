/**
 * Utilitários de Data - Formato Brasileiro (dd/mm/aaaa)
 */

/**
 * Formata uma data para o padrão brasileiro dd/mm/aaaa
 */
export function formatDateBR(date: Date | string | null | undefined): string {
  if (!date) return '-';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '-';
  }
}

/**
 * Formata uma data e hora para o padrão brasileiro dd/mm/aaaa HH:mm:ss
 */
export function formatDateTimeBR(date: Date | string | null | undefined): string {
  if (!date) return '-';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return '-';
  }
}

/**
 * Formata apenas a hora HH:mm:ss
 */
export function formatTimeBR(date: Date | string | null | undefined): string {
  if (!date) return '-';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '-';

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Erro ao formatar hora:', error);
    return '-';
  }
}

/**
 * Converte string no formato dd/mm/aaaa para objeto Date
 */
export function parseDateBR(dateStr: string): Date | null {
  if (!dateStr) return null;

  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Mês começa em 0
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);

  if (isNaN(date.getTime())) return null;

  return date;
}

/**
 * Converte string no formato dd/mm/aaaa HH:mm:ss para objeto Date
 */
export function parseDateTimeBR(dateTimeStr: string): Date | null {
  if (!dateTimeStr) return null;

  const [datePart, timePart] = dateTimeStr.split(' ');

  if (!datePart) return null;

  const dateParts = datePart.split('/');
  if (dateParts.length !== 3) return null;

  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const year = parseInt(dateParts[2], 10);

  let hours = 0, minutes = 0, seconds = 0;

  if (timePart) {
    const timeParts = timePart.split(':');
    hours = parseInt(timeParts[0] || '0', 10);
    minutes = parseInt(timeParts[1] || '0', 10);
    seconds = parseInt(timeParts[2] || '0', 10);
  }

  const date = new Date(year, month, day, hours, minutes, seconds);

  if (isNaN(date.getTime())) return null;

  return date;
}

/**
 * Formata data para input type="date" (yyyy-mm-dd)
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Formata data para MySQL (yyyy-mm-dd HH:mm:ss)
 */
export function formatDateForMySQL(date: Date | string | null | undefined): string | null {
  if (!date) return null;

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Retorna a data atual formatada em padrão brasileiro
 */
export function getCurrentDateBR(): string {
  return formatDateBR(new Date());
}

/**
 * Retorna a data e hora atual formatada em padrão brasileiro
 */
export function getCurrentDateTimeBR(): string {
  return formatDateTimeBR(new Date());
}

/**
 * Converte string no formato dd/mm/aaaa para formato ISO yyyy-mm-dd
 */
export function convertBRToISO(dateBR: string): string {
  if (!dateBR) return '';

  const parts = dateBR.split('/');
  if (parts.length !== 3) return '';

  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];

  return `${year}-${month}-${day}`;
}

/**
 * Converte string no formato ISO yyyy-mm-dd para formato brasileiro dd/mm/aaaa
 */
export function convertISOToBR(dateISO: string): string {
  if (!dateISO) return '';

  const parts = dateISO.split('-');
  if (parts.length !== 3) return '';

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  return `${day}/${month}/${year}`;
}

/**
 * Formata data para input HTML do tipo date (yyyy-mm-dd)
 */
export function formatForHTMLInput(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Converte valor de input HTML (yyyy-mm-dd) para formato brasileiro dd/mm/aaaa
 */
export function convertHTMLInputToBR(htmlDate: string): string {
  if (!htmlDate) return '';

  const parts = htmlDate.split('-');
  if (parts.length !== 3) return '';

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  return `${day}/${month}/${year}`;
}

/**
 * Valida se uma string está no formato dd/mm/aaaa
 */
export function isValidBRDate(dateStr: string): boolean {
  if (!dateStr) return false;

  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(regex);

  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;

  const date = new Date(year, month - 1, day);

  return date.getDate() === day &&
         date.getMonth() === month - 1 &&
         date.getFullYear() === year;
}

/**
 * Valida se uma string está no formato dd/mm/aaaa
 */
export function isValidDateBR(dateStr: string): boolean {
  if (!dateStr) return false;

  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(regex);

  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;

  const date = new Date(year, month - 1, day);

  return date.getDate() === day &&
         date.getMonth() === month - 1 &&
         date.getFullYear() === year;
}

/**
 * Calcula diferença entre duas datas em dias
 */
export function diffInDays(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Formata data relativa (ex: "há 2 horas", "ontem")
 */
export function formatRelativeDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `há ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  if (diffDay === 1) return 'ontem';
  if (diffDay < 7) return `há ${diffDay} dias`;
  if (diffDay < 30) return `há ${Math.floor(diffDay / 7)} semana${Math.floor(diffDay / 7) > 1 ? 's' : ''}`;
  if (diffDay < 365) return `há ${Math.floor(diffDay / 30)} mês${Math.floor(diffDay / 30) > 1 ? 'es' : ''}`;

  return `há ${Math.floor(diffDay / 365)} ano${Math.floor(diffDay / 365) > 1 ? 's' : ''}`;
}
