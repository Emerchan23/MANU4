import { query } from './database.js';

// Sistema de verificação de dependências para exclusões guiadas

/**
 * Verifica dependências de um equipamento no banco de dados
 * @param {string} equipmentId - ID do equipamento
 * @returns {Promise<Object>} - Resultado da verificação de dependências
 */
async function checkEquipmentDependencies(equipmentId) {
  try {
    const blockedBy = [];
    
    // Verificar ordens de serviço vinculadas
    const serviceOrders = await query(
      `SELECT id, description, status, created_at 
       FROM service_orders 
       WHERE equipment_id = ? AND status IN ('PENDENTE', 'EM_ANDAMENTO', 'AGENDADA')`,
      [equipmentId]
    );
    
    if (serviceOrders.length > 0) {
      blockedBy.push({
        type: "service_orders",
        items: serviceOrders.map((os) => ({
          id: os.id.toString(),
          name: os.description || `Ordem de Serviço #${os.id}`,
          description: `Status: ${os.status}`,
        })),
        message: `Este equipamento não pode ser excluído, pois está vinculado a ${serviceOrders.length} ordem(ns) de serviço ativa(s).`,
        actionRequired: `Para excluir, primeiro finalize ou cancele as ordens de serviço: ${serviceOrders.map((os) => `#${os.id}`).join(", ")}.`,
      });
    }
    
    // Verificar agendamentos de manutenção preventiva
    const maintenanceSchedules = await query(
      `SELECT id, description, scheduled_date, status 
       FROM maintenance_schedules 
       WHERE equipment_id = ? AND status IN ('AGENDADA', 'EM_ANDAMENTO')`,
      [equipmentId]
    );
    
    if (maintenanceSchedules.length > 0) {
      blockedBy.push({
        type: "maintenance_schedules",
        items: maintenanceSchedules.map((ms) => ({
          id: ms.id.toString(),
          name: ms.description || `Manutenção #${ms.id}`,
          description: `Agendada para: ${new Date(ms.scheduled_date).toLocaleDateString('pt-BR')}`,
        })),
        message: `Este equipamento possui ${maintenanceSchedules.length} agendamento(s) de manutenção preventiva ativo(s).`,
        actionRequired: `Cancele ou transfira os agendamentos antes de excluir o equipamento.`,
      });
    }
    
    // Verificar histórico de manutenções recentes (últimos 30 dias)
    const recentMaintenances = await query(
      `SELECT COUNT(*) as count 
       FROM maintenance_history 
       WHERE equipment_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [equipmentId]
    );
    
    const hasRecentMaintenances = recentMaintenances[0]?.count > 0;
    
    return {
      canDelete: blockedBy.length === 0,
      blockedBy,
      hasRecentMaintenances,
      metadata: {
        serviceOrdersCount: serviceOrders.length,
        maintenanceSchedulesCount: maintenanceSchedules.length,
        recentMaintenancesCount: recentMaintenances[0]?.count || 0
      }
    };
    
  } catch (error) {
    console.error('Erro ao verificar dependências do equipamento:', error);
    throw new Error('Erro interno ao verificar dependências');
  }
}

/**
 * Verifica dependências de um setor no banco de dados
 * @param {string} sectorId - ID do setor
 * @returns {Promise<Object>} - Resultado da verificação de dependências
 */
async function checkSectorDependencies(sectorId) {
  try {
    const blockedBy = [];
    const cascadeDeletes = [];
    
    // Verificar equipamentos no setor
    const equipments = await query(
      `SELECT id, name, code FROM equipment WHERE sector_id = ? AND is_active = 1`,
      [sectorId]
    );
    
    if (equipments.length > 0) {
      cascadeDeletes.push({
        type: "equipments",
        count: equipments.length,
        items: equipments.slice(0, 5).map((eq) => ({
          id: eq.id.toString(),
          name: `${eq.name} (${eq.code})`,
        })),
      });
    }
    
    // Verificar subsetores
    const subsectors = await query(
      `SELECT id, name FROM subsectors WHERE sector_id = ? AND is_active = 1`,
      [sectorId]
    );
    
    if (subsectors.length > 0) {
      cascadeDeletes.push({
        type: "subsectors",
        count: subsectors.length,
        items: subsectors.map((sub) => ({
          id: sub.id.toString(),
          name: sub.name,
        })),
      });
    }
    
    return {
      canDelete: true, // Setores podem ser excluídos com cascata
      blockedBy,
      cascadeDeletes,
    };
    
  } catch (error) {
    console.error('Erro ao verificar dependências do setor:', error);
    throw new Error('Erro interno ao verificar dependências');
  }
}

/**
 * Verifica dependências de um usuário no banco de dados
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} - Resultado da verificação de dependências
 */
async function checkUserDependencies(userId) {
  try {
    const blockedBy = [];
    
    // Verificar ordens de serviço em andamento
    const activeServiceOrders = await query(
      `SELECT id, description, status 
       FROM service_orders 
       WHERE assigned_user_id = ? AND status IN ('EM_ANDAMENTO', 'AGENDADA')`,
      [userId]
    );
    
    if (activeServiceOrders.length > 0) {
      blockedBy.push({
        type: "service_orders",
        items: activeServiceOrders.map((os) => ({
          id: os.id.toString(),
          name: os.description || `Ordem de Serviço #${os.id}`,
          description: `Status: ${os.status}`,
        })),
        message: `O usuário não pode ser excluído, pois é responsável por ${activeServiceOrders.length} ordem(ns) de serviço ativa(s).`,
        actionRequired: `Finalize ou reatribua essas OS antes de excluir o usuário: ${activeServiceOrders.map((os) => `#${os.id}`).join(", ")}.`,
      });
    }
    
    return {
      canDelete: blockedBy.length === 0,
      blockedBy,
    };
    
  } catch (error) {
    console.error('Erro ao verificar dependências do usuário:', error);
    throw new Error('Erro interno ao verificar dependências');
  }
}

export {
  checkEquipmentDependencies,
  checkSectorDependencies,
  checkUserDependencies,
};