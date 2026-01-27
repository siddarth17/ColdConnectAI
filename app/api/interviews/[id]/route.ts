import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

interface JWTPayload {
  userId: string
  email: string
}

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: RouteParams) {
  try {
    const { id } = await ctx.params
    await dbConnect()
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { question, answer, storiesUsed, experienceIds, additionalNotes } = await request.json()
    const user = await User.findById(decoded.userId)
    if (!user || !user.interviews) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const idx = user.interviews.findIndex((i: any) => i.id === id)
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
    user.interviews[idx] = {
      ...user.interviews[idx]._doc,
      question: question ?? user.interviews[idx].question,
      answer: answer ?? user.interviews[idx].answer,
      storiesUsed: Array.isArray(storiesUsed) ? storiesUsed : user.interviews[idx].storiesUsed,
      experienceIds: Array.isArray(experienceIds) ? experienceIds : user.interviews[idx].experienceIds,
      additionalNotes: additionalNotes ?? user.interviews[idx].additionalNotes ?? "",
      updatedAt: new Date().toISOString(),
    }
    await user.save()
    return NextResponse.json({ interview: user.interviews[idx] })
  } catch (error) {
    console.error("Update interview error:", error)
    return NextResponse.json({ error: "Failed to update interview" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: RouteParams) {
  try {
    const { id } = await ctx.params
    await dbConnect()
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await User.findById(decoded.userId)
    if (!user || !user.interviews) return NextResponse.json({ error: "Not found" }, { status: 404 })
    user.interviews = user.interviews.filter((i: any) => i.id !== id)
    await user.save()
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    console.error("Delete interview error:", error)
    return NextResponse.json({ error: "Failed to delete interview" }, { status: 500 })
  }
}
