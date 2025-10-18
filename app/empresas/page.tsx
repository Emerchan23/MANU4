'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanyCard } from '@/components/companies/company-card';
import { Plus, Search, Building2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Company } from '@/types/company';
import { usePagination } from '@/hooks/usePagination';

export default function EmpresasPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Paginação
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedCompanies,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    canGoNext,
    canGoPrevious
  } = usePagination(filteredCompanies, 9);

  // Carregar empresas
  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/companies');
      const result = await response.json();

      if (result.success) {
        setCompanies(result.companies);
        setFilteredCompanies(result.companies);
      } else {
        toast.error(result.message || 'Erro ao carregar empresas');
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar empresas
  const filterCompanies = (term: string) => {
    if (!term.trim()) {
      setFilteredCompanies(companies);
      return;
    }

    const filtered = companies.filter(company =>
      company.name.toLowerCase().includes(term.toLowerCase()) ||
      company.cnpj.includes(term.replace(/\D/g, '')) ||
      company.contact_person.toLowerCase().includes(term.toLowerCase()) ||
      company.email.toLowerCase().includes(term.toLowerCase()) ||
      company.specialties.toLowerCase().includes(term.toLowerCase())
    );

    setFilteredCompanies(filtered);
  };

  // Efeitos
  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterCompanies(searchTerm);
  }, [searchTerm, companies]);

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleNewCompany = () => {
    router.push('/empresas/nova');
  };

  const handleCompanyDeleted = () => {
    loadCompanies();
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Empresas Terceirizadas
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie as empresas terceirizadas e seus dados de contato
            </p>
          </div>
          <Button 
            onClick={handleNewCompany}
            className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Button>
        </div>

        {/* Barra de busca */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, CNPJ, contato, email ou especialidades..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando empresas...
              </div>
            </CardContent>
          </Card>
        ) : filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              {searchTerm ? (
                <div>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma empresa encontrada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Não encontramos empresas que correspondam à sua busca "{searchTerm}".
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                  >
                    Limpar busca
                  </Button>
                </div>
              ) : (
                <div>
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma empresa cadastrada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comece cadastrando sua primeira empresa terceirizada.
                  </p>
                  <Button
                    onClick={handleNewCompany}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeira Empresa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Contador de resultados */}
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {filteredCompanies.length === companies.length
                  ? `${companies.length} empresa${companies.length !== 1 ? 's' : ''} cadastrada${companies.length !== 1 ? 's' : ''}`
                  : `${filteredCompanies.length} de ${companies.length} empresa${companies.length !== 1 ? 's' : ''} encontrada${filteredCompanies.length !== 1 ? 's' : ''}`
                }
              </p>
              {totalPages > 1 && (
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </p>
              )}
            </div>

            {/* Grid de empresas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onDelete={handleCompanyDeleted}
                />
              ))}
            </div>

            {/* Controles de paginação */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2">
                    {/* Botão anterior */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={!canGoPrevious}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    {/* Números das páginas */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className={`min-w-[40px] ${
                            currentPage === page 
                              ? "bg-red-600 hover:bg-red-700 text-white" 
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    {/* Botão próximo */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={!canGoNext}
                      className="flex items-center gap-1"
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}