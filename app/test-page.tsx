export default function TestPage() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
      <h1>Teste de Página Simples</h1>
      <p>Se você consegue ver este texto, o problema não está no Next.js básico.</p>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Informações de Debug:</h2>
        <p>Timestamp: {new Date().toISOString()}</p>
        <p>Ambiente: {process.env.NODE_ENV}</p>
      </div>
    </div>
  )
}