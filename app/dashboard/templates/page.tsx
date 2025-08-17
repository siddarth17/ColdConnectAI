"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Search, Filter, Edit, Trash2, Plus, Eye, Mail, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Template {
  id: string
  title: string
  type: 'Email' | 'Letter'
  content: string
  preview: string
  createdAt: string
  updatedAt?: string
  lastUsed: string
}

interface EditingTemplate {
  id?: string
  title: string
  type: 'Email' | 'Letter'
  content: string
}

export default function TemplatesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editingTemplate, setEditingTemplate] = useState<EditingTemplate | null>(null)
  const [saving, setSaving] = useState<boolean>(false)

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter((template: Template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.preview.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || template.type.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesFilter
  })

  const handleUseTemplate = async (template: Template): Promise<void> => {
    try {
      // Mark template as used
      await fetch(`/api/templates/${template.id}/use`, {
        method: 'POST'
      })
      
      // Navigate to appropriate generation page with template ID
      const targetPage = template.type === 'Email' ? 'dashboard/cold-email' : 'dashboard/cover-letter'
      router.push(`${targetPage}?template=${template.id}`)
    } catch (error) {
      console.error('Error using template:', error)
      toast({
        title: "Error",
        description: "Failed to use template",
        variant: "destructive"
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      setTemplates(prev => prev.filter(t => t.id !== templateId))
      toast({
        title: "Success",
        description: "Template deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      })
    }
  }

  const handleSaveTemplate = async (templateData: EditingTemplate): Promise<void> => {
    try {
      setSaving(true)
      
      if (!templateData.title || !templateData.type || !templateData.content) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      const method = templateData.id ? 'PUT' : 'POST'
      const url = templateData.id ? `/api/templates/${templateData.id}` : '/api/templates'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: templateData.title,
          type: templateData.type,
          content: templateData.content
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      const data = await response.json()
      
      if (templateData.id) {
        // Update existing template
        setTemplates(prev => prev.map(t => t.id === templateData.id ? data.template : t))
      } else {
        // Add new template
        setTemplates(prev => [...prev, data.template])
      }

      setIsEditing(false)
      setEditingTemplate(null)
      
      toast({
        title: "Success",
        description: templateData.id ? "Template updated successfully" : "Template created successfully"
      })
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              Templates
            </h1>
            <p className="text-muted-foreground">Manage your email and cover letter templates</p>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditingTemplate({ title: "", type: "Email", content: "" })}
                className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate?.id ? "Edit Template" : "Create New Template"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-title">Title *</Label>
                  <Input
                    id="template-title"
                    value={editingTemplate?.title || ""}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Template title"
                    className="border-slate-200 dark:border-slate-700 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <Label htmlFor="template-type">Type *</Label>
                  <Select
                    value={editingTemplate?.type || "Email"}
                    onValueChange={(value: 'Email' | 'Letter') => setEditingTemplate(prev => prev ? { ...prev, type: value } : null)}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:border-purple-400 focus:ring-purple-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Letter">Cover Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template-content">Content *</Label>
                  <Textarea
                    id="template-content"
                    value={editingTemplate?.content || ""}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                    placeholder="Template content with placeholders like [Company Name], [Your Name], [Role], etc."
                    className="min-h-[300px] border-slate-200 dark:border-slate-700 focus:border-purple-400 focus:ring-purple-400"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use placeholders like [Company Name], [Your Name], [Role], [Recipient Name] for dynamic content
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => editingTemplate && handleSaveTemplate(editingTemplate)}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Template'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false)
                      setEditingTemplate(null)
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] border-slate-200 dark:border-slate-700 focus:border-green-400 focus:ring-green-400">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="letter">Cover Letter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template: Template) => (
          <Card
            key={template.id}
            className="flex flex-col border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{template.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Created: {formatDate(template.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last used: {formatDate(template.lastUsed)}
                  </p>
                </div>
                <Badge
                  variant={template.type === "Email" ? "default" : "secondary"}
                  className={
                    template.type === "Email"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  }
                >
                  {template.type === "Email" ? (
                    <Mail className="mr-1 h-3 w-3" />
                  ) : (
                    <FileText className="mr-1 h-3 w-3" />
                  )}
                  {template.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{template.preview}</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  Use Template
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTemplate(template)}
                      className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{selectedTemplate?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={selectedTemplate?.type === "Email" ? "default" : "secondary"}
                          className={
                            selectedTemplate?.type === "Email"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          }
                        >
                          {selectedTemplate?.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Created: {selectedTemplate && formatDate(selectedTemplate.createdAt)}
                        </span>
                      </div>
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{selectedTemplate?.content}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => selectedTemplate && handleUseTemplate(selectedTemplate)}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                        >
                          Use This Template
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (selectedTemplate) {
                              setEditingTemplate({
                                id: selectedTemplate.id,
                                title: selectedTemplate.title,
                                type: selectedTemplate.type,
                                content: selectedTemplate.content
                              })
                              setIsEditing(true)
                            }
                          }}
                          className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingTemplate({
                      id: template.id,
                      title: template.title,
                      type: template.type,
                      content: template.content
                    })
                    setIsEditing(true)
                  }}
                  className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Create your first template to get started."}
          </p>
          <Button
            onClick={() => {
              setEditingTemplate({ title: "", type: "Email", content: "" })
              setIsEditing(true)
            }}
            className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      )}
    </div>
  )
}