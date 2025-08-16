import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

interface JWTPayload {
  userId: string
  email: string
}

interface HistoryData {
  title: string
  company: string
  type: 'Email' | 'Letter'
  content: string
  formData?: any
}

// GET /api/history - Get all history items for authenticated user
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return user's history or empty array if none exist
    const history = user.history || []
    
    return NextResponse.json({ history })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

// POST /api/history - Create new history item
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { title, company, type, content, formData }: HistoryData = await request.json()
    
    if (!title || !company || !type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create new history item
    const newHistoryItem = {
      id: Date.now().toString(),
      title,
      company,
      type,
      content,
      formData,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    // Initialize history array if it doesn't exist
    if (!user.history) {
      user.history = []
    }

    user.history.push(newHistoryItem)
    await user.save()

    return NextResponse.json({ historyItem: newHistoryItem })
  } catch (error) {
    console.error('Create history error:', error)
    return NextResponse.json({ error: 'Failed to create history' }, { status: 500 })
  }
}