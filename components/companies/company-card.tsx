'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Company, formatCNPJ, formatPhone } from '@/types/company';

interface CompanyCardProps {
  company: Company;
  onDelete?: () => void;
}

export function CompanyCard({ company, onDelete }: CompanyCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    router.push(`/empresas/${company.id}/editar`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Empresa excluída com sucesso!');
        onDelete?.();
      } else {
        toast.error(result.message || 'Erro ao excluir empresa');
      }
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsDeleting(false);
    }
  };

  const specialtiesArray = company.specialties
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {company.name}
            </CardTitle>
            <p className="text-sm text-gray-600">
              CNPJ: {formatCNPJ(company.cnpj)}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a empresa "{company.name}"? 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Pessoa de Contato */}
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-700">{company.contact_person}</span>
        </div>

        {/* Telefone */}
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <a 
            href={`tel:${company.phone}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {formatPhone(company.phone)}
          </a>
        </div>

        {/* E-mail */}
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <a 
            href={`mailto:${company.email}`}
            className="text-blue-600 hover:text-blue-800 hover:underline truncate"
          >
            {company.email}
          </a>
        </div>

        {/* Endereço */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <span className="text-gray-700 leading-relaxed">
            {company.address}
          </span>
        </div>

        {/* Especialidades */}
        <div className="pt-2">
          <p className="text-sm font-medium text-gray-700 mb-2">Especialidades:</p>
          <div className="flex flex-wrap gap-1">
            {specialtiesArray.map((specialty, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {specialty}
              </Badge>
            ))}
          </div>
        </div>

        {/* Data de cadastro */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Cadastrado em: {new Date(company.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}