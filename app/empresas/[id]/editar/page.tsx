'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CompanyForm } from '@/components/companies/company-form';
import { MainLayout } from '@/components/layout/main-layout';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Company } from '@/types/company';

export default function EditarEmpresaPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = params.id as string;

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/companies/${companyId}`);
        const result = await response.json();

        if (result.success) {
          setCompany(result.company);
        } else {
          setError(result.message || 'Empresa não encontrada');
          toast.error(result.message || 'Erro ao carregar empresa');
        }
      } catch (error) {
        console.error('Erro ao carregar empresa:', error);
        setError('Erro interno do servidor');
        toast.error('Erro interno do servidor');
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      loadCompany();
    }
  }, [companyId]);

  const handleBack = () => {
    router.push('/empresas');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando dados da empresa...
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error || !company) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-red-600 mb-4">
                <h3 className="text-lg font-medium mb-2">Erro ao carregar empresa</h3>
                <p className="text-sm">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Empresas
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

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
              Editar Empresa
            </h1>
            <p className="text-gray-600 mt-1">
              Atualize os dados da empresa "{company.name}"
            </p>
          </div>
        </div>

        {/* Formulário */}
        <CompanyForm mode="edit" company={company} />
      </div>
    </MainLayout>
  );
}