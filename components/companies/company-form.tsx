'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Company, 
  CreateCompanySchema, 
  UpdateCompanySchema, 
  CreateCompany, 
  UpdateCompany,
  formatCNPJ,
  formatPhone,
  removeCNPJMask,
  removePhoneMask
} from '@/types/company';

interface CompanyFormProps {
  company?: Company;
  mode: 'create' | 'edit';
}

export function CompanyForm({ company, mode }: CompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const schema = mode === 'create' ? CreateCompanySchema : UpdateCompanySchema;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    trigger,
    clearErrors,
  } = useForm<CreateCompany | UpdateCompany>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      cnpj: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      specialties: '',
    },
  });

  // Atualizar formulário quando os dados da empresa mudarem
  useEffect(() => {
    if (company && mode === 'edit') {
      console.log('🔍 Dados da empresa recebidos:', company);
      
      setValue('name', company.name || '');
      setValue('cnpj', formatCNPJ(company.cnpj || ''));
      setValue('contact_person', company.contact_person || '');
      setValue('phone', formatPhone(company.phone || ''));
      setValue('email', company.email || '');
      setValue('address', company.address || '');
      setValue('specialties', company.specialties || '');
      
      console.log('✅ Valores definidos no formulário:');
      console.log('- name:', company.name);
      console.log('- cnpj:', formatCNPJ(company.cnpj || ''));
      console.log('- contact_person:', company.contact_person);
      console.log('- phone:', formatPhone(company.phone || ''));
      console.log('- email:', company.email);
      console.log('- address:', company.address);
      console.log('- specialties:', company.specialties);
    }
  }, [company, mode, setValue]);



  const onSubmit = async (data: CreateCompany | UpdateCompany) => {
    setIsLoading(true);

    try {
      // Remover máscaras antes de enviar e validar
      const cleanData = {
        ...data,
        cnpj: removeCNPJMask(data.cnpj),
        phone: removePhoneMask(data.phone),
      };

      // Validar dados limpos com o schema
      const validatedData = schema.parse(cleanData);

      const url = mode === 'create' 
        ? '/api/companies' 
        : `/api/companies/${company?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || `Empresa ${mode === 'create' ? 'criada' : 'atualizada'} com sucesso!`);
        router.push('/empresas');
        router.refresh();
      } else {
        toast.error(result.message || 'Erro ao salvar empresa');
      }
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/empresas');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Nova Empresa' : 'Editar Empresa'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome da Empresa */}
            <div className="md:col-span-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                placeholder="Nome da empresa"
                value={watch('name') || ''}
                onChange={(e) => setValue('name', e.target.value, { shouldValidate: true })}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* CNPJ */}
            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                onChange={async (e) => {
                  const formatted = formatCNPJ(e.target.value);
                  setValue('cnpj', formatted);
                  
                  // Validar com dados limpos
                  const cleanCNPJ = removeCNPJMask(formatted);
                  try {
                    await CreateCompanySchema.pick({ cnpj: true }).parseAsync({ cnpj: cleanCNPJ });
                    clearErrors('cnpj');
                  } catch (error: any) {
                    // Não definir erro aqui, deixar o react-hook-form lidar
                  }
                }}
                value={watch('cnpj') || ''}
                maxLength={18}
                className={errors.cnpj ? 'border-red-500' : ''}
              />
              {errors.cnpj && (
                <p className="text-sm text-red-500 mt-1">{errors.cnpj.message}</p>
              )}
            </div>

            {/* Pessoa de Contato */}
            <div>
              <Label htmlFor="contact_person">Pessoa de Contato *</Label>
              <Input
                id="contact_person"
                placeholder="Nome do responsável"
                value={watch('contact_person') || ''}
                onChange={(e) => setValue('contact_person', e.target.value, { shouldValidate: true })}
                className={errors.contact_person ? 'border-red-500' : ''}
              />
              {errors.contact_person && (
                <p className="text-sm text-red-500 mt-1">{errors.contact_person.message}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                onChange={async (e) => {
                  const formatted = formatPhone(e.target.value);
                  setValue('phone', formatted);
                  
                  // Validar com dados limpos
                  const cleanPhone = removePhoneMask(formatted);
                  try {
                    await CreateCompanySchema.pick({ phone: true }).parseAsync({ phone: cleanPhone });
                    clearErrors('phone');
                  } catch (error: any) {
                    // Não definir erro aqui, deixar o react-hook-form lidar
                  }
                }}
                value={watch('phone') || ''}
                maxLength={15}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@empresa.com"
                value={watch('email') || ''}
                onChange={(e) => setValue('email', e.target.value, { shouldValidate: true })}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <Label htmlFor="address">Endereço *</Label>
            <Textarea
              id="address"
              placeholder="Endereço completo"
              rows={3}
              value={watch('address') || ''}
              onChange={(e) => setValue('address', e.target.value, { shouldValidate: true })}
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Especialidades */}
          <div>
            <Label htmlFor="specialties">Especialidades *</Label>
            <Textarea
              id="specialties"
              placeholder="Ex: Biomédica, Elétrica, Refrigeração (separadas por vírgula)"
              rows={3}
              value={watch('specialties') || ''}
              onChange={(e) => setValue('specialties', e.target.value, { shouldValidate: true })}
              className={errors.specialties ? 'border-red-500' : ''}
            />
            {errors.specialties && (
              <p className="text-sm text-red-500 mt-1">{errors.specialties.message}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}