'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Wrench,
  User
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  time: string
  type: 'preventiva' | 'corretiva' | 'preditiva'
  priority: 'alta' | 'media' | 'baixa'
  equipment: string
  responsible?: string
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado'
}

export function MaintenanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real data from API
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/maintenance-schedules')
        
        if (!response.ok) {
          throw new Error('Failed to fetch schedules')
        }
        
        const data = await response.json()
        
        if (data.success && data.data) {
          // Convert API data to calendar events
          const calendarEvents: CalendarEvent[] = data.data.map((schedule: any) => {
            const eventDate = new Date(schedule.scheduled_date)
            
            // Map maintenance_type from database values
            const maintenanceTypeMap = {
              'PREVENTIVA': 'preventiva',
              'CORRETIVA': 'corretiva', 
              'PREDITIVA': 'preditiva',
              'EMERGENCIAL': 'corretiva'
            }
            
            // Map priority from database values
            const priorityMap = {
              'CRITICA': 'alta',
              'ALTA': 'alta',
              'MEDIA': 'media',
              'BAIXA': 'baixa'
            }
            
            // Map status from database values
            const statusMap = {
              'AGENDADA': 'agendado',
              'EM_ANDAMENTO': 'em_andamento',
              'CONCLUIDA': 'concluido',
              'CANCELADA': 'cancelado',
              'CONVERTIDA': 'concluido'
            }
            
            return {
              id: schedule.id.toString(),
              title: `${schedule.maintenance_type === 'PREVENTIVA' ? 'Manutenção Preventiva' : 
                      schedule.maintenance_type === 'CORRETIVA' ? 'Manutenção Corretiva' : 
                      schedule.maintenance_type === 'PREDITIVA' ? 'Manutenção Preditiva' :
                      'Manutenção Emergencial'} - ${schedule.equipment_name || 'Equipamento'}`,
              date: eventDate,
              time: schedule.scheduled_time || '08:00',
              type: maintenanceTypeMap[schedule.maintenance_type] || 'preventiva',
              priority: priorityMap[schedule.priority] || 'media',
              equipment: schedule.equipment_name || 'Equipamento não identificado',
              responsible: schedule.assigned_user_name || schedule.created_by_name,
              status: statusMap[schedule.status] || 'agendado'
            }
          })
          
          setEvents(calendarEvents)
          
          // Navigate to the month of the first event if we have events
          if (calendarEvents.length > 0) {
            const firstEventDate = calendarEvents[0].date
            setCurrentDate(new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1))
          }
        }
      } catch (error) {
        console.error('Error fetching schedules:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchSchedules()
  }, [])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preventiva': return 'bg-blue-100 text-blue-800'
      case 'corretiva': return 'bg-red-100 text-red-800'
      case 'preditiva': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baixa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800'
      case 'em_andamento': return 'bg-amber-100 text-amber-800'
      case 'concluido': return 'bg-green-100 text-green-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    )
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    
    // Dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>)
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = getEventsForDate(date)
      const isToday = new Date().toDateString() === date.toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()
      
      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${isSelected ? 'bg-blue-100 border-blue-400' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1 mt-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={`text-xs px-1 py-0.5 rounded truncate ${getTypeColor(event.type)}`}
                title={event.title}
              >
                {event.time} - {event.equipment}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 2} mais
              </div>
            )}
          </div>
        </div>
      )
    }
    
    return days
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">
              {currentDate.toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            {/* Grid do calendário */}
            <div className="grid grid-cols-7">
              {renderCalendarGrid()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar com detalhes */}
      <div className="space-y-6">
        {/* Legenda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Legenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-xs">Preventiva</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
              <span className="text-xs">Corretiva</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
              <span className="text-xs">Preditiva</span>
            </div>
          </CardContent>
        </Card>

        {/* Eventos do dia selecionado */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {selectedDate.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum agendamento para este dia</p>
              ) : (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          <span>{event.equipment}</span>
                        </div>
                        {event.responsible && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{event.responsible}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getTypeColor(event.type)}>
                          {event.type}
                        </Badge>
                        <Badge className={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Próximos Agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {events.slice(0, 5).length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum agendamento próximo</p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {event.date.toLocaleDateString('pt-BR')} às {event.time}
                      </p>
                    </div>
                    <Badge className={getPriorityColor(event.priority)}>
                      {event.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}