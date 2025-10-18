// Sistema de integração de notificações com dados reais
import { query } from './database';
import { getNotificationServer } from './websocket-server';

export interface NotificationTrigger {
  type: 'equipment_status' | 'service_order' | 'maintenance_due' | 'maintenance_overdue' | 'system_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  relatedId: number;
  relatedType: string;
  targetUsers?: number[];
  broadcast?: boolean;
}

export class NotificationIntegrationService {
  
  // Monitorar mudanças de status de equipamentos
  public async checkEquipmentStatusChanges() {
    try {
      // Verificar equipamentos com status crítico
      const criticalEquipment = await query(`
        SELECT e.*, u.id as user_id, u.name as user_name
        FROM equipment e
        LEFT JOIN users u ON u.sector = e.sector OR u.role IN ('admin', 'manager')
        WHERE e.status IN ('broken', 'maintenance_required', 'out_of_service')
        AND e.updated_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      `);

      for (const equipment of criticalEquipment) {
        await this.createNotification({
          type: 'equipment_status',
          title: 'Equipamento Requer Atenção',
          message: `${equipment.name} (${equipment.sector}) está com status: ${this.translateStatus(equipment.status)}`,
          priority: equipment.status === 'broken' ? 'critical' : 'high',
          relatedId: equipment.id,
          relatedType: 'equipment',
          targetUsers: equipment.user_id ? [equipment.user_id] : undefined,
          broadcast: !equipment.user_id
        });
      }

      // Verificar equipamentos que voltaram ao normal
      const recoveredEquipment = await query(`
        SELECT e.*, u.id as user_id
        FROM equipment e
        LEFT JOIN users u ON u.sector = e.sector OR u.role IN ('admin', 'manager')
        WHERE e.status = 'operational'
        AND e.updated_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        AND EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.related_id = e.id 
          AND n.related_type = 'equipment' 
          AND n.type = 'equipment_alert'
          AND n.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        )
      `);

      for (const equipment of recoveredEquipment) {
        await this.createNotification({
          type: 'equipment_status',
          title: 'Equipamento Normalizado',
          message: `${equipment.name} (${equipment.sector}) voltou ao status operacional`,
          priority: 'medium',
          relatedId: equipment.id,
          relatedType: 'equipment',
          targetUsers: equipment.user_id ? [equipment.user_id] : undefined,
          broadcast: !equipment.user_id
        });
      }

    } catch (error) {
      console.error('Erro ao verificar status de equipamentos:', error);
    }
  }

  // Monitorar ordens de serviço
  public async checkServiceOrders() {
    // Funcionalidade removida: tabela service_orders descontinuada
    return;
  }


  // Verificar alertas do sistema
  public async checkSystemAlerts() {
    try {
      // Equipamentos sem manutenção há muito tempo
      const neglectedEquipment = await query(`
        SELECT e.*, 
               DATEDIFF(NOW(), COALESCE(pm.last_maintenance_date, e.created_at)) as days_without_maintenance,
               u.id as user_id
        FROM equipment e
        LEFT JOIN preventive_maintenances pm ON e.id = pm.equipment_id
        LEFT JOIN users u ON u.sector = e.sector OR u.role IN ('admin', 'manager')
        WHERE DATEDIFF(NOW(), COALESCE(pm.last_maintenance_date, e.created_at)) > 90
        AND e.status = 'operational'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.related_id = e.id 
          AND n.related_type = 'equipment' 
          AND n.type = 'system_alert'
          AND n.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        )
      `);

      for (const equipment of neglectedEquipment) {
        await this.createNotification({
          type: 'system_alert',
          title: 'Equipamento Sem Manutenção',
          message: `${equipment.name} não recebe manutenção há ${equipment.days_without_maintenance} dias`,
          priority: equipment.days_without_maintenance > 180 ? 'high' : 'medium',
          relatedId: equipment.id,
          relatedType: 'equipment',
          targetUsers: equipment.user_id ? [equipment.user_id] : undefined,
          broadcast: !equipment.user_id
        });
      }

      // Aviso removido: contagem de ordens de serviço foi descontinuada

    } catch (error) {
      console.error('Erro ao verificar alertas do sistema:', error);
    }
  }

  // Criar notificação no banco e enviar via WebSocket
  private async createNotification(trigger: NotificationTrigger) {
    try {
      // Determinar usuários alvo
      let targetUsers = trigger.targetUsers || [];
      
      if (trigger.broadcast && targetUsers.length === 0) {
        // Buscar todos os usuários ativos
        const allUsers = await query('SELECT id FROM users WHERE status = "active"');
        targetUsers = allUsers.map((u: any) => u.id);
      }

      // Criar notificação para cada usuário
      for (const userId of targetUsers) {
        // Inserir no banco
        const result = await query(`
          INSERT INTO notifications (
            user_id, title, message, type, priority, 
            related_id, related_type, read_status, is_read
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', FALSE)
        `, [
          userId, trigger.title, trigger.message, trigger.type,
          trigger.priority, trigger.relatedId, trigger.relatedType
        ]);

        const notificationId = (result as any).insertId;

        // Preparar dados da notificação
        const notificationData = {
          id: notificationId,
          user_id: userId,
          title: trigger.title,
          message: trigger.message,
          type: trigger.type,
          priority: trigger.priority,
          related_id: trigger.relatedId,
          related_type: trigger.relatedType,
          read_status: 'sent',
          is_read: false,
          created_at: new Date().toISOString()
        };

        // Enviar via WebSocket se servidor estiver disponível
        const wsServer = getNotificationServer();
        if (wsServer) {
          await wsServer.sendNotificationToUser(userId, notificationData);
        }

        console.log(`Notificação criada e enviada: ${trigger.title} para usuário ${userId}`);
      }

    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  }

  // Executar todas as verificações
  public async runAllChecks() {
    console.log('Iniciando verificações de integração de notificações...');
    
    await Promise.all([
      this.checkEquipmentStatusChanges(),
      this.checkServiceOrders(),
      this.checkSystemAlerts()
    ]);

    console.log('Verificações de integração concluídas');
  }

  // Métodos auxiliares
  private translateStatus(status: string): string {
    const translations: { [key: string]: string } = {
      'operational': 'Operacional',
      'maintenance_required': 'Requer Manutenção',
      'broken': 'Quebrado',
      'out_of_service': 'Fora de Serviço',
      'under_maintenance': 'Em Manutenção'
    };
    return translations[status] || status;
  }

  private formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  // Obter estatísticas de notificações
  public async getNotificationStats() {
    try {
      const stats = await query(`
        SELECT 
          type,
          priority,
          COUNT(*) as count,
          SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_count
        FROM notifications 
        WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY type, priority
        ORDER BY count DESC
      `);

      const totalStats = await query(`
        SELECT 
          COUNT(*) as total_notifications,
          SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as total_unread,
          COUNT(DISTINCT user_id) as users_with_notifications
        FROM notifications 
        WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      return {
        byTypeAndPriority: stats,
        totals: totalStats[0] || { total_notifications: 0, total_unread: 0, users_with_notifications: 0 }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { byTypeAndPriority: [], totals: { total_notifications: 0, total_unread: 0, users_with_notifications: 0 } };
    }
  }
}

// Instância global do serviço
let integrationService: NotificationIntegrationService | null = null;

export function getNotificationIntegrationService(): NotificationIntegrationService {
  if (!integrationService) {
    integrationService = new NotificationIntegrationService();
  }
  return integrationService;
}

// Função para inicializar verificações periódicas
export function startNotificationIntegrationChecks(intervalMinutes: number = 5) {
  const service = getNotificationIntegrationService();
  
  // Executar imediatamente
  service.runAllChecks();
  
  // Agendar execuções periódicas
  const interval = setInterval(() => {
    service.runAllChecks();
  }, intervalMinutes * 60 * 1000);

  console.log(`Verificações de integração iniciadas (intervalo: ${intervalMinutes} minutos)`);
  
  return interval;
}