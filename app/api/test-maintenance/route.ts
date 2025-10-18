import { NextResponse } from 'next/server'

const testData: any[] = []

export async function GET() {
  return NextResponse.json({
    success: true,
    data: testData
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const newItem = {
      id: Date.now(),
      ...body,
      timestamp: new Date().toISOString()
    }
    
    testData.push(newItem)
    
    return NextResponse.json({
      success: true,
      data: newItem
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro no servidor' },
      { status: 500 }
    )
  }
}