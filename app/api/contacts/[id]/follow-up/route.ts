import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'

interface JWTPayload {
  userId: string
  email: string
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    
    // Await params for NextJS 15 compatibility
    const params = await context.params
    const contactId = params.id
    const { followUpMessage, type } = await request.json()

    const user = await User.findById(decoded.userId)
    if (!user || !user.contacts) {
      return NextResponse.json({ error: 'User or contacts not found' }, { status: 404 })
    }

    const contactIndex = user.contacts.findIndex((c: any) => c.id === contactId)
    if (contactIndex === -1) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // IMPORTANT: Preserve ALL existing contact data
    const existingContact = user.contacts[contactIndex]
    const updatedContact = {
      ...existingContact, // Keep ALL existing fields
      lastContacted: new Date().toISOString()
    }

    if (type === 'followup') {
      updatedContact.status = 'follow_up_sent'
      updatedContact.followUpCount = (existingContact.followUpCount || 0) + 1
      updatedContact.lastFollowUpMessage = followUpMessage
    } else if (type === 'linkedin') {
      updatedContact.status = 'connected'
      updatedContact.lastLinkedInMessage = followUpMessage
    }

    user.contacts[contactIndex] = updatedContact
    await user.save()

    return NextResponse.json({ contact: user.contacts[contactIndex] })
  } catch (error) {
    console.error('Follow-up error:', error)
    return NextResponse.json({ error: 'Failed to record follow-up' }, { status: 500 })
  }
}