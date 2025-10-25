import { query } from './db'

/**
 * Gera o próximo número de ordem de serviço no formato OS-XXX/YYYY
 * @returns Promise<string> - Número da ordem no formato OS-001/2024
 */
export async function generateServiceOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  
  try {
    // Busca o último número de ordem do ano atual
    const rows = await query(`
      SELECT order_number 
      FROM service_orders 
      WHERE YEAR(created_at) = ? 
      ORDER BY id DESC 
      LIMIT 1
    `, [currentYear])
    
    let nextNumber = 1
    
    if (Array.isArray(rows) && rows.length > 0) {
      const lastOrder = rows[0] as { order_number: string }
      // Extrai o número sequencial do formato OS-XXX/YYYY
      const match = lastOrder.order_number.match(/OS-(\d+)\/\d{4}/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }
    
    // Formata o número com 3 dígitos (001, 002, etc.)
    const formattedNumber = nextNumber.toString().padStart(3, '0')
    
    return `OS-${formattedNumber}/${currentYear}`
  } catch (error) {
    console.error('Erro ao gerar número da ordem de serviço:', error)
    // Fallback: gera um número baseado no timestamp
    const timestamp = Date.now().toString().slice(-3)
    return `OS-${timestamp}/${currentYear}`
  }
}

/**
 * Valida se um número de ordem de serviço já existe
 * @param orderNumber - Número da ordem a ser validado
 * @returns Promise<boolean> - true se o número já existe
 */
export async function validateServiceOrderNumber(orderNumber: string): Promise<boolean> {
  try {
    const rows = await query(
      'SELECT id FROM service_orders WHERE order_number = ?',
      [orderNumber]
    )
    
    return Array.isArray(rows) && rows.length > 0
  } catch (error) {
    console.error('Erro ao validar número da ordem de serviço:', error)
    return false
  }
}

/**
 * Gera um número único de ordem de serviço, verificando duplicatas
 * @returns Promise<string> - Número único da ordem
 */
export async function generateUniqueServiceOrderNumber(): Promise<string> {
  let orderNumber = await generateServiceOrderNumber()
  let attempts = 0
  const maxAttempts = 10
  
  while (await validateServiceOrderNumber(orderNumber) && attempts < maxAttempts) {
    attempts++
    // Se o número já existe, incrementa e tenta novamente
    const currentYear = new Date().getFullYear()
    const match = orderNumber.match(/OS-(\d+)\/\d{4}/)
    if (match) {
      const nextNumber = parseInt(match[1]) + attempts
      const formattedNumber = nextNumber.toString().padStart(3, '0')
      orderNumber = `OS-${formattedNumber}/${currentYear}`
    }
  }
  
  if (attempts >= maxAttempts) {
    // Fallback final: usa timestamp
    const timestamp = Date.now().toString().slice(-6)
    const currentYear = new Date().getFullYear()
    orderNumber = `OS-${timestamp}/${currentYear}`
  }
  
  return orderNumber
}

/**
 * Formata o status da ordem de serviço para exibição
 * @param status - Status da ordem
 * @returns string - Status formatado
 */
export function formatServiceOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada'
  }
  
  return statusMap[status] || status
}

/**
 * Formata a prioridade da ordem de serviço para exibição
 * @param priority - Prioridade da ordem
 * @returns string - Prioridade formatada
 */
export function formatServiceOrderPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta'
  }
  
  return priorityMap[priority] || priority
}

/**
 * Formata o tipo de manutenção para exibição
 * @param type - Tipo de manutenção
 * @returns string - Tipo formatado
 */
export function formatMaintenanceType(type: string): string {
  const typeMap: Record<string, string> = {
    preventive: 'Preventiva',
    corrective: 'Corretiva',
    predictive: 'Preditiva'
  }
  
  return typeMap[type] || type
}

/**
 * Calcula o tempo decorrido desde a criação da ordem
 * @param createdAt - Data de criação da ordem
 * @returns string - Tempo decorrido formatado
 */
export function calculateElapsedTime(createdAt: string | Date): string {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffDays > 0) {
    return `${diffDays} dia${diffDays > 1 ? 's' : ''}`
  } else if (diffHours > 0) {
    return `${diffHours} hora${diffHours > 1 ? 's' : ''}`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`
  } else {
    return 'Agora mesmo'
  }
}