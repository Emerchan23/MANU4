try {
    Write-Host "🔍 Testando API de equipamentos..." -ForegroundColor Yellow
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/equipment/1" -Method GET -UseBasicParsing
    
    Write-Host "✅ Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📊 Content Type: $($response.Headers.'Content-Type')" -ForegroundColor Cyan
    Write-Host "📄 Response Body:" -ForegroundColor Cyan
    Write-Host $response.Content -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro ao testar API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}