'use client';

import { CompanyForm } from '@/components/companies/company-form';
import { MainLayout } from '@/components/layout/main-layout';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function NovaEmpresaPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/empresas');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header com botão voltar */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-0 h-auto font-normal text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Empresas
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Nova Empresa Terceirizada
            </h1>
            <p className="text-gray-600 mt-1">
              Preencha os dados da nova empresa terceirizada
            </p>
          </div>
        </div>

        {/* Formulário */}
        <CompanyForm mode="create" />
      </div>
    </MainLayout>
  );
}