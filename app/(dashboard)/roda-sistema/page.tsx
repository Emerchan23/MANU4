'use client';

import React from 'react';
import WheelControl from '@/components/roda-sistema/wheel-control';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Settings, History } from 'lucide-react';

function RodaSistemaPage() {
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
          <TabsTrigger value="control" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Controle
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Controle da Roda</CardTitle>
            </CardHeader>
            <CardContent>
              <WheelControl />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Velocidade Padrão</label>
                    <input 
                      type="number" 
                      className="w-full mt-1 p-2 border rounded-md" 
                      defaultValue="50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tempo de Rotação</label>
                    <input 
                      type="number" 
                      className="w-full mt-1 p-2 border rounded-md" 
                      defaultValue="30"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Operações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sistema Iniciado</div>
                    <div className="text-sm text-gray-500">
                      {new Date().toLocaleString('pt-BR')}
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

export default RodaSistemaPage;
