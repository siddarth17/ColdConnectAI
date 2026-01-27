"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sparkles, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WorkExperience {
  id: number | string
  company: string
  title: string
  startDate: string
  endDate?: string
  description: string
}

interface TailorResult {
  id: string
  bullets: string[]
}

export default function TailorPage() {
  const { toast } = useToast()
  const [company, setCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [results, setResults] = useState<TailorResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        const data = await res.json()
        setWorkExperience(data.profile.workExperience || [])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Job description required", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          jobDescription,
          experienceIds: selectedIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate")
      setResults(data.results || [])
    } catch (error) {
      toast({ title: "Generation failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const splitBullets = (text: string) =>
    (text || "")
      .split(/\r?\n+/)
      .map((b) => b.replace(/^[-•\u2022]\s*/, "").trim())
      .filter(Boolean)

  const getOriginalBullets = (id: string) => {
    const exp = workExperience.find((e) => String(e.id) === id)
    if (!exp) return []
    return splitBullets(exp.description || "")
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
            Tailor Experiences
          </h1>
          <p className="text-muted-foreground">
            Align your bullets to a job description without changing the facts.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Company (optional)</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <Label>Select experiences to tailor (optional)</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedIds.length ? `${selectedIds.length} selected` : "Choose experiences"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                  <DropdownMenuLabel>Work Experience</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {workExperience.map((exp) => {
                    const id = String(exp.id)
                    const checked = selectedIds.includes(id)
                    return (
                      <DropdownMenuCheckboxItem
                        key={id}
                        checked={checked}
                        onCheckedChange={() => {
                          setSelectedIds((prev) => (checked ? prev.filter((x) => x !== id) : [...prev, id]))
                        }}
                      >
                        {exp.title} @ {exp.company}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div>
            <Label>Paste job description</Label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-[180px]"
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full md:w-auto">
            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loading ? "Generating..." : "Generate tailored bullets"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tailored Bullets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.map((res) => {
              const original = getOriginalBullets(res.id)
              const tailored = (res.bullets || []).flatMap((b) => splitBullets(String(b)))
              const count = Math.max(original.length, tailored.length)
              return (
                <div key={res.id} className="border rounded-md p-4 space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Experience ID: {res.id} (original {original.length} → tailored {tailored.length} bullets)
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold mb-2">Original</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {original.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Tailored</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {tailored.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                      {count === 0 && <p className="text-sm text-muted-foreground">No bullets returned.</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
