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

    const { company, jobDescription, experienceIds = [] } = await request.json()
    if (!jobDescription) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 })
    }

    const profile = user.profile || {}
    const experiences = (profile.workExperience || []).filter((exp: any) =>
      experienceIds.length ? experienceIds.includes(String(exp.id)) : true
    )

    if (!experiences.length) {
      return NextResponse.json({ error: "No experiences selected or available" }, { status: 400 })
    }

    const expText = experiences
      .map(
        (exp: any, i: number) =>
          `Experience ${i + 1} (keep bullet count ${exp.description ? exp.description.split("\n").length : 0}):\nTitle: ${
            exp.title
          }\nCompany: ${exp.company}\nDates: ${exp.startDate} - ${exp.endDate || "Present"}\nBullets:\n${
            exp.description || ""
          }`
      )
      .join("\n\n")

    const prompt = `
You rewrite resume bullets to align with a target job description while keeping every fact true to the spirit of the original experience.
Company: ${company || "N/A"}
Job Description (JD):
${jobDescription}

Candidate Experiences (keep order):
${expText}

Rules per experience:
- For every bullet, weave in the most relevant JD keywords (skills/tech/responsibilities/metrics) that plausibly fit this experience.
- You may lightly extend or rephrase bullets to better match the JD, as long as the direction/topic of the original bullet stays the same.
- If a bullet already aligns, keep it or make a small tweak to add missing JD language. but make sure overall for all the experiences bullets nothing from the jd keywords are missed.
- Keep SAME bullet count and roughly SAME length per bullet.
- Use concise action-verb bullets; keep existing impact/metrics or plausible refinements, but do not introduce contradictions with the role/scope described.
- OUTPUT JSON ONLY: { "results": [ { "id": "<experienceId>", "bullets": ["..."] } ] } in the same experience order (ids from input). Each "bullets" array must have exactly the same length as the provided bullet list for that experience, with each bullet as its own string element (no embedded newlines).
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a precise resume tailoring assistant." },
        { role: "user", content: prompt },
      ],
    })

    const raw = completion.choices[0].message.content || "{}"
    let parsed: any = {}
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = {}
    }

    const countMap: Record<string, number> = {}
    experiences.forEach((exp: any) => {
      const targetCount = (exp.description || "").split(/\r?\n+/).filter((x: string) => x.trim()).length
      countMap[String(exp.id)] = Math.max(targetCount, 1)
    })

    const normalizeBullets = (val: any): string[] => {
      const rawBullets = Array.isArray(val)
        ? val
        : typeof val === "string"
          ? val.split(/\r?\n+/)
          : []
      const cleaned = rawBullets
        .flatMap((b: any) =>
          String(b || "")
            .split(/\r?\n+/)
            .map((s) => s.replace(/^[-•\u2022]\s*/, "").trim())
        )
        .filter(Boolean)
      return cleaned
    }

    const rebalanceToCount = (bullets: string[], target: number): string[] => {
      if (target <= 0) return bullets
      if (bullets.length === target) return bullets
      // try sentence split if too few
      if (bullets.length === 1 && target > 1) {
        const splitSentences = bullets[0].split(/(?<=[.;!?])\s+/).map((s) => s.trim()).filter(Boolean)
        if (splitSentences.length >= target) {
          return splitSentences.slice(0, target)
        }
      }
      if (bullets.length < target) {
        const last = bullets[bullets.length - 1] || ""
        while (bullets.length < target) bullets.push(last)
      } else if (bullets.length > target) {
        bullets = bullets.slice(0, target)
      }
      return bullets
    }

    const cleanResults = (Array.isArray(parsed.results) ? parsed.results : []).map((r: any) => {
      const id = String(r.id || "")
      const targetCount = countMap[id] ?? 0
      const bullets = rebalanceToCount(normalizeBullets(r.bullets), targetCount)
      return { id, bullets }
    })

    return NextResponse.json({ results: cleanResults })
  } catch (error) {
    console.error("Tailor error:", error)
    return NextResponse.json({ error: "Failed to tailor experiences" }, { status: 500 })
  }
}
