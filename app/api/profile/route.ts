import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'

interface JWTPayload {
  userId: string
  email: string
}

interface WorkExperience {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  description: string
}

interface Education {
  id: string
  institution: string
  degree: string
  field: string
  graduationDate: string
}

interface ProfileData {
  name: string
  email: string
  phone?: string
  location?: string
  personalSummary?: string
  workExperience?: WorkExperience[]
  education?: Education[]
  skills?: string[]
}

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return the profile data with proper structure from nested profile field
    const profile = {
      name: user.name,
      email: user.email,
      phone: user.profile?.phone || '',
      location: user.profile?.location || '',
      personalSummary: user.profile?.personalSummary || '',
      workExperience: user.profile?.workExperience || [],
      education: user.profile?.education || [],
      skills: user.profile?.skills || []
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const profileData: ProfileData = await request.json()
    
    // Validate required fields
    if (!profileData.name || !profileData.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const user = await User.findByIdAndUpdate(
      decoded.userId, 
      { 
        name: profileData.name,
        email: profileData.email,
        'profile.phone': profileData.phone,
        'profile.location': profileData.location,
        'profile.personalSummary': profileData.personalSummary,
        'profile.workExperience': profileData.workExperience,
        'profile.education': profileData.education,
        'profile.skills': profileData.skills,
        updatedAt: new Date().toISOString()
      }, 
      { new: true }
    ).select('-password')
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const profile = {
      name: user.name,
      email: user.email,
      phone: user.profile?.phone || '',
      location: user.profile?.location || '',
      personalSummary: user.profile?.personalSummary || '',
      workExperience: user.profile?.workExperience || [],
      education: user.profile?.education || [],
      skills: user.profile?.skills || []
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}