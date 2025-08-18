import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

interface JWTPayload {
  userId: string
  email: string
}

interface EnhancedContactData {
  name: string
  company: string
  position: string
  email?: string
  linkedinUrl?: string
  status?: 'contacted' | 'responded' | 'no_response' | 'follow_up_sent' | 'connected'
  originalMessage?: string
  lastMessageType?: 'email' | 'cover_letter'
  notes?: string
}

// GET /api/contacts - Get all contacts with enhanced data
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

    // Filter out any contacts with missing required fields
    const contacts = (user.contacts || []).filter((contact: any) => 
      contact && contact.name && contact.company && contact.position
    )
    
    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Get contacts error:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

// POST /api/contacts - Create/update contact with message association
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { 
      name, 
      company, 
      position, 
      email, 
      linkedinUrl,
      originalMessage,
      lastMessageType,
      status,
      notes
    }: EnhancedContactData = await request.json()
    
    console.log('Received contact data:', { name, company, position })
    
    if (!name || !company || !position) {
      return NextResponse.json({ error: 'Name, company, and position are required' }, { status: 400 })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Initialize contacts array if it doesn't exist
    if (!user.contacts) {
      user.contacts = []
    }

    // FIXED: Safe contact lookup with proper null checks
    let existingContactIndex = -1
    try {
      existingContactIndex = user.contacts.findIndex((c: any) => {
        // Comprehensive null safety checks
        if (!c) return false
        if (!c.name || typeof c.name !== 'string') return false
        if (!c.company || typeof c.company !== 'string') return false
        if (!name || typeof name !== 'string') return false
        if (!company || typeof company !== 'string') return false
        
        return (
          c.name.toLowerCase().trim() === name.toLowerCase().trim() && 
          c.company.toLowerCase().trim() === company.toLowerCase().trim()
        )
      })
    } catch (findError) {
      console.error('Error finding existing contact:', findError)
      existingContactIndex = -1 // Treat as new contact if search fails
    }
    
    if (existingContactIndex !== -1) {
      // Update existing contact
      const existingContact = user.contacts[existingContactIndex]
      user.contacts[existingContactIndex] = {
        ...existingContact,
        name: name.trim(),
        company: company.trim(),
        position: position.trim(),
        email: email?.trim() || existingContact.email,
        linkedinUrl: linkedinUrl?.trim() || existingContact.linkedinUrl,
        originalMessage: originalMessage || existingContact.originalMessage,
        lastMessageType: lastMessageType || existingContact.lastMessageType,
        lastContacted: new Date().toISOString(),
        status: status || (originalMessage ? 'contacted' : existingContact.status),
        notes: notes?.trim() || existingContact.notes
      }
      await user.save()
      console.log('Contact updated successfully')
      return NextResponse.json({ 
        contact: user.contacts[existingContactIndex], 
        updated: true 
      })
    }

    // Create new contact
    const newContact = {
      id: Date.now().toString(),
      name: name.trim(),
      company: company.trim(),
      position: position.trim(),
      email: email?.trim(),
      linkedinUrl: linkedinUrl?.trim(),
      status: status || 'contacted',
      originalMessage,
      lastMessageType,
      createdAt: new Date().toISOString(),
      lastContacted: new Date().toISOString(),
      followUpCount: 0,
      notes: notes?.trim()
    }

    user.contacts.push(newContact)
    await user.save()

    console.log('New contact created successfully')
    return NextResponse.json({ contact: newContact, updated: false })
  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}