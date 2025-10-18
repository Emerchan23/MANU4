// API route para inicializar o servidor WebSocket
import { NextRequest, NextResponse } from 'next/server';
import { getNotificationServer } from '@/lib/websocket-server';

export async function GET(request: NextRequest) {
  try {
    const server = getNotificationServer();
    
    return NextResponse.json({
      success: true,
      message: 'WebSocket server initialized',
      status: 'running'
    });
  } catch (error) {
    console.error('Error initializing WebSocket server:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize WebSocket server'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    const server = getNotificationServer();
    
    switch (action) {
      case 'broadcast':
        server.broadcastNotification(data);
        break;
        
      case 'send_to_user':
        server.sendNotificationToUser(data.userId, data.notification);
        break;
        
      case 'update_count':
        server.updateNotificationCount(data.userId, data.count);
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Action ${action} executed successfully`
    });
  } catch (error) {
    console.error('Error executing WebSocket action:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute WebSocket action'
    }, { status: 500 });
  }
}