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
    const { id: storyId } = await ctx.params
    await dbConnect()
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const { title, points } = await request.json()
    const user = await User.findById(decoded.userId)
    if (!user || !user.stories) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const idx = user.stories.findIndex((s: any) => s.id === storyId)
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })
    user.stories[idx] = {
      ...user.stories[idx]._doc,
      title: title ?? user.stories[idx].title,
      points: Array.isArray(points) ? points : user.stories[idx].points,
      updatedAt: new Date().toISOString(),
    }
    await user.save()
    return NextResponse.json({ story: user.stories[idx] })
  } catch (error) {
    console.error("Update story error:", error)
    return NextResponse.json({ error: "Failed to update story" }, { status: 500 })
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
    if (!user || !user.stories) return NextResponse.json({ error: "Not found" }, { status: 404 })
    user.stories = user.stories.filter((s: any) => s.id !== id)
    await user.save()
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    console.error("Delete story error:", error)
    return NextResponse.json({ error: "Failed to delete story" }, { status: 500 })
  }
}
