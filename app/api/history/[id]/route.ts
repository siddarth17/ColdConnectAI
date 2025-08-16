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

interface RouteParams {
  params: {
    id: string
  }
}

// PUT /api/history/[id] - Update existing history item
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { title, company, type, content, formData }: HistoryData = await request.json()
    const historyId = params.id
    
    if (!title || !company || !type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await User.findById(decoded.userId)
    if (!user || !user.history) {
      return NextResponse.json({ error: 'User or history not found' }, { status: 404 })
    }

    // Find and update history item
    const historyIndex = user.history.findIndex((h: any) => h.id === historyId)
    if (historyIndex === -1) {
      return NextResponse.json({ error: 'History item not found' }, { status: 404 })
    }

    // Update the history item
    user.history[historyIndex] = {
      ...user.history[historyIndex],
      title,
      company,
      type,
      content,
      formData,
      date: new Date().toISOString() // Update the date to show when it was last modified
    }

    await user.save()

    return NextResponse.json({ historyItem: user.history[historyIndex] })
  } catch (error) {
    console.error('Update history error:', error)
    return NextResponse.json({ error: 'Failed to update history' }, { status: 500 })
  }
}

// DELETE /api/history/[id] - Delete history item (existing code)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const historyId = params.id

    const user = await User.findById(decoded.userId)
    if (!user || !user.history) {
      return NextResponse.json({ error: 'User or history not found' }, { status: 404 })
    }

    user.history = user.history.filter((h: any) => h.id !== historyId)
    await user.save()

    return NextResponse.json({ message: 'History item deleted successfully' })
  } catch (error) {
    console.error('Delete history error:', error)
    return NextResponse.json({ error: 'Failed to delete history item' }, { status: 500 })
  }
}