import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

interface JWTPayload {
  userId: string
  email: string
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await User.findById(decoded.userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json({ stories: user.stories || [] })
  } catch (error) {
    console.error("Get stories error:", error)
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { title, points } = await request.json()
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })
    const user = await User.findById(decoded.userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (!user.stories) user.stories = []
    const story = {
      id: Date.now().toString(),
      title,
      points: Array.isArray(points) ? points : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    user.stories.push(story)
    await user.save()
    return NextResponse.json({ story })
  } catch (error) {
    console.error("Create story error:", error)
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 })
  }
}
