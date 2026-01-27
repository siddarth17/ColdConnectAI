"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Save, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Story {
  id: string
  title: string
  points: string[]
  createdAt: string
  updatedAt: string
}

export default function StoriesPage() {
  const { toast } = useToast()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Story | null>(null)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [points, setPoints] = useState<string[]>([""])

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/stories")
      if (res.ok) {
        const data = await res.json()
        setStories(data.stories || [])
      }
    } catch (error) {
      console.error("Fetch stories error", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setPoints([""])
    setEditing(null)
    setOpen(false)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const payload = { title: title.trim(), points: points.filter(Boolean) }
      const res = await fetch(editing ? `/api/stories/${editing.id}` : "/api/stories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Save failed")
      await fetchStories()
      toast({ title: editing ? "Story updated" : "Story added" })
      resetForm()
    } catch (error) {
      console.error(error)
      toast({ title: "Save failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/stories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setStories((prev) => prev.filter((s) => s.id !== id))
      toast({ title: "Story deleted" })
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">Stories</h1>
          <p className="text-muted-foreground">Capture your stories to reuse in interviews and outreach.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true) }}><Plus className="mr-2 h-4 w-4" /> Add Story</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Story" : "New Story"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Led migration to microservices" />
              </div>
              <div className="space-y-2">
                <Label>Points (bullets)</Label>
                {points.map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Textarea
                      value={p}
                      onChange={(e) => {
                        const next = [...points]
                        next[idx] = e.target.value
                        setPoints(next)
                      }}
                      placeholder="Situation/Task/Action/Result"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setPoints((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={points.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" onClick={() => setPoints((prev) => [...prev, ""])}>
                  <Plus className="h-4 w-4 mr-2" /> Add Bullet
                </Button>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                  {editing ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Stories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : stories.length === 0 ? (
            <p className="text-muted-foreground">No stories yet.</p>
          ) : (
            stories.map((story) => (
              <div key={story.id} className="rounded-md border p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{story.title}</p>
                    <p className="text-xs text-muted-foreground">Updated {new Date(story.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                    onClick={() => {
                      setEditing(story)
                      setTitle(story.title)
                      setPoints(story.points?.length ? story.points : [""])
                      setOpen(true)
                    }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(story.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {story.points?.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
