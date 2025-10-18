'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Eye, Download, Save, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PDFSettings {
  pdf_header_enabled: boolean;
  pdf_header_text: string;
  pdf_footer_enabled: boolean;
  pdf_footer_text: string;
  pdf_logo_enabled: boolean;
  pdf_company_name: string;
  pdf_company_address: string;
  pdf_show_date: boolean;
  pdf_show_page_numbers: boolean;
  pdf_margin_top: number;
  pdf_margin_bottom: number;
  pdf_margin_left: number;
  pdf_margin_right: number;
  // Novas configurações de cores
  pdf_primary_color: string;
  pdf_secondary_color: string;
  pdf_text_color: string;
  pdf_background_color: string;
  // Configurações de assinatura
  pdf_signature_enabled: boolean;
  pdf_signature_field1_text: string;
  pdf_signature_field2_text: string;
}

interface LogoInfo {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  width: number;
  height: number;
  created_at: string;
}

export default function PDFCustomization() {
  const [settings, setSettings] = useState<PDFSettings>({
    pdf_header_enabled: true,
    pdf_header_text: 'Sistema de Manutenção Hospitalar',
    pdf_footer_enabled: true,
    pdf_footer_text: 'Relatório gerado automaticamente pelo sistema',
    pdf_logo_enabled: true,
    pdf_company_name: 'Hospital',
    pdf_company_address: '',
    pdf_show_date: true,
    pdf_show_page_numbers: true,
    pdf_margin_top: 20,
    pdf_margin_bottom: 20,
    pdf_margin_left: 15,
    pdf_margin_right: 15,
    // Valores padrão para cores
    pdf_primary_color: '#2980b9',
    pdf_secondary_color: '#3498db',
    pdf_text_color: '#000000',
    pdf_background_color: '#ffffff',
    // Valores padrão para assinaturas
    pdf_signature_enabled: true,
    pdf_signature_field1_text: 'Responsável pela Execução',
    pdf_signature_field2_text: 'Supervisor/Aprovador',
  });

  const [currentLogo, setCurrentLogo] = useState<LogoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar configurações e logo atual
  useEffect(() => {
    loadSettings();
    loadCurrentLogo();
  }, []);

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
      if (response.ok) {
        const data = await response.json();
        console.log('Logo data received:', data);
        if (data.logo) {
          setCurrentLogo(data.logo);
        }
      } else {
        console.error('Failed to load logo:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
    }
  };

  const handleSettingChange = (key: keyof PDFSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/pdf/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleLogoUpload = async (file: File) => {
    // Validar arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Tipo de arquivo não suportado. Use PNG, JPEG, JPG ou SVG.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      setMessage({ type: 'error', text: 'Arquivo muito grande. Tamanho máximo: 2MB.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/pdf/logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentLogo(result.logo);
        setMessage({ type: 'success', text: 'Logo enviado com sucesso!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar logo');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao enviar logo' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogo) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/pdf/logo?id=${currentLogo.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCurrentLogo(null);
        setMessage({ type: 'success', text: 'Logo removido com sucesso!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover logo');
      }
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao remover logo' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewPDF = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      setMessage({ type: 'success', text: 'Gerando preview do PDF...' });
      
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'preview',
          data: {
            title: 'Preview do Template PDF',
            subtitle: 'Exemplo de documento com as configurações atuais',
            settings: settings, // Incluir configurações atuais
            data: [
              { item: 'Item de exemplo 1', valor: 'Valor 1' },
              { item: 'Item de exemplo 2', valor: 'Valor 2' },
              { item: 'Item de exemplo 3', valor: 'Valor 3' }
            ],
            summary: {
              total: 3,
              observacoes: 'Este é um exemplo de como o PDF será gerado com as configurações atuais.'
            }
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.downloadUrl) {
          setMessage({ type: 'success', text: 'Preview gerado com sucesso! Abrindo em nova aba...' });
          setTimeout(() => {
            window.open(result.downloadUrl, '_blank');
            setMessage(null);
          }, 1000);
        } else {
          throw new Error('URL de download não encontrada na resposta');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro detalhado ao gerar preview:', error);
      setMessage({ 
        type: 'error', 
        text: `Erro ao gerar preview do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      pdf_header_enabled: true,
      pdf_header_text: 'Sistema de Manutenção Hospitalar',
      pdf_footer_enabled: true,
      pdf_footer_text: 'Relatório gerado automaticamente pelo sistema',
      pdf_logo_enabled: true,
      pdf_company_name: 'Hospital',
      pdf_company_address: '',
      pdf_show_date: true,
      pdf_show_page_numbers: true,
      pdf_margin_top: 20,
      pdf_margin_bottom: 20,
      pdf_margin_left: 15,
      pdf_margin_right: 15,
      // Valores padrão para cores
      pdf_primary_color: '#2980b9',
      pdf_secondary_color: '#3498db',
      pdf_text_color: '#000000',
      pdf_background_color: '#ffffff',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personalização de Documentos PDF</h2>
          <p className="text-muted-foreground">
            Configure a aparência e o layout dos documentos PDF gerados pelo sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreviewPDF}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrões
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="layout" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="layout">Layout e Margens</TabsTrigger>
          <TabsTrigger value="colors">Cores</TabsTrigger>
          <TabsTrigger value="header">Cabeçalho</TabsTrigger>
          <TabsTrigger value="footer">Rodapé</TabsTrigger>
          <TabsTrigger value="logo">Logo e Empresa</TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Layout</CardTitle>
              <CardDescription>
                Configure as margens e elementos visuais dos documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="margin-top">Margem Superior (mm)</Label>
                  <Input
                    id="margin-top"
                    type="number"
                    value={settings.pdf_margin_top}
                    onChange={(e) => handleSettingChange('pdf_margin_top', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin-bottom">Margem Inferior (mm)</Label>
                  <Input
                    id="margin-bottom"
                    type="number"
                    value={settings.pdf_margin_bottom}
                    onChange={(e) => handleSettingChange('pdf_margin_bottom', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin-left">Margem Esquerda (mm)</Label>
                  <Input
                    id="margin-left"
                    type="number"
                    value={settings.pdf_margin_left}
                    onChange={(e) => handleSettingChange('pdf_margin_left', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin-right">Margem Direita (mm)</Label>
                  <Input
                    id="margin-right"
                    type="number"
                    value={settings.pdf_margin_right}
                    onChange={(e) => handleSettingChange('pdf_margin_right', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-date"
                    checked={settings.pdf_show_date}
                    onCheckedChange={(checked) => handleSettingChange('pdf_show_date', checked)}
                  />
                  <Label htmlFor="show-date">Mostrar data de geração</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-page-numbers"
                    checked={settings.pdf_show_page_numbers}
                    onCheckedChange={(checked) => handleSettingChange('pdf_show_page_numbers', checked)}
                  />
                  <Label htmlFor="show-page-numbers">Mostrar numeração de páginas</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Cores</CardTitle>
              <CardDescription>
                Personalize as cores dos documentos PDF de acordo com a identidade visual da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={settings.pdf_primary_color}
                      onChange={(e) => handleSettingChange('pdf_primary_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={settings.pdf_primary_color}
                      onChange={(e) => handleSettingChange('pdf_primary_color', e.target.value)}
                      placeholder="#2980b9"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usada para cabeçalhos e elementos principais
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Cor Secundária</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={settings.pdf_secondary_color}
                      onChange={(e) => handleSettingChange('pdf_secondary_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={settings.pdf_secondary_color}
                      onChange={(e) => handleSettingChange('pdf_secondary_color', e.target.value)}
                      placeholder="#3498db"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usada para fundos e elementos secundários
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-color">Cor do Texto</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={settings.pdf_text_color}
                      onChange={(e) => handleSettingChange('pdf_text_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={settings.pdf_text_color}
                      onChange={(e) => handleSettingChange('pdf_text_color', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor principal do texto nos documentos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-color">Cor de Fundo</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="background-color"
                      type="color"
                      value={settings.pdf_background_color}
                      onChange={(e) => handleSettingChange('pdf_background_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={settings.pdf_background_color}
                      onChange={(e) => handleSettingChange('pdf_background_color', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor de fundo dos documentos
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Preview das Cores</h4>
                <div className="space-y-2">
                  <div 
                    className="p-3 rounded text-white font-medium"
                    style={{ backgroundColor: settings.pdf_primary_color }}
                  >
                    Cabeçalho Principal (Cor Primária)
                  </div>
                  <div 
                    className="p-2 rounded border"
                    style={{ 
                      backgroundColor: settings.pdf_secondary_color + '20',
                      borderColor: settings.pdf_secondary_color,
                      color: settings.pdf_text_color 
                    }}
                  >
                    Seção com Cor Secundária
                  </div>
                  <div 
                    className="p-2 rounded"
                    style={{ 
                      backgroundColor: settings.pdf_background_color,
                      color: settings.pdf_text_color,
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    Texto normal com cor de fundo
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="header" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Cabeçalho</CardTitle>
              <CardDescription>
                Configure o cabeçalho que aparecerá em todas as páginas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="header-enabled"
                  checked={settings.pdf_header_enabled}
                  onCheckedChange={(checked) => handleSettingChange('pdf_header_enabled', checked)}
                />
                <Label htmlFor="header-enabled">Habilitar cabeçalho</Label>
              </div>

              {settings.pdf_header_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="header-text">Texto do Cabeçalho</Label>
                  <Input
                    id="header-text"
                    value={settings.pdf_header_text}
                    onChange={(e) => handleSettingChange('pdf_header_text', e.target.value)}
                    placeholder="Digite o texto do cabeçalho"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Rodapé</CardTitle>
              <CardDescription>
                Configure o rodapé que aparecerá em todas as páginas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="footer-enabled"
                  checked={settings.pdf_footer_enabled}
                  onCheckedChange={(checked) => handleSettingChange('pdf_footer_enabled', checked)}
                />
                <Label htmlFor="footer-enabled">Habilitar rodapé</Label>
              </div>

              {settings.pdf_footer_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="footer-text">Texto do Rodapé</Label>
                    <Textarea
                      id="footer-text"
                      value={settings.pdf_footer_text}
                      onChange={(e) => handleSettingChange('pdf_footer_text', e.target.value)}
                      placeholder="Digite o texto do rodapé"
                      rows={3}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Switch
                        id="signature-enabled"
                        checked={settings.pdf_signature_enabled}
                        onCheckedChange={(checked) => handleSettingChange('pdf_signature_enabled', checked)}
                      />
                      <Label htmlFor="signature-enabled">Mostrar campos de assinatura no rodapé</Label>
                    </div>

                    {settings.pdf_signature_enabled && (
                      <div className="space-y-4 ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="signature-field1">Texto do Primeiro Campo de Assinatura</Label>
                          <Input
                            id="signature-field1"
                            value={settings.pdf_signature_field1_text}
                            onChange={(e) => handleSettingChange('pdf_signature_field1_text', e.target.value)}
                            placeholder="Ex: Responsável pela Execução"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signature-field2">Texto do Segundo Campo de Assinatura</Label>
                          <Input
                            id="signature-field2"
                            value={settings.pdf_signature_field2_text}
                            onChange={(e) => handleSettingChange('pdf_signature_field2_text', e.target.value)}
                            placeholder="Ex: Supervisor/Aprovador"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo e Informações da Empresa</CardTitle>
              <CardDescription>
                Configure o logo e as informações da empresa nos documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="logo-enabled"
                  checked={settings.pdf_logo_enabled}
                  onCheckedChange={(checked) => handleSettingChange('pdf_logo_enabled', checked)}
                />
                <Label htmlFor="logo-enabled">Mostrar logo nos documentos</Label>
              </div>

              {settings.pdf_logo_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Logo Atual</Label>
                    {currentLogo ? (
                      <div className="flex items-center space-x-4 p-4 border rounded-lg">
                        <img
                          src={currentLogo.file_path}
                          alt="Logo atual"
                          className="w-16 h-16 object-contain border rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{currentLogo.original_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {currentLogo.width}x{currentLogo.height}px • {(currentLogo.file_size / 1024).toFixed(1)}KB
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-2">Nenhum logo carregado</p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Enviando...' : 'Selecionar Logo'}
                        </Button>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {!currentLogo && (
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isLoading ? 'Enviando...' : 'Enviar Logo'}
                      </Button>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: PNG, JPEG, JPG, SVG • Tamanho máximo: 2MB • Recomendado: 200x80px
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nome da Empresa</Label>
                      <Input
                        id="company-name"
                        value={settings.pdf_company_name}
                        onChange={(e) => handleSettingChange('pdf_company_name', e.target.value)}
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-address">Endereço da Empresa</Label>
                      <Textarea
                        id="company-address"
                        value={settings.pdf_company_address}
                        onChange={(e) => handleSettingChange('pdf_company_address', e.target.value)}
                        placeholder="Endereço completo da empresa"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}