'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Upload, 

  Download, 
  Trash2, 
  Save, 
  RefreshCw, 
  Image as ImageIcon, 
  Palette, 
  Layout, 
  FileText,
  Building2,
  Settings2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'


interface PDFSettings {
  // Cabeçalho
  header_enabled?: boolean
  header_title?: string
  header_subtitle?: string
  header_bg_color?: string
  header_text_color?: string
  header_height?: number
  header_font_size?: number
  header_subtitle_font_size?: number
  
  // Logo
  logo_enabled?: boolean
  logo_position?: string
  logo_width?: number
  logo_height?: number
  logo_margin_x?: number
  logo_margin_y?: number
  
  // Empresa
  company_name?: string
  company_cnpj?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  
  // Rodapé
  footer_enabled?: boolean
  footer_text?: string
  footer_bg_color?: string
  footer_text_color?: string
  footer_height?: number
  
  // Configurações gerais
  show_date?: boolean
  show_page_numbers?: boolean
  margin_top?: number
  margin_bottom?: number
  margin_left?: number
  margin_right?: number
  
  // Cores
  primary_color?: string
  secondary_color?: string
  text_color?: string
  border_color?: string
  background_color?: string
  
  // Assinatura
  signature_enabled?: boolean
  signature_field1_label?: string
  signature_field2_label?: string
}

interface CompanyLogo {
  id: number
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  original_name: string
  is_active: boolean
  created_at: string
}

export default function PDFCustomization() {
  const [settings, setSettings] = useState<PDFSettings>({
    header_enabled: true,
    header_title: 'ORDEM DE SERVIÇO',
    header_subtitle: 'Sistema de Manutenção',
    header_bg_color: '#3b82f6',
    header_text_color: '#ffffff',
    header_height: 80,
    header_font_size: 24,
    header_subtitle_font_size: 14,
    logo_enabled: true,
    logo_position: 'left',
    logo_width: 60,
    logo_height: 60,
    logo_margin_x: 20,
    logo_margin_y: 10,
    company_name: 'FUNDO MUNICIPAL DE SAÚDE DE CHAPADÃO DO CÉU',
    company_cnpj: '07.729.810/0001-22',
    company_address: 'Chapadão do Céu - GO',
    company_phone: '',
    company_email: '',
    footer_enabled: true,
    footer_text: 'Documento gerado automaticamente pelo sistema',
    footer_bg_color: '#f8f9fa',
    footer_text_color: '#6b7280',
    footer_height: 40,
    show_date: true,
    show_page_numbers: true,
    margin_top: 20,
    margin_bottom: 20,
    margin_left: 20,
    margin_right: 20,
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
    text_color: '#1f2937',
    border_color: '#e5e7eb',
    background_color: '#ffffff',
    signature_enabled: true,
    signature_field1_label: 'Responsável pela Execução',
    signature_field2_label: 'Supervisor/Aprovador'
  })

  const [currentLogo, setCurrentLogo] = useState<CompanyLogo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar configurações e logo atual
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSettings(),
        loadCurrentLogo()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/pdf/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const loadCurrentLogo = async () => {
    try {
      const response = await fetch('/api/pdf/logo');
      const data = await response.json()
      
      if (data.success && data.logo) {
        setCurrentLogo(data.logo)
      }
    } catch (error) {
      console.error('Erro ao carregar logo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/pdf/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Configurações salvas com sucesso!')
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      } else {
        toast.error(data.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use PNG, JPG, GIF, WebP ou SVG.')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5MB')
      return
    }

    try {
      setUploadingLogo(true)
      setUploadProgress(0)
      
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/pdf/logo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Logo enviado com sucesso!')
        await loadCurrentLogo() // Recarregar logo atual
        setUploadProgress(100)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao enviar logo')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar logo')
    } finally {
      setUploadingLogo(false)
      setUploadProgress(0)
      // Limpar input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleRemoveLogo = async () => {
    if (!currentLogo) return

    try {
      setUploadingLogo(true)
      const response = await fetch(`/api/pdf/logo?id=${currentLogo.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCurrentLogo(null)
        toast.success('Logo removido com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao remover logo')
      }
    } catch (error) {
      console.error('Erro ao remover logo:', error)
      toast.error('Erro ao remover logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSaveCompanyData = async () => {
    if (!companyData) return

    try {
      setSaving(true)
      const response = await fetch('/api/pdf/company', {
        method: companyData.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      })

      if (response.ok) {
        toast.success('Dados da empresa salvos com sucesso!')
        await loadCompanyData() // Recarregar dados
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar dados da empresa')
      }
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error)
      toast.error('Erro ao salvar dados da empresa')
    } finally {
      setSaving(false)
    }
  }

  const generatePreview = () => {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        {/* Cabeçalho Preview */}
        {settings.header_enabled && (
          <div 
            className="flex items-center justify-between p-4 rounded-t-lg mb-4"
            style={{
              backgroundColor: settings.header_bg_color,
              color: settings.header_text_color,
              height: `${settings.header_height}px`
            }}
          >
            <div className="flex items-center gap-4">
              {settings.logo_enabled && currentLogo && (
                <div 
                  className="flex-shrink-0"
                  style={{
                    marginLeft: `${settings.logo_margin_x}px`,
                    marginTop: `${settings.logo_margin_y}px`
                  }}
                >
                  <img 
                    src={currentLogo.file_path} 
                    alt="Logo"
                    style={{
                      width: `${settings.logo_width}px`,
                      height: `${settings.logo_height}px`,
                      objectFit: 'contain'
                    }}
                  />
                </div>
              )}
              <div>
                <h1 style={{ fontSize: `${settings.header_font_size}px`, margin: 0, fontWeight: 'bold' }}>
                  {settings.header_title}
                </h1>
                {settings.header_subtitle && (
                  <p style={{ fontSize: `${settings.header_subtitle_font_size}px`, margin: 0, opacity: 0.9 }}>
                    {settings.header_subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">NÚMERO OS</div>
              <div className="text-lg font-bold">OS-TEST-002</div>
            </div>
          </div>
        )}

        {/* Dados da Empresa Preview */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2" style={{ color: settings.primary_color }}>
            DADOS DA EMPRESA
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Razão Social:</strong> {settings.company_name}</div>
            <div><strong>CNPJ:</strong> {settings.company_cnpj}</div>
            <div><strong>Endereço:</strong> {settings.company_address}</div>
            {settings.company_phone && (
              <div><strong>Telefone:</strong> {settings.company_phone}</div>
            )}
          </div>
        </div>

        {/* Conteúdo de exemplo */}
        <div className="mb-4 p-3 border rounded" style={{ borderColor: settings.border_color }}>
          <h3 className="font-semibold mb-2" style={{ color: settings.primary_color }}>
            DETALHES DA ORDEM DE SERVIÇO
          </h3>
          <div className="text-sm space-y-1">
            <div>Tipo de Manutenção: Preventiva</div>
            <div>Equipamento: Ar Condicionado</div>
            <div>Local: Sala de Reuniões</div>
          </div>
        </div>

        {/* Assinaturas Preview */}
        {settings.signature_enabled && (
          <div className="mt-6 grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <div className="text-sm font-medium">{settings.signature_field1_label}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <div className="text-sm font-medium">{settings.signature_field2_label}</div>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé Preview */}
        {settings.footer_enabled && (
          <div 
            className="mt-4 p-2 text-center text-sm rounded-b-lg"
            style={{
              backgroundColor: settings.footer_bg_color,
              color: settings.footer_text_color,
              height: `${settings.footer_height}px`
            }}
          >
            {settings.footer_text}
            {settings.show_page_numbers && (
              <span className="ml-4">Página 1 de 1</span>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Carregando configurações...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personalização de PDF</h2>
          <p className="text-muted-foreground">
            Configure o cabeçalho, logo e dados da empresa para os documentos PDF
          </p>
        </div>
        <div className="flex gap-2">

          <Button
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={() => loadAllData()}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recarregar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <div className="space-y-6">
          <Tabs defaultValue="header" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="header">
                  <FileText className="h-4 w-4 mr-1" />
                  Cabeçalho
                </TabsTrigger>
                <TabsTrigger value="logo">
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Logo
                </TabsTrigger>
                <TabsTrigger value="company">
                  <Building2 className="h-4 w-4 mr-1" />
                  Empresa
                </TabsTrigger>
                <TabsTrigger value="colors">
                  <Palette className="h-4 w-4 mr-1" />
                  Cores
                </TabsTrigger>
                <TabsTrigger value="layout">
                  <Layout className="h-4 w-4 mr-1" />
                  Layout
                </TabsTrigger>
              </TabsList>

            {/* Tab Cabeçalho */}
            <TabsContent value="header" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Configurações do Cabeçalho
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="header-enabled"
                      checked={settings.header_enabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, header_enabled: checked }))
                      }
                    />
                    <Label htmlFor="header-enabled">Habilitar cabeçalho</Label>
                  </div>

                  {settings.header_enabled && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="header-title">Título Principal</Label>
                          <Input
                            id="header-title"
                            value={settings.header_title}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, header_title: e.target.value }))
                            }
                            placeholder="Ex: ORDEM DE SERVIÇO"
                          />
                        </div>
                        <div>
                          <Label htmlFor="header-subtitle">Subtítulo</Label>
                          <Input
                            id="header-subtitle"
                            value={settings.header_subtitle}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, header_subtitle: e.target.value }))
                            }
                            placeholder="Ex: Sistema de Manutenção"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="header-bg-color">Cor de Fundo</Label>
                          <div className="flex gap-2">
                            <Input
                              id="header-bg-color"
                              type="color"
                              value={settings.header_bg_color}
                              onChange={(e) => 
                                setSettings(prev => ({ ...prev, header_bg_color: e.target.value }))
                              }
                              className="w-16 h-10 p-1"
                            />
                            <Input
                              value={settings.header_bg_color}
                              onChange={(e) => 
                                setSettings(prev => ({ ...prev, header_bg_color: e.target.value }))
                              }
                              placeholder="#3b82f6"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="header-text-color">Cor do Texto</Label>
                          <div className="flex gap-2">
                            <Input
                              id="header-text-color"
                              type="color"
                              value={settings.header_text_color}
                              onChange={(e) => 
                                setSettings(prev => ({ ...prev, header_text_color: e.target.value }))
                              }
                              className="w-16 h-10 p-1"
                            />
                            <Input
                              value={settings.header_text_color}
                              onChange={(e) => 
                                setSettings(prev => ({ ...prev, header_text_color: e.target.value }))
                              }
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="header-height">Altura (px)</Label>
                          <Input
                            id="header-height"
                            type="number"
                            value={settings.header_height}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, header_height: parseInt(e.target.value) }))
                            }
                            min="40"
                            max="200"
                          />
                        </div>
                        <div>
                          <Label htmlFor="header-font-size">Tamanho Título</Label>
                          <Input
                            id="header-font-size"
                            type="number"
                            value={settings.header_font_size}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, header_font_size: parseInt(e.target.value) }))
                            }
                            min="12"
                            max="48"
                          />
                        </div>
                        <div>
                          <Label htmlFor="header-subtitle-font-size">Tamanho Subtítulo</Label>
                          <Input
                            id="header-subtitle-font-size"
                            type="number"
                            value={settings.header_subtitle_font_size}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, header_subtitle_font_size: parseInt(e.target.value) }))
                            }
                            min="8"
                            max="24"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Logo */}
            <TabsContent value="logo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Gerenciamento de Logo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="logo-enabled"
                      checked={settings.logo_enabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, logo_enabled: checked }))
                      }
                    />
                    <Label htmlFor="logo-enabled">Exibir logo no PDF</Label>
                  </div>

                  {/* Upload de Logo */}
                  <div className="space-y-4">
                    <div>
                      <Label>Logo Atual</Label>
                      {currentLogo ? (
                        <div className="mt-2 p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="relative w-20 h-20 border rounded">
                              <Image
                                src={currentLogo.file_path}
                                alt="Logo atual"
                                fill
                                className="object-contain"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{currentLogo.original_name}</p>
                              <p className="text-sm text-gray-500">
                                {(currentLogo.file_size / 1024).toFixed(1)} KB
                              </p>
                              <p className="text-sm text-gray-500">
                                {currentLogo.mime_type}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleRemoveLogo}
                              disabled={uploadingLogo}
                            >
                              {uploadingLogo ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 p-8 border-2 border-dashed rounded-lg text-center">
                          <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">Nenhum logo carregado</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="logo-upload">Novo Logo</Label>
                      <div className="mt-2">
                        <input
                          ref={fileInputRef}
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="w-full"
                        >
                          {uploadingLogo ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Selecionar Logo
                            </>
                          )}
                        </Button>
                        <p className="text-sm text-gray-500 mt-1">
                          Formatos aceitos: PNG, JPG, GIF, WebP (máx. 5MB)
                        </p>
                      </div>
                    </div>

                    {/* Configurações do Logo */}
                    {settings.logo_enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="logo-width">Largura (px)</Label>
                          <Input
                            id="logo-width"
                            type="number"
                            value={settings.logo_width}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, logo_width: parseInt(e.target.value) }))
                            }
                            min="20"
                            max="200"
                          />
                        </div>
                        <div>
                          <Label htmlFor="logo-height">Altura (px)</Label>
                          <Input
                            id="logo-height"
                            type="number"
                            value={settings.logo_height}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, logo_height: parseInt(e.target.value) }))
                            }
                            min="20"
                            max="200"
                          />
                        </div>
                        <div>
                          <Label htmlFor="logo-margin-x">Margem X (px)</Label>
                          <Input
                            id="logo-margin-x"
                            type="number"
                            value={settings.logo_margin_x}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, logo_margin_x: parseInt(e.target.value) }))
                            }
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="logo-margin-y">Margem Y (px)</Label>
                          <Input
                            id="logo-margin-y"
                            type="number"
                            value={settings.logo_margin_y}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, logo_margin_y: parseInt(e.target.value) }))
                            }
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Empresa */}
            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Empresa</CardTitle>
                  <CardDescription>
                    Configure as informações da empresa que aparecerão no PDF
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-name">Nome da Empresa</Label>
                      <Input
                        id="company-name"
                        value={settings.company_name}
                        onChange={(e) =>
                          setSettings({ ...settings, company_name: e.target.value })
                        }
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company-cnpj">CNPJ</Label>
                      <Input
                        id="company-cnpj"
                        value={settings.company_cnpj}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
                          let formattedValue = '';
                          
                          if (value.length <= 14) {
                            // Aplica a máscara XX.XXX.XXX/XXXX-XX
                            formattedValue = value
                              .replace(/(\d{2})(\d)/, '$1.$2')
                              .replace(/(\d{3})(\d)/, '$1.$2')
                              .replace(/(\d{3})(\d)/, '$1/$2')
                              .replace(/(\d{4})(\d)/, '$1-$2');
                          }
                          
                          setSettings({ ...settings, company_cnpj: formattedValue });
                        }}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company-address">Endereço</Label>
                    <Textarea
                      id="company-address"
                      value={settings.company_address}
                      onChange={(e) =>
                        setSettings({ ...settings, company_address: e.target.value })
                      }
                      placeholder="Endereço completo da empresa"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-phone">Telefone</Label>
                      <Input
                        id="company-phone"
                        value={settings.company_phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
                          let formattedValue = '';
                          
                          if (value.length <= 11) {
                            if (value.length <= 10) {
                              // Formato (XX) XXXX-XXXX para telefone fixo
                              formattedValue = value
                                .replace(/(\d{2})(\d)/, '($1) $2')
                                .replace(/(\d{4})(\d)/, '$1-$2');
                            } else {
                              // Formato (XX) XXXXX-XXXX para celular
                              formattedValue = value
                                .replace(/(\d{2})(\d)/, '($1) $2')
                                .replace(/(\d{5})(\d)/, '$1-$2');
                            }
                          }
                          
                          setSettings({ ...settings, company_phone: formattedValue });
                        }}
                        placeholder="(00) 0000-0000"
                        maxLength={15}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company-email">Email</Label>
                      <Input
                        id="company-email"
                        type="email"
                        value={settings.company_email}
                        onChange={(e) =>
                          setSettings({ ...settings, company_email: e.target.value })
                        }
                        placeholder="contato@empresa.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Cores */}
            <TabsContent value="colors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Esquema de Cores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary-color">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={settings.primary_color}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, primary_color: e.target.value }))
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.primary_color}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, primary_color: e.target.value }))
                          }
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondary-color">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={settings.secondary_color}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, secondary_color: e.target.value }))
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.secondary_color}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, secondary_color: e.target.value }))
                          }
                          placeholder="#10b981"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="text-color">Cor do Texto</Label>
                      <div className="flex gap-2">
                        <Input
                          id="text-color"
                          type="color"
                          value={settings.text_color}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, text_color: e.target.value }))
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.text_color}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, text_color: e.target.value }))
                          }
                          placeholder="#1f2937"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="border-color">Cor das Bordas</Label>
                      <div className="flex gap-2">
                        <Input
                          id="border-color"
                          type="color"
                          value={settings.border_color}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, border_color: e.target.value }))
                          }
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.border_color}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, border_color: e.target.value }))
                          }
                          placeholder="#e5e7eb"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Layout */}
            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Configurações de Layout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show-date"
                        checked={settings.show_date}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, show_date: checked }))
                        }
                      />
                      <Label htmlFor="show-date">Mostrar data</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show-page-numbers"
                        checked={settings.show_page_numbers}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, show_page_numbers: checked }))
                        }
                      />
                      <Label htmlFor="show-page-numbers">Numeração de páginas</Label>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Margens do Documento (mm)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="margin-top">Superior</Label>
                        <Input
                          id="margin-top"
                          type="number"
                          value={settings.margin_top}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, margin_top: parseInt(e.target.value) }))
                          }
                          min="10"
                          max="50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="margin-bottom">Inferior</Label>
                        <Input
                          id="margin-bottom"
                          type="number"
                          value={settings.margin_bottom}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, margin_bottom: parseInt(e.target.value) }))
                          }
                          min="10"
                          max="50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="margin-left">Esquerda</Label>
                        <Input
                          id="margin-left"
                          type="number"
                          value={settings.margin_left}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, margin_left: parseInt(e.target.value) }))
                          }
                          min="10"
                          max="50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="margin-right">Direita</Label>
                        <Input
                          id="margin-right"
                          type="number"
                          value={settings.margin_right}
                          onChange={(e) => 
                            setSettings(prev => ({ ...prev, margin_right: parseInt(e.target.value) }))
                          }
                          min="10"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Switch
                        id="signature-enabled"
                        checked={settings.signature_enabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, signature_enabled: checked }))
                        }
                      />
                      <Label htmlFor="signature-enabled">Campos de assinatura</Label>
                    </div>

                    {settings.signature_enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signature-field1">Campo 1</Label>
                          <Input
                            id="signature-field1"
                            value={settings.signature_field1_label}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, signature_field1_label: e.target.value }))
                            }
                            placeholder="Ex: Responsável pela Execução"
                          />
                        </div>
                        <div>
                          <Label htmlFor="signature-field2">Campo 2</Label>
                          <Input
                            id="signature-field2"
                            value={settings.signature_field2_label}
                            onChange={(e) => 
                              setSettings(prev => ({ ...prev, signature_field2_label: e.target.value }))
                            }
                            placeholder="Ex: Supervisor/Aprovador"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>


      </div>
    </div>
  )
}