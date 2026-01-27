import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { OpenAI } from "openai"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface JWTPayload {
  userId: string
  email: string
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const user = await User.findById(decoded.userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { question, storyIds = [], experienceIds = [], additionalNotes = "" } = await request.json()
    if (!question) return NextResponse.json({ error: "Question required" }, { status: 400 })

    const profile = user.profile || {}
    const workExperience = profile.workExperience || []
    const education = profile.education || []
    const skills = profile.skills || []
    const selectedStories = (user.stories || []).filter((s: any) => storyIds.includes(String(s.id)))

    const contextParts: string[] = []
    contextParts.push(`SUMMARY: ${profile.personalSummary || "N/A"}`)
    contextParts.push("WORK EXPERIENCE:")
    workExperience.forEach((exp: any) => {
      if (experienceIds.length === 0 || experienceIds.includes(String(exp.id))) {
        contextParts.push(`- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || "Present"}): ${exp.description}`)
      }
    })
    contextParts.push("EDUCATION:")
    education.forEach((edu: any) => contextParts.push(`- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.graduationDate})`))
    contextParts.push(`SKILLS: ${skills.join(", ")}`)
    if (selectedStories.length) {
      contextParts.push("STORIES:")
      selectedStories.forEach((s: any) => {
        contextParts.push(`- ${s.title}: ${Array.isArray(s.points) ? s.points.join("; ") : ""}`)
      })
    }

    const prompt = `
You are an interview coach crafting concise STAR-style answers to behavioral questions.
Question: ${question}

Candidate Context:
${contextParts.join("\n")}
${additionalNotes ? `\nAdditional notes from user: ${additionalNotes}\n` : ""}

Requirements:
- Use STAR framework (Situation, Task, Action, Result) in 180-250 words.
- Weave in the most relevant experiences and selected stories above.
- Highlight measurable outcomes when possible.
- Keep tone confident, first-person, and concise.
- OUTPUT PLAIN TEXT ONLY. No markdown, no bullets, no asterisks, no numbering. Use 2-4 short paragraphs.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        { role: "system", content: "You are an expert behavioral interview answer generator." },
        { role: "user", content: prompt },
      ],
    })

    const raw = completion.choices[0].message.content || ""

    const answer = raw
      .replace(/\*\*/g, "")        // remove bold markers
      .replace(/^\s*\*+/gm, "")    // remove bullet asterisks at line start
      .trim()

    return NextResponse.json({ answer })
  } catch (error) {
    console.error("Interview generate error:", error)
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 })
  }
}
