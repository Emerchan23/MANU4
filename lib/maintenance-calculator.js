// Calculadora de próximas manutenções preventivas

/**
 * Calcula a próxima data de manutenção baseada na última manutenção e frequência
 * @param {Date|string} lastMaintenanceDate - Data da última manutenção
 * @param {number} frequencyDays - Frequência em dias
 * @returns {Date} - Próxima data de manutenção
 */
export function calculateNextMaintenance(lastMaintenanceDate, frequencyDays) {
  if (!lastMaintenanceDate || !frequencyDays) {
    return null;
  }

  const lastDate = new Date(lastMaintenanceDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + frequencyDays);
  
  return nextDate;
}

/**
 * Calcula se uma manutenção está atrasada
 * @param {Date|string} nextMaintenanceDate - Data da próxima manutenção
 * @returns {boolean} - True se está atrasada
 */
export function isMaintenanceOverdue(nextMaintenanceDate) {
  if (!nextMaintenanceDate) {
    return false;
  }

  const today = new Date();
  const nextDate = new Date(nextMaintenanceDate);
  
  return today > nextDate;
}

/**
 * Calcula quantos dias faltam para a próxima manutenção
 * @param {Date|string} nextMaintenanceDate - Data da próxima manutenção
 * @returns {number} - Dias até a manutenção (negativo se atrasada)
 */
export function getDaysUntilMaintenance(nextMaintenanceDate) {
  if (!nextMaintenanceDate) {
    return null;
  }

  const today = new Date();
  const nextDate = new Date(nextMaintenanceDate);
  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}