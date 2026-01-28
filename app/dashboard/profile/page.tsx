"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Save, User, Briefcase, GraduationCap, Award, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WorkExperience {
  id: number
  company: string
  title: string
  startDate: string
  endDate: string
  description: string
}

interface Education {
  id: number
  institution: string
  degree: string
  field: string
  graduationDate: string
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    personalSummary: "",
  })

  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [parsingResume, setParsingResume] = useState(false)

  const [isEditingWork, setIsEditingWork] = useState(false)
  const [isEditingEducation, setIsEditingEducation] = useState(false)
  const [editingWorkItem, setEditingWorkItem] = useState<WorkExperience | null>(null)
  const [editingEducationItem, setEditingEducationItem] = useState<Education | null>(null)
  const [newSkill, setNewSkill] = useState("")

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile({
          name: data.profile.name,
          email: data.profile.email,
          phone: data.profile.phone,
          location: data.profile.location,
          personalSummary: data.profile.personalSummary,
        })
        setWorkExperience(data.profile.workExperience || [])
        setEducation(data.profile.education || [])
        setSkills(data.profile.skills || [])
      } else {
        throw new Error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          personalSummary: profile.personalSummary,
          workExperience: workExperience,
          education: education,
          skills: skills,
        }),
      })

      if (response.ok) {
        toast({
          title: "Profile saved",
          description: "Your profile has been updated successfully.",
        })
      } else {
        throw new Error('Failed to save profile')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Save failed",
        description: "Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleParseResume = async () => {
    if (!resumeFile) {
      toast({
        title: "No file selected",
        description: "Please choose a resume file first.",
        variant: "destructive"
      })
      return
    }

    setParsingResume(true)
    try {
      const formData = new FormData()
      formData.append("file", resumeFile)

      const response = await fetch('/api/profile/resume', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to parse resume')
      }

      const data = await response.json()

      setProfile((prev) => ({
        ...prev,
        personalSummary: data.summary || prev.personalSummary
      }))
      setWorkExperience(data.workExperience || [])
      setEducation(data.education || [])
      setSkills(data.skills || [])

      toast({
        title: "Resume parsed",
        description: "We extracted your experience, education, and skills. Remember to review and save.",
      })
    } catch (error) {
      console.error('Resume parse error:', error)
      toast({
        title: "Parse failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      })
    } finally {
      setParsingResume(false)
    }
  }

  const handleSaveWorkExperience = async () => {
    if (editingWorkItem) {
      let updatedWorkExperience: WorkExperience[]
      if (editingWorkItem.id) {
        updatedWorkExperience = workExperience.map((item) => (item.id === editingWorkItem.id ? editingWorkItem : item))
      } else {
        updatedWorkExperience = [...workExperience, { ...editingWorkItem, id: Date.now() }]
      }
      
      setWorkExperience(updatedWorkExperience)
      setIsEditingWork(false)
      setEditingWorkItem(null)
      
      // Save immediately with the updated data
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            location: profile.location,
            personalSummary: profile.personalSummary,
            workExperience: updatedWorkExperience,
            education: education,
            skills: skills,
          }),
        })

        if (response.ok) {
          toast({
            title: "Work experience saved",
            description: "Your experience has been updated successfully.",
          })
        } else {
          throw new Error('Failed to save work experience')
        }
      } catch (error) {
        console.error('Save work experience error:', error)
        toast({
          title: "Save failed",
          description: "Failed to save work experience. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const handleSaveEducation = async () => {
    if (editingEducationItem) {
      let updatedEducation: Education[]
      if (editingEducationItem.id) {
        updatedEducation = education.map((item) => (item.id === editingEducationItem.id ? editingEducationItem : item))
      } else {
        updatedEducation = [...education, { ...editingEducationItem, id: Date.now() }]
      }
      
      setEducation(updatedEducation)
      setIsEditingEducation(false)
      setEditingEducationItem(null)
      
      // Save immediately with the updated data
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            location: profile.location,
            personalSummary: profile.personalSummary,
            workExperience: workExperience,
            education: updatedEducation,
            skills: skills,
          }),
        })

        if (response.ok) {
          toast({
            title: "Education saved",
            description: "Your education has been updated successfully.",
          })
        } else {
          throw new Error('Failed to save education')
        }
      } catch (error) {
        console.error('Save education error:', error)
        toast({
          title: "Save failed",
          description: "Failed to save education. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const handleDeleteWork = async (id: number) => {
    const updatedWorkExperience = workExperience.filter((item) => item.id !== id)
    setWorkExperience(updatedWorkExperience)
    
    // Save immediately with the updated data
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          personalSummary: profile.personalSummary,
          workExperience: updatedWorkExperience,
          education: education,
          skills: skills,
        }),
      })

      if (response.ok) {
        toast({
          title: "Work experience deleted",
          description: "Experience has been removed successfully.",
        })
      } else {
        throw new Error('Failed to delete work experience')
      }
    } catch (error) {
      console.error('Delete work experience error:', error)
      toast({
        title: "Delete failed",
        description: "Failed to delete work experience. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteEducation = async (id: number) => {
    const updatedEducation = education.filter((item) => item.id !== id)
    setEducation(updatedEducation)
    
    // Save immediately with the updated data
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          personalSummary: profile.personalSummary,
          workExperience: workExperience,
          education: updatedEducation,
          skills: skills,
        }),
      })

      if (response.ok) {
        toast({
          title: "Education deleted",
          description: "Education has been removed successfully.",
        })
      } else {
        throw new Error('Failed to delete education')
      }
    } catch (error) {
      console.error('Delete education error:', error)
      toast({
        title: "Delete failed",
        description: "Failed to delete education. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddSkill = async () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()]
      setSkills(updatedSkills)
      setNewSkill("")
      
      // Save immediately with the updated data
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            location: profile.location,
            personalSummary: profile.personalSummary,
            workExperience: workExperience,
            education: education,
            skills: updatedSkills,
          }),
        })

        if (response.ok) {
          toast({
            title: "Skill added",
            description: "Skill has been added successfully.",
          })
        } else {
          throw new Error('Failed to add skill')
        }
      } catch (error) {
        console.error('Add skill error:', error)
        toast({
          title: "Add failed",
          description: "Failed to add skill. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const handleRemoveSkill = async (skill: string) => {
    const updatedSkills = skills.filter((s) => s !== skill)
    setSkills(updatedSkills)
    
    // Save immediately with the updated data
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          personalSummary: profile.personalSummary,
          workExperience: workExperience,
          education: education,
          skills: updatedSkills,
        }),
      })

      if (response.ok) {
        toast({
          title: "Skill removed",
          description: "Skill has been removed successfully.",
        })
      } else {
        throw new Error('Failed to remove skill')
      }
    } catch (error) {
      console.error('Remove skill error:', error)
      toast({
        title: "Remove failed",
        description: "Failed to remove skill. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Profile
      </h1>
      <p className="text-muted-foreground">Manage your personal information and background for personalized content</p>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card className="border-blue-100 dark:border-blue-900">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b border-blue-100 dark:border-blue-800">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => handleProfileUpdate("name", e.target.value)}
                  className="border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileUpdate("email", e.target.value)}
                  className="border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleProfileUpdate("phone", e.target.value)}
                  className="border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-slate-700 dark:text-slate-300">
                  Location
                </Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => handleProfileUpdate("location", e.target.value)}
                  className="border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary" className="text-slate-700 dark:text-slate-300">
                Personal Summary
              </Label>
              <Textarea
                id="summary"
                value={profile.personalSummary}
                onChange={(e) => handleProfileUpdate("personalSummary", e.target.value)}
                placeholder="Brief summary of your background and career objectives..."
                className="min-h-[100px] border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            <div className="space-y-3 border rounded-md border-dashed border-slate-300 dark:border-slate-700 p-4 bg-slate-50/60 dark:bg-slate-900/40">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">Upload Resume (PDF/TXT/DOCX)</p>
                  <p className="text-xs text-muted-foreground">
                    We’ll extract experience, education, and skills automatically.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    className="w-60"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleParseResume}
                    disabled={parsingResume}
                  >
                    {parsingResume ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      "Parse & Fill"
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: after parsing, review the fields below and click “Save Profile”.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card className="border-purple-100 dark:border-purple-900">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-b border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-500" />
                Work Experience
              </CardTitle>
              <Dialog open={isEditingWork} onOpenChange={setIsEditingWork}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() =>
                      setEditingWorkItem({
                        id: 0,
                        company: "",
                        title: "",
                        startDate: "",
                        endDate: "",
                        description: "",
                      })
                    }
                    className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Experience
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingWorkItem?.id ? "Edit Work Experience" : "Add Work Experience"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <Label htmlFor="work-company">Company</Label>
                        <Input
                          id="work-company"
                          value={editingWorkItem?.company || ""}
                          onChange={(e) =>
                            setEditingWorkItem((prev) => (prev ? { ...prev, company: e.target.value } : null))
                          }
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-400 focus:ring-purple-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="work-title">Job Title</Label>
                        <Input
                          id="work-title"
                          value={editingWorkItem?.title || ""}
                          onChange={(e) =>
                            setEditingWorkItem((prev) => (prev ? { ...prev, title: e.target.value } : null))
                          }
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-400 focus:ring-purple-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="work-start">Start Date</Label>
                        <Input
                          id="work-start"
                          type="month"
                          value={editingWorkItem?.startDate || ""}
                          onChange={(e) =>
                            setEditingWorkItem((prev) => (prev ? { ...prev, startDate: e.target.value } : null))
                          }
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-400 focus:ring-purple-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="work-end">End Date</Label>
                        <Input
                          id="work-end"
                          type="month"
                          value={editingWorkItem?.endDate || ""}
                          onChange={(e) =>
                            setEditingWorkItem((prev) => (prev ? { ...prev, endDate: e.target.value } : null))
                          }
                          placeholder="Leave empty if current"
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-400 focus:ring-purple-400"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work-description">Description</Label>
                      <Textarea
                        id="work-description"
                        value={editingWorkItem?.description || ""}
                        onChange={(e) =>
                          setEditingWorkItem((prev) => (prev ? { ...prev, description: e.target.value } : null))
                        }
                        placeholder="Describe your responsibilities and achievements..."
                        className="min-h-[100px] border-slate-200 dark:border-slate-700 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleSaveWorkExperience}
                        className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                      >
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingWork(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {workExperience.map((work) => (
                <div key={work.id} className="border rounded-lg p-4 border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{work.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium">{work.company}</p>
                      <p className="text-xs text-muted-foreground">
                        {work.startDate} - {work.endDate || "Present"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingWorkItem(work)
                          setIsEditingWork(true)
                        }}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteWork(work.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{work.description}</p>
                </div>
              ))}
              {workExperience.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No work experience added yet</p>
                  <p className="text-xs">Add your experience to create better personalized applications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="border-orange-100 dark:border-orange-900">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-b border-orange-100 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-orange-500" />
                Education
              </CardTitle>
              <Dialog open={isEditingEducation} onOpenChange={setIsEditingEducation}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() =>
                      setEditingEducationItem({
                        id: 0,
                        institution: "",
                        degree: "",
                        field: "",
                        graduationDate: "",
                      })
                    }
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Education
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingEducationItem?.id ? "Edit Education" : "Add Education"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edu-institution">Institution</Label>
                      <Input
                        id="edu-institution"
                        value={editingEducationItem?.institution || ""}
                        onChange={(e) =>
                          setEditingEducationItem((prev) => (prev ? { ...prev, institution: e.target.value } : null))
                        }
                        className="border-slate-200 dark:border-slate-700 focus:border-orange-400 focus:ring-orange-400"
                      />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <Label htmlFor="edu-degree">Degree</Label>
                        <Input
                          id="edu-degree"
                          value={editingEducationItem?.degree || ""}
                          onChange={(e) =>
                            setEditingEducationItem((prev) => (prev ? { ...prev, degree: e.target.value } : null))
                          }
                          placeholder="e.g., Bachelor of Science"
                          className="border-slate-200 dark:border-slate-700 focus:border-orange-400 focus:ring-orange-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edu-field">Field of Study</Label>
                        <Input
                          id="edu-field"
                          value={editingEducationItem?.field || ""}
                          onChange={(e) =>
                            setEditingEducationItem((prev) => (prev ? { ...prev, field: e.target.value } : null))
                          }
                          placeholder="e.g., Computer Science"
                          className="border-slate-200 dark:border-slate-700 focus:border-orange-400 focus:ring-orange-400"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edu-graduation">Graduation Date</Label>
                      <Input
                        id="edu-graduation"
                        type="month"
                        value={editingEducationItem?.graduationDate || ""}
                        onChange={(e) =>
                          setEditingEducationItem((prev) => (prev ? { ...prev, graduationDate: e.target.value } : null))
                        }
                        className="border-slate-200 dark:border-slate-700 focus:border-orange-400 focus:ring-orange-400"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleSaveEducation}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      >
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingEducation(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="border rounded-lg p-4 border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        {edu.degree} in {edu.field}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground">Graduated: {edu.graduationDate}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingEducationItem(edu)
                          setIsEditingEducation(true)
                        }}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {education.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No education added yet</p>
                  <p className="text-xs">Add your education background for more personalized applications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="border-rose-100 dark:border-rose-900">
          <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 border-b border-rose-100 dark:border-rose-800">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-rose-500" />
              Skills & Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="cursor-pointer bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900 dark:to-indigo-900 dark:text-blue-300 hover:from-blue-200 hover:to-indigo-200 dark:hover:from-blue-800 dark:hover:to-indigo-800 px-3 py-1"
                  >
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="ml-2 hover:text-destructive">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                  className="border-slate-200 dark:border-slate-700 focus:border-rose-400 focus:ring-rose-400"
                />
                <Button
                  onClick={handleAddSkill}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {skills.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Award className="mx-auto h-6 w-6 mb-2 opacity-50" />
                  <p className="text-sm">No skills added yet</p>
                  <p className="text-xs">Add your skills to highlight relevant expertise in applications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
