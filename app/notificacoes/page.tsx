"use client"

import { useState } from 'react'
import { MainLayout } from "@/components/layout/main-layout"
import { NotificationSettings } from "@/src/components/NotificationSettings"
import { Settings } from 'lucide-react'

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'settings'>('settings')
  
  const tabs = [
    {
      id: 'settings' as const,
      label: 'Configurações',
      icon: <Settings className="w-4 h-4" />,
      component: <NotificationSettings />
    }
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Central de Notificações</h1>
            <p className="text-gray-600 mt-1">
              Gerencie suas notificações e configurações
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}