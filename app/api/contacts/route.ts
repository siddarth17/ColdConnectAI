import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

interface JWTPayload {
  userId: string
  email: string
}

interface ContactData {
  name: string
  company: string
  position: string
  email?: string
}

// GET /api/contacts - Get all contacts for authenticated user
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

    // Return user's contacts or empty array if none exist
    const contacts = user.contacts || []
    
    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Get contacts error:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { name, company, position, email }: ContactData = await request.json()
    
    if (!name || !company || !position) {
      return NextResponse.json({ error: 'Name, company, and position are required' }, { status: 400 })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if contact already exists
    if (user.contacts) {
      const existingContact = user.contacts.find((c: any) => 
        c.name.toLowerCase() === name.toLowerCase() && 
        c.company.toLowerCase() === company.toLowerCase()
      )
      if (existingContact) {
        return NextResponse.json({ error: 'Contact already exists' }, { status: 400 })
      }
    }

    // Create new contact
    const newContact = {
      id: Date.now().toString(),
      name,
      company,
      position,
      email,
      createdAt: new Date().toISOString(),
      lastContacted: new Date().toISOString()
    }

    // Initialize contacts array if it doesn't exist
    if (!user.contacts) {
      user.contacts = []
    }

    user.contacts.push(newContact)
    await user.save()

    return NextResponse.json({ contact: newContact })
  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}