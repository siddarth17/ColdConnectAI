"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Sparkles, RefreshCw, Plus, Save, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Story {
  id: string
  title: string
  points: string[]
}

interface WorkExperience {
  id: number | string
  company: string
  title: string
  startDate: string
  endDate?: string
  description: string
}

interface InterviewItem {
  id: string
  question: string
  answer: string
  storiesUsed: string[]
  experienceIds: string[]
  createdAt: string
  updatedAt: string
}

export default function InterviewsPage() {
  const { toast } = useToast()
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [interviews, setInterviews] = useState<InterviewItem[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([])
  const [selectedStories, setSelectedStories] = useState<string[]>([])
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [additionalNotes, setAdditionalNotes] = useState("")

  useEffect(() => {
    fetchStories()
    fetchProfile()
    fetchInterviews()
  }, [])

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/stories")
      if (res.ok) {
        const data = await res.json()
        setStories(data.stories || [])
      }
    } catch (error) {
      console.error(error)
    }
  }

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

  const fetchInterviews = async () => {
    try {
      const res = await fetch("/api/interviews")
      if (res.ok) {
        const data = await res.json()
        setInterviews(data.interviews || [])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleGenerate = async () => {
    if (!question.trim()) {
      toast({ title: "Question required", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/interviews/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          storyIds: selectedStories,
          experienceIds: selectedExperiences,
          additionalNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")
      setAnswer(data.answer || "")
    } catch (error) {
      toast({ title: "Generation failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      toast({ title: "Nothing to save", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const payload = {
        question,
        answer,
        storiesUsed: selectedStories,
        experienceIds: selectedExperiences,
        additionalNotes,
      }
      const res = await fetch(editingId ? `/api/interviews/${editingId}` : "/api/interviews", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      setInterviews((prev) =>
        editingId
          ? prev.map((i) => (i.id === editingId ? data.interview : i))
          : [data.interview, ...prev]
      )
      toast({ title: editingId ? "Updated" : "Saved" })
      setOpenModal(false)
      setEditingId(null)
    } catch (error) {
      toast({ title: "Save failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const bubbles = useMemo(() => interviews, [interviews])

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Interviews
          </h1>
          <p className="text-muted-foreground">
            Generate and save STAR answers using your profile and stories.
          </p>
        </div>
        <Dialog open={openModal} onOpenChange={(v) => { setOpenModal(v); if (!v) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Interview Answer" : "New Interview Answer"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Question</Label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Tell me about a time you resolved a conflict on your team."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Stories to include (optional)</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedStories.length ? `${selectedStories.length} selected` : "Select stories"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72">
                      <DropdownMenuLabel>Stories</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {stories.map((s) => {
                        const checked = selectedStories.includes(s.id)
                        return (
                          <DropdownMenuCheckboxItem
                            key={s.id}
                            checked={checked}
                            onCheckedChange={() => {
                              setSelectedStories((prev) =>
                                checked ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                              )
                            }}
                          >
                            {s.title}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <Label>Experiences to emphasize (optional)</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedExperiences.length ? `${selectedExperiences.length} selected` : "Select experiences"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72">
                      <DropdownMenuLabel>Work Experience</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {workExperience.map((exp) => {
                        const id = String(exp.id)
                        const checked = selectedExperiences.includes(id)
                        return (
                          <DropdownMenuCheckboxItem
                            key={id}
                            checked={checked}
                            onCheckedChange={() => {
                              setSelectedExperiences((prev) =>
                                checked ? prev.filter((x) => x !== id) : [...prev, id]
                              )
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
                <Label>Answer</Label>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Generated answer will appear here..."
                  className="min-h-[200px]"
                />
              </div>
              <div>
                <Label>Additional Notes (optional)</Label>
                <Textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any extra guidance, constraints, or talking points to include in the answer."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleGenerate} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {loading ? "Generating..." : "Generate"}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {editingId ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Answers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {bubbles.length === 0 ? (
            <p className="text-muted-foreground">No saved answers yet.</p>
          ) : (
            bubbles.map((item) => (
              <Dialog key={item.id}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {item.question.slice(0, 40)}{item.question.length > 40 ? "..." : ""}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>{item.question}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {item.storiesUsed?.map((id) => {
                        const story = stories.find((s) => s.id === id)
                        return story ? <Badge key={id} variant="secondary">{story.title}</Badge> : null
                      })}
                    </div>
                    <div className="rounded-md border p-3 text-sm whitespace-pre-wrap">{item.answer}</div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setQuestion(item.question)
                          setAnswer(item.answer)
                      setSelectedStories(item.storiesUsed || [])
                      setSelectedExperiences(item.experienceIds || [])
                      setAdditionalNotes(item.additionalNotes || "")
                      setEditingId(item.id)
                      setOpenModal(true)
                    }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          const res = await fetch(`/api/interviews/${item.id}`, { method: "DELETE" })
                          if (res.ok) {
                            setInterviews((prev) => prev.filter((i) => i.id !== item.id))
                            toast({ title: "Deleted" })
                          } else {
                            toast({ title: "Delete failed", variant: "destructive" })
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
