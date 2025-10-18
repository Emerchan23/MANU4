// Teste do endpoint de geração de PDF
const testPDFGeneration = async () => {
  try {
    console.log('Testando endpoint /api/pdf/generate...')
    
    const testData = {
      type: 'service_order',
      data: {
        order_number: 'OS-TEST-001',
        equipment_name: 'Equipamento Teste',
        equipment_patrimonio: 'PAT001',
        sector_name: 'Setor Teste',
        subsector_name: 'Subsetor Teste',
        type: 'CORRETIVA',
        priority: 'ALTA',
        status: 'ABERTA',
        description: 'Teste de geração de PDF',
        requested_by: 'Usuário Teste',
        requested_by_email: 'teste@teste.com',
        assigned_to: 'Técnico Teste',
        assigned_to_email: 'tecnico@teste.com',
        company_name: 'Empresa Teste',
        company_cnpj: '00.000.000/0001-00',
        company_contact: 'Contato Teste',
        open_date: '01/01/2025',
        due_date: '15/01/2025',
        delivery_deadline: '20/01/2025',
        estimated_cost: 'R$ 500,00',
        warranty_days: 90,
        warranty_expiration: '15/04/2025',
        created_at: '01/01/2025',
        updated_at: '01/01/2025'
      }
    }
    
    const response = await fetch('http://localhost:3000/api/pdf/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    console.log('Status da resposta:', response.status)
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()))
    
    const result = await response.json()
    console.log('Resultado:', result)
    
    if (response.ok) {
      console.log('✅ Endpoint funcionando corretamente!')
      console.log('Arquivo gerado:', result.fileName)
      console.log('URL de download:', result.downloadUrl)
    } else {
      console.log('❌ Erro no endpoint:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error)
  }
}

// Executar teste
testPDFGeneration()