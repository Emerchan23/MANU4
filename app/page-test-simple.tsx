"use client"

export default function HomePage() {
  console.log("HomePage renderizando...")
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          color: '#1f2937', 
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          Dashboard de Manutenção Hospitalar
        </h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '1.125rem',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          Sistema integrado de gestão de equipamentos médicos
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{ 
            backgroundColor: '#dbeafe', 
            padding: '20px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#1e40af', fontSize: '1.25rem', marginBottom: '8px' }}>
              Equipamentos Ativos
            </h3>
            <p style={{ color: '#3730a3', fontSize: '2rem', fontWeight: 'bold' }}>
              Loading...
            </p>
          </div>
          
          <div style={{ 
            backgroundColor: '#dcfce7', 
            padding: '20px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#166534', fontSize: '1.25rem', marginBottom: '8px' }}>
              Manutenções Pendentes
            </h3>
            <p style={{ color: '#14532d', fontSize: '2rem', fontWeight: 'bold' }}>
              Loading...
            </p>
          </div>
          
          <div style={{ 
            backgroundColor: '#fef3c7', 
            padding: '20px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#d97706', fontSize: '1.25rem', marginBottom: '8px' }}>
              Alertas Críticos
            </h3>
            <p style={{ color: '#92400e', fontSize: '2rem', fontWeight: 'bold' }}>
              Loading...
            </p>
          </div>
          
          <div style={{ 
            backgroundColor: '#e0e7ff', 
            padding: '20px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#4338ca', fontSize: '1.25rem', marginBottom: '8px' }}>
              Eficiência Operacional
            </h3>
            <p style={{ color: '#3730a3', fontSize: '2rem', fontWeight: 'bold' }}>
              Loading...
            </p>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#374151', fontSize: '1rem' }}>
            ✅ <strong>Status:</strong> Página principal carregada com sucesso!
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '8px' }}>
            Versão simplificada para teste - Componentes complexos temporariamente desabilitados
          </p>
        </div>
      </div>
    </div>
  )
}