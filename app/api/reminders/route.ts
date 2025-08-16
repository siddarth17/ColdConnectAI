import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

interface JWTPayload {
  userId: string
  email: string
}

interface ReminderData {
  text: string
  date: string
  color?: string
}

// GET /api/reminders - Get all reminders for authenticated user
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

    // Return user's reminders or empty array if none exist
    const reminders = user.reminders || []
    
    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Get reminders error:', error)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}

// POST /api/reminders - Create new reminder
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { text, date, color }: ReminderData = await request.json()
    
    if (!text || !date) {
      return NextResponse.json({ error: 'Text and date are required' }, { status: 400 })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create new reminder
    const newReminder = {
      id: Date.now().toString(),
      text,
      date,
      color: color || 'bg-blue-500',
      createdAt: new Date().toISOString()
    }

    // Initialize reminders array if it doesn't exist
    if (!user.reminders) {
      user.reminders = []
    }

    user.reminders.push(newReminder)
    await user.save()

    return NextResponse.json({ reminder: newReminder })
  } catch (error) {
    console.error('Create reminder error:', error)
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
  }
}