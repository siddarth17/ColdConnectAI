import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

interface JWTPayload {
  userId: string
  email: string
}

interface TemplateData {
  title: string
  type: 'Email' | 'Letter'
  content: string
}

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/templates/[id] - Get specific template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const templateId = params.id

    const user = await User.findById(decoded.userId)
    if (!user || !user.templates) {
      return NextResponse.json({ error: 'User or templates not found' }, { status: 404 })
    }

    // Find specific template
    const template = user.templates.find((t: any) => t.id === templateId)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

// PUT /api/templates/[id] - Update template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { title, type, content }: TemplateData = await request.json()
    const templateId = params.id

    const user = await User.findById(decoded.userId)
    if (!user || !user.templates) {
      return NextResponse.json({ error: 'User or templates not found' }, { status: 404 })
    }

    // Find and update template
    const templateIndex = user.templates.findIndex((t: any) => t.id === templateId)
    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    user.templates[templateIndex] = {
      ...user.templates[templateIndex],
      title,
      type,
      content,
      preview: content.substring(0, 150) + '...',
      updatedAt: new Date().toISOString()
    }

    await user.save()

    return NextResponse.json({ template: user.templates[templateIndex] })
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const templateId = params.id

    const user = await User.findById(decoded.userId)
    if (!user || !user.templates) {
      return NextResponse.json({ error: 'User or templates not found' }, { status: 404 })
    }

    // Remove template
    user.templates = user.templates.filter((t: any) => t.id !== templateId)
    await user.save()

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}