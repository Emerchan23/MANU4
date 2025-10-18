"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { PaintBrushIcon, SwatchIcon } from "@heroicons/react/24/outline"
import { useTheme } from "next-themes"
import { usePersonalization } from "@/components/personalization-context"

const themes = [
  { id: "light", name: "Claro", description: "Tema claro padrão" },
  { id: "dark", name: "Escuro", description: "Tema escuro para ambientes com pouca luz" },
  { id: "system", name: "Automático", description: "Segue a configuração do sistema" },
]

const primaryColors = [
  { id: "blue", name: "Azul", value: "oklch(0.488 0.243 264.376)", preview: "bg-blue-600" },
  { id: "green", name: "Verde", value: "oklch(0.646 0.222 142.495)", preview: "bg-green-600" },
  { id: "red", name: "Vermelho", value: "oklch(0.577 0.245 27.325)", preview: "bg-red-600" },
  { id: "purple", name: "Roxo", value: "oklch(0.627 0.265 303.9)", preview: "bg-purple-600" },
  { id: "orange", name: "Laranja", value: "oklch(0.769 0.188 70.08)", preview: "bg-orange-600" },
  { id: "teal", name: "Azul-verde", value: "oklch(0.6 0.118 184.704)", preview: "bg-teal-600" },
]

const interfaceOptions = [
  { id: "compact", name: "Compacta", description: "Interface mais densa com menos espaçamento" },
  { id: "comfortable", name: "Confortável", description: "Interface padrão com espaçamento equilibrado" },
  { id: "spacious", name: "Espaçosa", description: "Interface com mais espaçamento entre elementos" },
]

export function PersonalizationSettings() {
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings, applySettings } = usePersonalization()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      // Apply settings which will also save to database
      applySettings()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving personalization settings:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Personalização Global</h2>
        <p className="text-muted-foreground">Configure a aparência e comportamento padrão do sistema para todos os usuários</p>
      </div>

      {/* Cores e Temas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaintBrushIcon className="h-5 w-5" />
            Cores e Temas
          </CardTitle>
          <CardDescription>Configure o tema e as cores principais aplicados globalmente no sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Tema do Sistema</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themes.map((themeOption) => (
                  <SelectItem key={themeOption.id} value={themeOption.id}>
                    <div>
                      <div className="font-medium">{themeOption.name}</div>
                      <div className="text-sm text-muted-foreground">{themeOption.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cor Principal</Label>
            <div className="grid grid-cols-3 gap-3">
              {primaryColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => updateSettings({ primaryColor: color.id })}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    settings.primaryColor === color.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${color.preview}`} />
                  <span className="text-sm font-medium">{color.name}</span>
                  {settings.primaryColor === color.id && (
                    <Badge variant="secondary" className="ml-auto">
                      Ativo
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Raio das Bordas: {settings.borderRadius}px</Label>
            <Slider
              value={[settings.borderRadius]}
              onValueChange={(value) => updateSettings({ borderRadius: value[0] })}
              max={20}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Quadrado</span>
              <span>Arredondado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Elementos de Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SwatchIcon className="h-5 w-5" />
            Elementos de Interface
          </CardTitle>
          <CardDescription>Ajuste o comportamento e aparência global dos elementos da interface</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Densidade da Interface</Label>
            <Select value={settings.interfaceSize} onValueChange={(value) => updateSettings({ interfaceSize: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interfaceOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div>
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Animações</Label>
                <p className="text-sm text-muted-foreground">Habilitar transições e animações</p>
              </div>
              <Switch
                checked={settings.showAnimations}
                onCheckedChange={(checked) => updateSettings({ showAnimations: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Sidebar Compacta</Label>
                <p className="text-sm text-muted-foreground">Reduzir o tamanho da barra lateral</p>
              </div>
              <Switch
                checked={settings.compactSidebar}
                onCheckedChange={(checked) => updateSettings({ compactSidebar: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Breadcrumbs</Label>
                <p className="text-sm text-muted-foreground">Mostrar navegação estrutural</p>
              </div>
              <Switch
                checked={settings.showBreadcrumbs}
                onCheckedChange={(checked) => updateSettings({ showBreadcrumbs: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Alto Contraste</Label>
                <p className="text-sm text-muted-foreground">Aumentar contraste para melhor acessibilidade</p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>Veja como ficará a interface com as configurações globais do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Exemplo de Card</h3>
              <Button size="sm" variant="outline">
                Ação
              </Button>
            </div>
            <p className="text-muted-foreground mb-3">
              Este é um exemplo de como os elementos ficarão com suas configurações atuais.
            </p>
            <div className="flex gap-2">
              <Button size="sm">Primário</Button>
              <Button size="sm" variant="secondary">
                Secundário
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-32">
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
