"use client"

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('❌ Erro capturado pelo error.tsx:', error)
  }, [error])

  return (
    <div style={{
      padding: '40px 20px',
      backgroundColor: '#ffebee',
      color: '#c62828',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>
          ⚠️ Algo deu errado!
        </h1>
        
        <p style={{ fontSize: '1.1rem', marginBottom: '20px', color: '#666' }}>
          Ocorreu um erro inesperado na aplicação.
        </p>
        
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
          textAlign: 'left',
          fontSize: '0.9rem',
          fontFamily: 'monospace'
        }}>
          <strong>Detalhes do erro:</strong><br />
          {error.message || 'Erro desconhecido'}
          {error.digest && (
            <>
              <br />
              <strong>ID do erro:</strong> {error.digest}
            </>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔄 Tentar Novamente
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🏠 Ir para Início
          </button>
        </div>
        
        <p style={{ 
          marginTop: '20px', 
          fontSize: '0.9rem', 
          color: '#999' 
        }}>
          Se o problema persistir, entre em contato com o suporte técnico.
        </p>
      </div>
    </div>
  )
}