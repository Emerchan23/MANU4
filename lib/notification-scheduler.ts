// Sistema de agendamento para verificações automáticas de notificações
import { getNotificationIntegrationService } from './notification-integrations';
import { query } from './database';

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  errorCount: number;
  lastError?: string;
}

export class NotificationScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeDefaultTasks();
  }

  // Inicializar tarefas padrão
  private initializeDefaultTasks() {
    // Verificações de equipamentos a cada 5 minutos
    this.addTask({
      id: 'equipment-status-check',
      name: 'Verificação de Status de Equipamentos',
      description: 'Verifica mudanças de status e equipamentos com problemas',
      cronExpression: '*/5 * * * *', // A cada 5 minutos
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    // Verificações de ordens de serviço a cada 10 minutos
    this.addTask({
      id: 'service-orders-check',
      name: 'Verificação de Ordens de Serviço',
      description: 'Verifica novas OS, OS vencidas e concluídas',
      cronExpression: '*/10 * * * *', // A cada 10 minutos
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    // Verificações de manutenções preventivas a cada 30 minutos
    this.addTask({
      id: 'preventive-maintenance-check',
      name: 'Verificação de Manutenções Preventivas',
      description: 'Verifica manutenções vencendo e vencidas',
      cronExpression: '*/30 * * * *', // A cada 30 minutos
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    // Alertas do sistema a cada hora
    this.addTask({
      id: 'system-alerts-check',
      name: 'Verificação de Alertas do Sistema',
      description: 'Verifica equipamentos negligenciados e problemas recorrentes',
      cronExpression: '0 * * * *', // A cada hora
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    // Limpeza de notificações antigas diariamente às 2h
    this.addTask({
      id: 'notification-cleanup',
      name: 'Limpeza de Notificações Antigas',
      description: 'Remove notificações antigas e otimiza banco de dados',
      cronExpression: '0 2 * * *', // Diariamente às 2h
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    // Relatório semanal às segundas-feiras às 8h
    this.addTask({
      id: 'weekly-report',
      name: 'Relatório Semanal de Notificações',
      description: 'Gera relatório semanal de atividades e notificações',
      cronExpression: '0 8 * * 1', // Segundas-feiras às 8h
      enabled: true,
      runCount: 0,
      errorCount: 0
    });
  }

  // Adicionar nova tarefa
  public addTask(task: ScheduledTask) {
    this.tasks.set(task.id, {
      ...task,
      nextRun: this.calculateNextRun(task.cronExpression)
    });
    
    if (this.isRunning && task.enabled) {
      this.scheduleTask(task.id);
    }
  }

  // Remover tarefa
  public removeTask(taskId: string) {
    this.tasks.delete(taskId);
    const interval = this.intervals.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(taskId);
    }
  }

  // Habilitar/desabilitar tarefa
  public toggleTask(taskId: string, enabled: boolean) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = enabled;
      
      if (enabled && this.isRunning) {
        this.scheduleTask(taskId);
      } else {
        const interval = this.intervals.get(taskId);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(taskId);
        }
      }
    }
  }

  // Iniciar agendador
  public start() {
    if (this.isRunning) {
      console.log('Agendador já está em execução');
      return;
    }

    this.isRunning = true;
    console.log('Iniciando agendador de notificações...');

    // Agendar todas as tarefas habilitadas
    for (const [taskId, task] of this.tasks) {
      if (task.enabled) {
        this.scheduleTask(taskId);
      }
    }

    console.log(`Agendador iniciado com ${this.intervals.size} tarefas ativas`);
  }

  // Parar agendador
  public stop() {
    if (!this.isRunning) {
      console.log('Agendador já está parado');
      return;
    }

    this.isRunning = false;
    console.log('Parando agendador de notificações...');

    // Limpar todos os intervalos
    for (const [taskId, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();

    console.log('Agendador parado');
  }

  // Agendar tarefa específica
  private scheduleTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task || !task.enabled) return;

    // Limpar intervalo existente se houver
    const existingInterval = this.intervals.get(taskId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Calcular intervalo em milissegundos baseado na expressão cron simplificada
    const intervalMs = this.cronToInterval(task.cronExpression);
    
    if (intervalMs > 0) {
      const interval = setInterval(async () => {
        await this.executeTask(taskId);
      }, intervalMs);

      this.intervals.set(taskId, interval);
      console.log(`Tarefa '${task.name}' agendada (intervalo: ${intervalMs}ms)`);
    }
  }

  // Executar tarefa
  private async executeTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task || !task.enabled) return;

    console.log(`Executando tarefa: ${task.name}`);
    
    try {
      task.lastRun = new Date();
      task.runCount++;
      task.nextRun = this.calculateNextRun(task.cronExpression);

      const integrationService = getNotificationIntegrationService();

      switch (taskId) {
        case 'equipment-status-check':
          await integrationService.checkEquipmentStatusChanges();
          break;

        case 'service-orders-check':
          await integrationService.checkServiceOrders();
          break;

        case 'preventive-maintenance-check':
          await integrationService.checkPreventiveMaintenances();
          break;

        case 'system-alerts-check':
          await integrationService.checkSystemAlerts();
          break;

        case 'notification-cleanup':
          await this.cleanupOldNotifications();
          break;

        case 'weekly-report':
          await this.generateWeeklyReport();
          break;

        default:
          console.warn(`Tarefa desconhecida: ${taskId}`);
      }

      // Limpar erro anterior se a execução foi bem-sucedida
      if (task.lastError) {
        task.lastError = undefined;
      }

      console.log(`Tarefa '${task.name}' executada com sucesso`);

    } catch (error) {
      task.errorCount++;
      task.lastError = error instanceof Error ? error.message : String(error);
      console.error(`Erro ao executar tarefa '${task.name}':`, error);
    }
  }

  // Executar tarefa manualmente
  public async runTaskNow(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Tarefa não encontrada: ${taskId}`);
    }

    console.log(`Executando tarefa manualmente: ${task.name}`);
    await this.executeTask(taskId);
  }

  // Limpeza de notificações antigas
  private async cleanupOldNotifications() {
    try {
      // Remover notificações lidas com mais de 30 dias
      const deletedRead = await query(`
        DELETE FROM notifications 
        WHERE is_read = TRUE 
        AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      // Remover notificações não lidas com mais de 90 dias
      const deletedUnread = await query(`
        DELETE FROM notifications 
        WHERE is_read = FALSE 
        AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
      `);

      // Remover subscriptions push inativas há mais de 60 dias
      const deletedSubscriptions = await query(`
        DELETE FROM push_subscriptions 
        WHERE updated_at < DATE_SUB(NOW(), INTERVAL 60 DAY)
      `);

      console.log(`Limpeza concluída: ${(deletedRead as any).affectedRows} notificações lidas, ${(deletedUnread as any).affectedRows} não lidas, ${(deletedSubscriptions as any).affectedRows} subscriptions removidas`);

    } catch (error) {
      console.error('Erro na limpeza de notificações:', error);
      throw error;
    }
  }

  // Gerar relatório semanal
  private async generateWeeklyReport() {
    try {
      const stats = await getNotificationIntegrationService().getNotificationStats();
      
      // Buscar administradores para enviar o relatório
      const admins = await query(`
        SELECT id FROM users 
        WHERE role IN ('admin', 'manager') 
        AND status = 'active'
      `);

      const reportMessage = `
        Relatório Semanal de Notificações:
        - Total de notificações: ${stats.totals.total_notifications}
        - Não lidas: ${stats.totals.total_unread}
        - Usuários com notificações: ${stats.totals.users_with_notifications}
        
        Principais tipos:
        ${stats.byTypeAndPriority.slice(0, 5).map((s: any) => 
          `- ${s.type} (${s.priority}): ${s.count} total, ${s.unread_count} não lidas`
        ).join('\n')}
      `;

      // Criar notificação para cada administrador
      for (const admin of admins) {
        await query(`
          INSERT INTO notifications (
            user_id, title, message, type, priority, 
            related_id, related_type, read_status, is_read
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', FALSE)
        `, [
          admin.id, 'Relatório Semanal de Notificações', reportMessage.trim(),
          'system_alert', 'low', 0, 'system'
        ]);
      }

      console.log(`Relatório semanal enviado para ${admins.length} administradores`);

    } catch (error) {
      console.error('Erro ao gerar relatório semanal:', error);
      throw error;
    }
  }

  // Converter expressão cron simplificada para intervalo em ms
  private cronToInterval(cronExpression: string): number {
    // Implementação simplificada para casos comuns
    // Formato: minuto hora dia mês dia_semana
    
    if (cronExpression === '*/5 * * * *') return 5 * 60 * 1000; // 5 minutos
    if (cronExpression === '*/10 * * * *') return 10 * 60 * 1000; // 10 minutos
    if (cronExpression === '*/30 * * * *') return 30 * 60 * 1000; // 30 minutos
    if (cronExpression === '0 * * * *') return 60 * 60 * 1000; // 1 hora
    if (cronExpression === '0 2 * * *') return 24 * 60 * 60 * 1000; // 24 horas (executar às 2h)
    if (cronExpression === '0 8 * * 1') return 7 * 24 * 60 * 60 * 1000; // 7 dias (segundas às 8h)
    
    // Padrão: 5 minutos
    return 5 * 60 * 1000;
  }

  // Calcular próxima execução
  private calculateNextRun(cronExpression: string): Date {
    const intervalMs = this.cronToInterval(cronExpression);
    return new Date(Date.now() + intervalMs);
  }

  // Obter status de todas as tarefas
  public getTasksStatus(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  // Obter estatísticas do agendador
  public getSchedulerStats() {
    const tasks = Array.from(this.tasks.values());
    const enabledTasks = tasks.filter(t => t.enabled);
    const totalRuns = tasks.reduce((sum, t) => sum + t.runCount, 0);
    const totalErrors = tasks.reduce((sum, t) => sum + t.errorCount, 0);

    return {
      isRunning: this.isRunning,
      totalTasks: tasks.length,
      enabledTasks: enabledTasks.length,
      activeTasks: this.intervals.size,
      totalRuns,
      totalErrors,
      errorRate: totalRuns > 0 ? (totalErrors / totalRuns * 100).toFixed(2) + '%' : '0%'
    };
  }

  // Reiniciar agendador
  public restart() {
    console.log('Reiniciando agendador...');
    this.stop();
    setTimeout(() => {
      this.start();
    }, 1000);
  }
}

// Instância global do agendador
let scheduler: NotificationScheduler | null = null;

export function getNotificationScheduler(): NotificationScheduler {
  if (!scheduler) {
    scheduler = new NotificationScheduler();
  }
  return scheduler;
}

// Inicializar agendador automaticamente
export function startNotificationScheduler(): NotificationScheduler {
  const schedulerInstance = getNotificationScheduler();
  schedulerInstance.start();
  return schedulerInstance;
}

// Parar agendador
export function stopNotificationScheduler() {
  if (scheduler) {
    scheduler.stop();
  }
}