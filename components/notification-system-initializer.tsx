"use client";

import { useEffect } from "react";

// Importações e execução de servidores/agendadores foram desativadas no cliente
// para evitar consultas ao banco no navegador e erros de hidratação.
// Toda a lógica de integração deve ocorrer via rotas de API ou no backend.

export function NotificationSystemInitializer() {
  useEffect(() => {
    // No-op: mantido apenas para compatibilidade.
    console.log("NotificationSystemInitializer carregado (cliente) - integração desativada no browser");
  }, []);

  return null;
}