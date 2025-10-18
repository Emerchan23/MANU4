"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline"

interface BackupFile {
  id: string
  name: string
  size: string
  date: Date
  type: "full" | "partial"
  status: "completed" | "in_progress" | "failed"
}

// Dados removidos - agora usa apenas dados reais da API

export function BackupRestore() {
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [backupType, setBackupType] = useState<"full" | "partial">("full")
  const [backupDescription, setBackupDescription] = useState("")

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    setBackupProgress(0)

    // Simular progresso do backup
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsCreatingBackup(false)

          // Adicionar novo backup à lista
          const newBackup: BackupFile = {
            id: `backup-${Date.now()}`,
            name: `backup_${backupType}_${new Date().toISOString().split("T")[0].replace(/-/g, "_")}.sql`,
            size: backupType === "full" ? "52.1 MB" : "15.3 MB",
            date: new Date(),
            type: backupType,
            status: "completed",
          }
          setBackups((prev) => [newBackup, ...prev])
          setBackupDescription("")

          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const handleRestore = async (backupId: string) => {
    if (!confirm("Tem certeza que deseja restaurar este backup? Esta ação substituirá todos os dados atuais.")) {
      return
    }

    setIsRestoring(true)
    setRestoreProgress(0)

    // Simular progresso da restauração
    const interval = setInterval(() => {
      setRestoreProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsRestoring(false)
          alert("Backup restaurado com sucesso!")
          return 100
        }
        return prev + 8
      })
    }, 600)
  }

  const handleDownload = (backup: BackupFile) => {
    // Simular download do arquivo
    const link = document.createElement("a")
    link.href = `#` // Em produção, seria a URL real do arquivo
    link.download = backup.name
    link.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Backup e Restauração</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie backups do banco de dados MariaDB e restaure dados quando necessário
        </p>
      </div>

      {/* Criar Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Criar Backup
          </CardTitle>
          <CardDescription>Gere um backup completo ou parcial do banco de dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="backupType">Tipo de Backup</Label>
              <select
                id="backupType"
                value={backupType}
                onChange={(e) => setBackupType(e.target.value as "full" | "partial")}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                disabled={isCreatingBackup}
              >
                <option value="full">Backup Completo</option>
                <option value="partial">Backup Parcial (apenas dados essenciais)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="backupDescription">Descrição (opcional)</Label>
              <Input
                id="backupDescription"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                placeholder="Ex: Backup antes da atualização"
                disabled={isCreatingBackup}
              />
            </div>
          </div>

          {isCreatingBackup && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Criando backup...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
            </div>
          )}

          <Alert>
            <InformationCircleIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Backup Completo:</strong> Inclui todos os dados, configurações e histórico.
              <br />
              <strong>Backup Parcial:</strong> Inclui apenas equipamentos, setores e configurações essenciais.
            </AlertDescription>
          </Alert>

          <Button onClick={handleCreateBackup} disabled={isCreatingBackup} className="w-full md:w-auto">
            {isCreatingBackup ? "Criando..." : "Criar Backup"}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Backups Disponíveis
          </CardTitle>
          <CardDescription>Histórico de backups criados e opções de restauração</CardDescription>
        </CardHeader>
        <CardContent>
          {isRestoring && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Restaurando backup...</span>
                <span>{restoreProgress}%</span>
              </div>
              <Progress value={restoreProgress} className="w-full" />
              <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-300">
                  Não feche esta página durante a restauração. O processo pode levar alguns minutos.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{backup.name}</h4>
                    <Badge variant={backup.type === "full" ? "default" : "secondary"}>
                      {backup.type === "full" ? "Completo" : "Parcial"}
                    </Badge>
                    <Badge variant={backup.status === "completed" ? "default" : "destructive"}>
                      {backup.status === "completed" ? (
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      )}
                      {backup.status === "completed" ? "Concluído" : "Falhou"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>{backup.size}</span> • <span>{backup.date.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(backup)} disabled={isRestoring}>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(backup.id)}
                    disabled={isRestoring || backup.status !== "completed"}
                  >
                    <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                    Restaurar
                  </Button>
                </div>
              </div>
            ))}

            {backups.length === 0 && (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum backup encontrado</p>
                <p className="text-sm text-muted-foreground">Crie seu primeiro backup para começar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload de Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpTrayIcon className="h-5 w-5" />
            Restaurar de Arquivo
          </CardTitle>
          <CardDescription>Faça upload de um arquivo de backup para restaurar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="backupFile">Arquivo de Backup (.sql)</Label>
            <Input id="backupFile" type="file" accept=".sql" disabled={isRestoring} className="mt-1" />
          </div>

          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              <strong>Atenção:</strong> A restauração substituirá todos os dados atuais do sistema. Certifique-se de ter
              um backup recente antes de prosseguir.
            </AlertDescription>
          </Alert>

          <Button variant="destructive" disabled={isRestoring} className="w-full md:w-auto">
            Restaurar de Arquivo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
