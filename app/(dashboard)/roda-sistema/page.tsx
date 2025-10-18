'use client';

import React from 'react';
import WheelControl from '@/components/roda-sistema/wheel-control';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Settings, History } from 'lucide-react';
import { getCurrentDateTimeBR } from '@/lib/date-utils';

export default function RodaSistemaPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RODA SISTEMA</h1>
          <p className="text-gray-500 mt-1">
            Sistema de Controle e Monitoramento de Rotação
          </p>
        </div>
      </div>

      <Tabs defaultValue="control" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="control">
            <Activity className="h-4 w-4 mr-2" />
            Controle
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Settings className="h-4 w-4 mr-2" />
            Monitoramento
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-4">
          <WheelControl />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-500">Tempo de Operação</div>
                  <div className="text-2xl font-bold mt-2">00:00:00</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-500">Rotações Totais</div>
                  <div className="text-2xl font-bold mt-2">0</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-500">Eficiência</div>
                  <div className="text-2xl font-bold mt-2">100%</div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Gráfico de Desempenho</h3>
                <div className="h-64 border rounded-lg flex items-center justify-center text-gray-400">
                  Gráfico de RPM ao longo do tempo
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Operações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sistema Iniciado</div>
                    <div className="text-sm text-gray-500">
                      {getCurrentDateTimeBR()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Admin</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
