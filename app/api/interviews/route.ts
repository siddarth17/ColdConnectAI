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
    return NextResponse.json({ interviews: user.interviews || [] })
  } catch (error) {
    console.error("Get interviews error:", error)
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { question, answer, storiesUsed, experienceIds, additionalNotes } = await request.json()
    if (!question || !answer) return NextResponse.json({ error: "Question and answer required" }, { status: 400 })
    const user = await User.findById(decoded.userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (!user.interviews) user.interviews = []
    const item = {
      id: Date.now().toString(),
      question,
      answer,
      storiesUsed: Array.isArray(storiesUsed) ? storiesUsed : [],
      experienceIds: Array.isArray(experienceIds) ? experienceIds : [],
      additionalNotes: additionalNotes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    user.interviews.push(item)
    await user.save()
    return NextResponse.json({ interview: item })
  } catch (error) {
    console.error("Create interview error:", error)
    return NextResponse.json({ error: "Failed to save interview" }, { status: 500 })
  }
}

// DELETE all is not needed; single delete handled in /[id]
