import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import next from 'next'
import { createServer } from 'http'
import { createPool } from './lib/database.js'
import { startNotificationScheduler } from './lib/notification-service.js'
import NotificationWebSocketServer from './api/websocket/notification-server.js'
import NotificationScheduler from './api/services/notification-scheduler.js'


// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Next.js
const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev, dir: __dirname })
const handle = nextApp.getRequestHandler()

const PORT = process.env.PORT || 3000

// Prepare Next.js and start server
nextApp.prepare().then(async () => {
  const app = express()

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }))
  
  app.use(cookieParser())

  // Initialize database connection
  createPool()

  // Start notification scheduler (legacy) - desativado
  // startNotificationScheduler()

  // Initialize advanced notification scheduler
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance',
    charset: 'utf8mb4',
    timezone: '+00:00'
  }

  const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI2BN4XYqDLoLXgkNsiS3-MiVpJNdOGil5wvMMtlf5VW2PJOBw-p_5YDFA',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'UzxN2E2EnAyHyE1PIVfNy00p6IoK5kCXkbdAAd9uLls',
    subject: 'mailto:admin@sistema-manutencao.com'
  }

  const notificationScheduler = new NotificationScheduler(dbConfig, vapidKeys)
  notificationScheduler.start()

  // Make scheduler available globally
  global.notificationScheduler = notificationScheduler

  // API Routes - Import dinamicamente
  const usersRouter = await import('./api/users.js')
  const sectorsRouter = await import('./api/sectors.js')
  // Removido: const companiesRouter = await import('./api/companies.js')
  const categoriesRouter = await import('./api/categories.js')
  const equipmentRouter = await import('./api/equipment.js')
  // Removido: const serviceOrdersRouter = await import('./api/service-orders.js')
  const notificationsRouter = await import('./api/notifications.js')
  const notificationSettingsRouter = await import('./api/routes/notification-settings.js')
  // Removido: const dashboardRouter = await import('./api/dashboard.js')
  // Removido: const reportsRouter = await import('./api/reports.js')
  const sessionsRouter = await import('./api/sessions.js')
  const userSettingsRouter = await import('./api/user-settings.js')
  const userPreferencesRouter = await import('./api/user-preferences.js')
  const systemSettingsRouter = await import('./api/system-settings.js')
  const specialtiesRouter = await import('./api/specialties.js')
  const agendamentosRouter = await import('./api/agendamentos.js')

  // API Routes - Import dinamicamente
  const authRouter = await import('./api/auth.js')

  // Apply JSON middleware only to specific Express routes (not globally)
  // Removido middleware global: app.use(express.json({ limit: '10mb' }))
  
  // Apply JSON middleware individually to each Express route
  app.use('/api/auth', express.json({ limit: '10mb' }), authRouter.default)
  app.use('/api/users', express.json({ limit: '10mb' }), usersRouter.default)
  app.use('/api/sectors', express.json({ limit: '10mb' }), sectorsRouter.default)
  // Removido: app.use('/api/companies', express.json({ limit: '10mb' }), companiesRouter.default)
  app.use('/api/categories', express.json({ limit: '10mb' }), categoriesRouter.default)
  // app.use('/api/equipment', equipmentRouter.default) // Desabilitado - usando Next.js API route
  // Removido: app.use('/api/service-orders', express.json({ limit: '10mb' }), serviceOrdersRouter.default)
  app.use('/api/notifications', express.json({ limit: '10mb' }), notificationsRouter.default)
  app.use('/api/notification-settings', express.json({ limit: '10mb' }), notificationSettingsRouter.default)
  // Removido: app.use('/api/dashboard', express.json({ limit: '10mb' }), dashboardRouter.default)
  // Removido: app.use('/api/reports', express.json({ limit: '10mb' }), reportsRouter.default)
  app.use('/api/sessions', express.json({ limit: '10mb' }), sessionsRouter.default)
  app.use('/api/user-settings', express.json({ limit: '10mb' }), userSettingsRouter.default)
  app.use('/api/user-preferences', express.json({ limit: '10mb' }), userPreferencesRouter.default)
  app.use('/api/system-settings', express.json({ limit: '10mb' }), systemSettingsRouter.default)
  app.use('/api/specialties', express.json({ limit: '10mb' }), specialtiesRouter.default)
  app.use('/api/agendamentos', express.json({ limit: '10mb' }), agendamentosRouter.default)

  // Health check endpoint (without JSON middleware since it doesn't need it)
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() })
  })

  // Handle all other requests with Next.js
  app.use((req, res) => {
    return handle(req, res)
  })

  // Create HTTP server
  const server = createServer(app)

  // Initialize WebSocket server for notifications
  const wsServer = new NotificationWebSocketServer(server)

  // Make WebSocket server available globally for sending notifications
  global.notificationWS = wsServer

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📱 Frontend: http://localhost:${PORT}`)
    console.log(`🔌 API: http://localhost:${PORT}/api`)
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`)
    console.log(`💾 Database: MariaDB`)
    console.log(`🔔 Notifications: Active`)
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`)
  })
}).catch((ex) => {
  console.error('Error starting server:', ex.stack)
  process.exit(1)
})
