export interface NavigationItem {
  name: string
  href: string
  icon: any
  requiredRoles?: string[]
  requiredPermissions?: string[]
}

export const getFilteredNavigation = (userRole: string, permissions: any) => {
  const allNavigation: NavigationItem[] = [
    {
      name: "Equipamentos",
      href: "/equipamentos",
      icon: "WrenchScrewdriverIcon",
      requiredRoles: ["admin", "gestor"],
    },
    {
      name: "Ordens de Serviço",
      href: "/ordens-servico",
      icon: "ClipboardDocumentListIcon",
      requiredRoles: ["admin", "gestor", "tecnico"],
    },
    {
      name: "Agendamentos",
      href: "/agendamentos",
      icon: "CalendarIcon",
      requiredRoles: ["admin", "gestor", "tecnico"],
    },
    {
      name: "Empresas",
      href: "/empresas",
      icon: "BuildingOfficeIcon",
      requiredRoles: ["admin", "gestor"],
    },
    {
      name: "Relatórios",
      href: "/relatorios",
      icon: "DocumentChartBarIcon",
      requiredRoles: ["admin", "gestor", "tecnico"],
    },
    {
      name: "Configurações",
      href: "/configuracoes",
      icon: "CogIcon",
      requiredRoles: ["admin"],
      requiredPermissions: ["configuracoes"],
    },
  ]

  return allNavigation.filter((item) => {
    // Check role-based access
    if (item.requiredRoles && !item.requiredRoles.includes(userRole)) {
      return false
    }

    // Check permission-based access
    if (item.requiredPermissions) {
      return item.requiredPermissions.every((permission) => permissions[permission])
    }

    return true
  })
}
