import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User';

interface JWTPayload {
  userId: string
  email: string
}

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/templates/[id]/use - Mark template as used
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Find and update last used date
    const templateIndex = user.templates.findIndex((t: any) => t.id === templateId)
    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    user.templates[templateIndex].lastUsed = new Date().toISOString()
    await user.save()

    return NextResponse.json({ template: user.templates[templateIndex] })
  } catch (error) {
    console.error('Use template error:', error)
    return NextResponse.json({ error: 'Failed to update template usage' }, { status: 500 })
  }
}