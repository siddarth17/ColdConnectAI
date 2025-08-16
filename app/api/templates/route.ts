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

// GET /api/templates - Get all templates for authenticated user
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

    // Return user's templates or empty array if none exist
    const templates = user.templates || []
    
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST /api/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { title, type, content }: TemplateData = await request.json()
    
    if (!title || !type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create new template
    const newTemplate = {
      id: Date.now().toString(),
      title,
      type,
      content,
      preview: content.substring(0, 150) + '...',
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }

    // Initialize templates array if it doesn't exist
    if (!user.templates) {
      user.templates = []
    }

    user.templates.push(newTemplate)
    await user.save()

    return NextResponse.json({ template: newTemplate })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}