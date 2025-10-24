export interface NavigationItem {
  name: string
  href: string
  icon: any
  adminOnly?: boolean
}

export const getFilteredNavigation = (userRole: string, isAdmin: boolean) => {
  const allNavigation: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/",
      icon: "HomeIcon",
    },
    {
      name: "Equipamentos",
      href: "/equipamentos",
      icon: "WrenchScrewdriverIcon",
    },
    {
      name: "Ordens de Serviço",
      href: "/ordens-servico",
      icon: "ClipboardDocumentListIcon",
    },
    {
      name: "Agendamentos",
      href: "/agendamentos",
      icon: "CalendarIcon",
    },
    {
      name: "Empresas",
      href: "/empresas",
      icon: "BuildingOfficeIcon",
    },
    {
      name: "Setores",
      href: "/setores",
      icon: "RectangleGroupIcon",
    },
    {
      name: "Relatórios",
      href: "/relatorios",
      icon: "DocumentChartBarIcon",
    },
    {
      name: "Configurações",
      href: "/configuracoes",
      icon: "CogIcon",
      adminOnly: true,
    },
  ]

  return allNavigation.filter((item) => {
    // Se o item é apenas para admin, verificar se o usuário é admin
    if (item.adminOnly && !isAdmin) {
      return false
    }

    return true
  })
}
