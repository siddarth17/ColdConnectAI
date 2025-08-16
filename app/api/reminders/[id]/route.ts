import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'

interface JWTPayload {
  userId: string
  email: string
}

// DELETE /api/reminders/[id] - Delete a reminder by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const reminderId = params.id
    if (!reminderId) {
      return NextResponse.json({ error: 'Reminder ID required' }, { status: 400 })
    }

    // Remove the reminder from the user's reminders array
    const originalLength = user.reminders?.length || 0
    user.reminders = (user.reminders || []).filter((reminder: any) => reminder.id !== reminderId)
    if (user.reminders.length === originalLength) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }
    await user.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete reminder error:', error)
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 })
  }
} 