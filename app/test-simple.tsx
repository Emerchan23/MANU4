"use client"

export default function TestSimplePage() {
  console.log("TestSimplePage renderizando...")
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f0f0', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        Teste Simples - Dashboard Funcionando
      </h1>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Se você está vendo esta página, o Next.js está funcionando corretamente.
        </p>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Agora vamos testar os componentes gradualmente.
        </p>
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '4px' 
        }}>
          <strong style={{ color: '#2d5a2d' }}>Status:</strong> Página básica carregada com sucesso!
        </div>
      </div>
    </div>
  )
}