import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Database connection configuration with explicit fallbacks
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
}

export async function GET(request: NextRequest) {
  let connection: mysql.Connection | null = null
  
  try {
    // Get user_id from query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Attempting to connect to database with config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      hasPassword: !!dbConfig.password
    })

    // Create database connection
    connection = await mysql.createConnection(dbConfig)
    console.log('Database connection established successfully')
    
    // Check if notifications table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'notifications'"
    ) as [any[], any]
    
    if (tables.length === 0) {
      console.log('Notifications table does not exist, returning 0')
      return NextResponse.json({ count: 0 })
    }

    console.log('Executing count query for user_id:', userId)
    
    // Query to count unread notifications for the user
    const [rows] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE user_id = ? AND (read_status = FALSE OR read_status IS NULL)`,
      [userId]
    ) as [any[], any]

    const count = rows[0]?.count || 0
    console.log('Query result count:', count)

    return NextResponse.json({ count })

  } catch (error) {
    console.error('Error fetching notification count:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // If it's a table doesn't exist error, return 0
    if (error instanceof Error && error.message.includes("doesn't exist")) {
      return NextResponse.json({ count: 0 })
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      try {
        await connection.end()
        console.log('Database connection closed')
      } catch (closeError) {
        console.error('Error closing connection:', closeError)
      }
    }
  }
}