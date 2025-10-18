require('dotenv').config()
const mysql = require('mysql2/promise')

async function verifyAppointment() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('🔍 Verificando agendamentos criados...\n')
    
    // Buscar o último agendamento criado
    const [schedules] = await connection.execute(`
      SELECT 
        ms.*,
        e.name as equipment_name,
        u.name as user_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      ORDER BY ms.created_at DESC
      LIMIT 1
    `)

    if (schedules.length === 0) {
      console.log('❌ Nenhum agendamento encontrado!')
      return
    }

    const schedule = schedules[0]
    console.log('📋 ÚLTIMO AGENDAMENTO CRIADO:')
    console.log('=' .repeat(50))
    
    // Dados básicos
    console.log(`🆔 ID: ${schedule.id}`)
    console.log(`🔧 Equipamento: ${schedule.equipment_name || 'N/A'} (ID: ${schedule.equipment_id})`)
    console.log(`🔨 Tipo Manutenção: ${schedule.maintenance_type || 'N/A'}`)
    console.log(`👤 Responsável: ${schedule.user_name || 'N/A'} (ID: ${schedule.assigned_user_id})`)
    
    // Datas e prioridade
    console.log(`📅 Data Agendada: ${schedule.scheduled_date}`)
    console.log(`⚡ Prioridade: ${schedule.priority}`)
    console.log(`💰 Custo Estimado: R$ ${schedule.estimated_cost || '0.00'}`)
    
    // Descrição e observações
    console.log(`📝 Descrição: ${schedule.description || 'N/A'}`)
    console.log(`📋 Instruções: ${schedule.instructions || 'N/A'}`)
    
    // Status e datas de controle
    console.log(`📊 Status: ${schedule.status}`)
    console.log(`🕐 Criado em: ${schedule.created_at}`)
    console.log(`🔄 Atualizado em: ${schedule.updated_at}`)

    console.log('\n' + '=' .repeat(50))
    
    // Verificar campos obrigatórios
    console.log('\n✅ VERIFICAÇÃO DE CAMPOS:')
    const requiredFields = [
      { field: 'equipment_id', value: schedule.equipment_id, name: 'Equipamento' },
      { field: 'maintenance_type', value: schedule.maintenance_type, name: 'Tipo de Manutenção' },
      { field: 'assigned_user_id', value: schedule.assigned_user_id, name: 'Responsável' },
      { field: 'scheduled_date', value: schedule.scheduled_date, name: 'Data Agendada' },
      { field: 'priority', value: schedule.priority, name: 'Prioridade' },
      { field: 'description', value: schedule.description, name: 'Descrição' }
    ]

    let allFieldsOk = true
    requiredFields.forEach(field => {
      if (field.value) {
        console.log(`  ✅ ${field.name}: OK`)
      } else {
        console.log(`  ❌ ${field.name}: VAZIO`)
        allFieldsOk = false
      }
    })

    // Verificar campos opcionais
    console.log('\n📋 CAMPOS OPCIONAIS:')
    const optionalFields = [
      { field: 'maintenance_plan_id', value: schedule.maintenance_plan_id, name: 'Plano de Manutenção' },
      { field: 'estimated_cost', value: schedule.estimated_cost, name: 'Custo Estimado' },
      { field: 'instructions', value: schedule.instructions, name: 'Instruções' },
      { field: 'estimated_duration_hours', value: schedule.estimated_duration_hours, name: 'Duração Estimada' }
    ]

    optionalFields.forEach(field => {
      if (field.value) {
        console.log(`  ✅ ${field.name}: OK`)
      } else {
        console.log(`  ⚠️ ${field.name}: VAZIO`)
      }
    })

    console.log('\n' + '=' .repeat(50))
    if (allFieldsOk) {
      console.log('🎉 SUCESSO: Todos os campos obrigatórios foram salvos!')
    } else {
      console.log('⚠️ ATENÇÃO: Alguns campos obrigatórios estão vazios!')
    }

    // Contar total de agendamentos
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_schedules')
    console.log(`📊 Total de agendamentos no banco: ${count[0].total}`)

  } catch (error) {
    console.error('❌ Erro ao verificar agendamento:', error.message)
  } finally {
    await connection.end()
  }
}

verifyAppointment()