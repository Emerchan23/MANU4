'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Eye, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface PDFPreviewProps {
  settings?: any
  companyData?: any
  logoData?: any
  onRefresh?: () => void
}

export default function PDFPreview({ 
  settings, 
  companyData, 
  logoData, 
  onRefresh 
}: PDFPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePreview = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/pdf/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings,
          companyData,
          logoData,
          sampleData: {
            numero: 'OS-PREVIEW-001',
            data: new Date().toLocaleDateString('pt-BR'),
            cliente: 'Cliente Exemplo',
            equipamento: 'Equipamento de Teste',
            descricao: 'Esta é uma prévia do documento PDF com as configurações atuais.',
            tecnico: 'Técnico Responsável',
            observacoes: 'Observações de exemplo para demonstração do layout.'
          }
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.pdf) {
          // O PDF vem como data URI (data:application/pdf;base64,...)
          setPreviewUrl(result.pdf)
        } else {
          throw new Error(result.error || 'Erro ao gerar preview')
        }
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao gerar preview')
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      toast.error('Erro ao gerar preview do PDF')
    } finally {
      setLoading(false)
    }
  }

  const downloadPreview = () => {
    if (previewUrl) {
      const link = document.createElement('a')
      link.href = previewUrl
      link.download = 'preview-ordem-servico.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  useEffect(() => {
    // Gerar preview automaticamente quando os dados mudarem
    if (settings || companyData || logoData) {
      generatePreview()
    }
  }, [settings, companyData, logoData])

  // Cleanup da URL quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview do PDF
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generatePreview}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            {previewUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPreview}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Visualização em tempo real das suas configurações
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Gerando preview...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-96 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">Erro ao gerar preview</p>
              <p className="text-xs text-red-500">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={generatePreview}
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}

        {previewUrl && !loading && !error && (
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
              <span className="text-sm text-gray-600">Preview do PDF</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="text-xs"
                >
                  Abrir em nova aba
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadPreview}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <iframe
              src={previewUrl}
              className="w-full h-96"
              title="Preview do PDF"
              style={{ border: 'none' }}
            />
          </div>
        )}

        {!previewUrl && !loading && !error && (
          <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Eye className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 mb-2">Nenhum preview disponível</p>
              <Button onClick={generatePreview}>
                Gerar Preview
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}