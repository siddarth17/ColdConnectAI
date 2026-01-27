import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { OpenAI } from "openai"
import pdfParse from "pdf-parse"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

interface JWTPayload {
  userId: string
  email: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let resumeText = ""
    const mime = file.type || ""
    if (mime.includes("pdf")) {
      const parsed = await pdfParse(buffer)
      resumeText = parsed.text
    } else {
      // fallback: treat as text/word content; attempt to decode
      resumeText = buffer.toString("utf-8")
    }

    // Keep prompt size sane
    const truncated = resumeText.slice(0, 12000)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an information extractor that converts resume text into structured JSON. " +
            "Return ONLY JSON with keys: summary (string), workExperience (array), education (array), skills (array). " +
            "Each workExperience item: {id, company, title, startDate, endDate, description}. " +
            "Each education item: {id, institution, degree, field, graduationDate}. " +
            "Skills should be an array of strings. Leave arrays empty if not found.",
        },
        {
          role: "user",
          content: `Resume text:\n${truncated}`,
        },
      ],
    })

    const raw = completion.choices[0].message.content || "{}"
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = {}
    }

    const workExperience = Array.isArray(parsed.workExperience)
      ? parsed.workExperience
      : []
    const education = Array.isArray(parsed.education) ? parsed.education : []
    const skills = Array.isArray(parsed.skills) ? parsed.skills : []
    const summary = typeof parsed.summary === "string" ? parsed.summary : ""

    // normalize ids and defaults
    const now = Date.now()
    const normalizeDescription = (desc: any) => {
      if (!desc) return ""
      const text = String(desc)
      const bulletish = text
        .split(/\r?\n|•|-\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
      const sentences =
        bulletish.length > 1
          ? bulletish
          : text
              .split(/(?<=[\.!?])\s+/)
              .map((s) => s.trim())
              .filter(Boolean)
      if (!sentences.length) return text.trim()
      return "• " + sentences.join("\n• ")
    }

    const normalizedWork = workExperience.map((exp: any, idx: number) => ({
      id: exp?.id ?? now + idx,
      company: exp?.company || "",
      title: exp?.title || "",
      startDate: exp?.startDate || "",
      endDate: exp?.endDate || "",
      description: normalizeDescription(exp?.description),
    }))

    const normalizedEducation = education.map((edu: any, idx: number) => ({
      id: edu?.id ?? now + 1000 + idx,
      institution: edu?.institution || "",
      degree: edu?.degree || "",
      field: edu?.field || "",
      graduationDate: edu?.graduationDate || "",
    }))

    // save to user profile
    user.profile = {
      ...user.profile,
      personalSummary: summary || user.profile?.personalSummary || "",
      workExperience: normalizedWork,
      education: normalizedEducation,
      skills,
    }
    await user.save()

    return NextResponse.json({
      summary,
      workExperience: normalizedWork,
      education: normalizedEducation,
      skills,
    })
  } catch (error) {
    console.error("Resume parse error:", error)
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 })
  }
}
