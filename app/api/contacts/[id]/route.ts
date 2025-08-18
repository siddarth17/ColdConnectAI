import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'

interface JWTPayload {
  userId: string
  email: string
}

// PUT /api/contacts/[id] - Update contact (FIXED for NextJS 15)
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    const updateData = await request.json()

    console.log('Updating contact:', contactId, 'with data:', updateData)

    const user = await User.findById(decoded.userId)
    if (!user || !user.contacts) {
      return NextResponse.json({ error: 'User or contacts not found' }, { status: 404 })
    }

    const contactIndex = user.contacts.findIndex((c: any) => c.id === contactId)
    if (contactIndex === -1) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // IMPORTANT: Preserve ALL existing contact data and only update specific fields
    const existingContact = user.contacts[contactIndex]
    user.contacts[contactIndex] = {
      // Keep ALL existing fields
      ...existingContact,
      // Only update the fields that were sent
      ...updateData,
      // Always update lastContacted
      lastContacted: updateData.lastContacted || new Date().toISOString(),
      // Ensure core fields are preserved if not in updateData
      id: existingContact.id,
      name: updateData.name || existingContact.name,
      company: updateData.company || existingContact.company,
      position: updateData.position || existingContact.position,
      createdAt: existingContact.createdAt, // Never overwrite creation date
    }

    await user.save()
    
    console.log('Contact updated successfully:', user.contacts[contactIndex])
    return NextResponse.json({ contact: user.contacts[contactIndex] })
  } catch (error) {
    console.error('Update contact error:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

// DELETE /api/contacts/[id] - Delete contact (FIXED for NextJS 15)
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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