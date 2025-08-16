import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'

interface JWTPayload {
  userId: string
  email: string
}

interface RouteParams {
  params: {
    id: string
  }
}

// DELETE /api/contacts/[id] - Delete contact
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const contactId = params.id

    const user = await User.findById(decoded.userId)
    if (!user || !user.contacts) {
      return NextResponse.json({ error: 'User or contacts not found' }, { status: 404 })
    }

    user.contacts = user.contacts.filter((c: any) => c.id !== contactId)
    await user.save()

    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Delete contact error:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}