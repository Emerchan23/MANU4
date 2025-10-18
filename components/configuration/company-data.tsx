'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Building2, Mail, Phone, MapPin, Loader2 } from 'lucide-react'
import { CompanyData } from '@/types/company'
import { toast } from 'sonner'

export function CompanyDataSettings() {
  const [companyData, setCompanyData] = useState<CompanyData>({
    id: '1',
    name: '',
    legalName: '',
    phone: '',
    email: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    cnpj: '',
    createdAt: new Date(),
    updatedAt: new Date()
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Carregar dados da empresa ao inicializar
  useEffect(() => {
    loadCompanyData()
  }, [])

  const loadCompanyData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/system/company-data')
      const result = await response.json()
      
      if (result.success) {
        setCompanyData(result.data)
      } else {
        toast.error('Erro ao carregar dados da empresa')
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error)
      toast.error('Erro ao carregar dados da empresa')
    } finally {
      setLoading(false)
    }
  }

  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const response = await fetch('/api/system/company-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(companyData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Dados da empresa salvos com sucesso!')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        toast.error(result.message || 'Erro ao salvar dados da empresa')
      }
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error)
      toast.error('Erro ao salvar dados da empresa')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof CompanyData, value: any) => {
    setCompanyData((prev) => ({ ...prev, [field]: value, updatedAt: new Date() }))
  }

  const updateAddress = (field: keyof CompanyData["address"], value: string) => {
    setCompanyData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
      updatedAt: new Date(),
    }))
  }

  // Função para formatar CNPJ
  const formatCNPJ = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara XX.XXX.XXX/XXXX-XX
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 5) {
      return numbers.replace(/(\d{2})(\d+)/, '$1.$2')
    } else if (numbers.length <= 8) {
      return numbers.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3')
    } else if (numbers.length <= 12) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4')
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5')
    }
  }

  // Função para lidar com mudanças no campo CNPJ
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCNPJ(e.target.value)
    updateField("cnpj", formattedValue)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados da empresa...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dados da Empresa</h2>
        <p className="text-muted-foreground">Gerencie as informações da sua empresa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>Dados principais da empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Fantasia *</Label>
                <Input
                  id="name"
                  value={companyData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Nome da empresa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={companyData.cnpj || ""}
                  onChange={handleCNPJChange}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalName">Razão Social *</Label>
              <Input
                id="legalName"
                value={companyData.legalName}
                onChange={(e) => updateField("legalName", e.target.value)}
                placeholder="Razão social completa"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Informações de Contato
            </CardTitle>
            <CardDescription>Dados para contato com a empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={companyData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="contato@empresa.com.br"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
            <CardDescription>Localização da empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">Logradouro *</Label>
                <Input
                  id="street"
                  value={companyData.address.street}
                  onChange={(e) => updateAddress("street", e.target.value)}
                  placeholder="Rua, Avenida, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={companyData.address.number}
                  onChange={(e) => updateAddress("number", e.target.value)}
                  placeholder="123"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={companyData.address.complement || ""}
                  onChange={(e) => updateAddress("complement", e.target.value)}
                  placeholder="Sala, Andar, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={companyData.address.neighborhood}
                  onChange={(e) => updateAddress("neighborhood", e.target.value)}
                  placeholder="Nome do bairro"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={companyData.address.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                  placeholder="Nome da cidade"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={companyData.address.state}
                  onChange={(e) => updateAddress("state", e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP *</Label>
                <Input
                  id="zipCode"
                  value={companyData.address.zipCode}
                  onChange={(e) => updateAddress("zipCode", e.target.value)}
                  placeholder="00000-000"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={saving}
            className={saved ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : saved ? (
              "✓ Salvo"
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
