"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Copy, Edit, Save, RefreshCw, CalendarPlus, Sparkles, UserPlus, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

interface Template {
  id: string
  title: string
  type: 'Email' | 'Letter'
  content: string
  preview: string
  createdAt: string
  lastUsed: string
}

interface FormData {
  role: string
  companyName: string
  companyWebsite: string
  recipientName: string
  recipientTitle: string
  purpose: string
  tone: string
  template: string
  additionalNotes: string
  priorityExperienceIds: string[]
}

interface WorkExperience {
  id: number
  company: string
  title: string
  startDate: string
  endDate?: string
  description: string
}

export default function ColdEmailPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')
  const historyId = searchParams.get('history')
  
  const [formData, setFormData] = useState<FormData>({
    role: "",
    companyName: "",
    companyWebsite: "",
    recipientName: "",
    recipientTitle: "",
    purpose: "",
    tone: "",
    template: "",
    additionalNotes: "",
    priorityExperienceIds: [],
  })
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([])
  const [generatedEmail, setGeneratedEmail] = useState<string>("")
  const [editingEmail, setEditingEmail] = useState<string>("") // For edit mode
  const [isEditing, setIsEditing] = useState<boolean>(false) // Edit mode state
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [reminderDate, setReminderDate] = useState<Date | undefined>(new Date())
  const [reminderNote, setReminderNote] = useState<string>("")
  const [saving, setSaving] = useState<boolean>(false)
  const [savingContact, setSavingContact] = useState<boolean>(false)
  const [addingReminder, setAddingReminder] = useState<boolean>(false)
  const [savedHistoryId, setSavedHistoryId] = useState<string | null>(null) // Track if already saved
  const [isSaved, setIsSaved] = useState<boolean>(false) // Track save status

  // Load templates on component mount
  useEffect(() => {
    fetchTemplates()
    fetchProfileExperiences()
  }, [])

  // Auto-select template if templateId is provided in URL
  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find((t: Template) => t.id === templateId)
      if (template) {
        setSelectedTemplate(template)
        setFormData(prev => ({ ...prev, template: templateId }))
      }
    }
  }, [templateId, templates])

  // Load history item if historyId is provided in URL
  useEffect(() => {
    if (historyId) {
      loadHistoryItem(historyId)
    }
  }, [historyId])

  // Load URL parameters for follow-up (from dashboard contacts)
  useEffect(() => {
    const recipientName = searchParams.get('recipientName')
    const companyName = searchParams.get('companyName')
    const recipientTitle = searchParams.get('recipientTitle')
    
    if (recipientName || companyName || recipientTitle) {
      setFormData(prev => ({
        ...prev,
        recipientName: recipientName || prev.recipientName,
        companyName: companyName || prev.companyName,
        recipientTitle: recipientTitle || prev.recipientTitle,
      }))
    }
  }, [searchParams])

  const loadHistoryItem = async (id: string): Promise<void> => {
    try {
      const response = await fetch('/api/history')
      if (response.ok) {
        const data = await response.json()
        const historyItem = data.history.find((h: any) => h.id === id)
        
        if (historyItem) {
          // Restore form data
          if (historyItem.formData) {
            const restored = historyItem.formData
            setFormData({
              ...restored,
              priorityExperienceIds: Array.isArray(restored.priorityExperienceIds)
                ? restored.priorityExperienceIds
                : restored.priorityExperienceId
                  ? [String(restored.priorityExperienceId)]
                  : [],
            })
          }
          
          // Restore generated content
          setGeneratedEmail(historyItem.content)
          
          // Mark as already saved
          setSavedHistoryId(id)
          setIsSaved(true)
          
          toast({
            title: "History loaded",
            description: "Previous email has been restored.",
          })
        }
      }
    } catch (error) {
      console.error('Error loading history:', error)
      toast({
        title: "Error",
        description: "Failed to load saved email.",
        variant: "destructive"
      })
    }
  }

  const fetchTemplates = async (): Promise<void> => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        const emailTemplates = data.templates.filter((t: Template) => t.type === 'Email')
        setTemplates(emailTemplates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchProfileExperiences = async (): Promise<void> => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setWorkExperience(data.profile.workExperience || [])
      }
    } catch (error) {
      console.error('Error fetching profile experiences:', error)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTemplateSelect = async (templateId: string): Promise<void> => {
    if (!templateId || templateId === "") {
      setSelectedTemplate(null)
      setFormData(prev => ({ ...prev, template: "" }))
      return
    }

    const template = templates.find((t: Template) => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setFormData(prev => ({ ...prev, template: templateId }))
      // Mark template as used
      try {
        await fetch(`/api/templates/${templateId}/use`, { method: 'POST' })
      } catch (error) {
        console.error('Error marking template as used:', error)
      }
    }
  }

  const generateEmail = async (): Promise<void> => {
    // Validate required fields
    if (!formData.role || !formData.companyName) {
      toast({
        title: "Missing information",
        description: "Please fill in role and company name.",
        variant: "destructive"
      });
      return;
    }
  
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: formData.role,
          companyName: formData.companyName,
          companyWebsite: formData.companyWebsite,
          recipientName: formData.recipientName,
          recipientTitle: formData.recipientTitle,
          purpose: formData.purpose,
          tone: formData.tone,
          template: selectedTemplate?.content || undefined,
          additionalNotes: formData.additionalNotes || undefined,
          requiredExperienceIds: formData.priorityExperienceIds?.length ? formData.priorityExperienceIds : [],
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate email');
      }
  
      setGeneratedEmail(data.email);
      setIsEditing(false); // Exit edit mode when generating new content
      
      // Reset save status when generating new content
      setIsSaved(false)
      setSavedHistoryId(null)
      
      toast({
        title: "Email generated successfully!",
        description: selectedTemplate 
          ? `Using template: ${selectedTemplate.title}` 
          : `Personalized email for ${formData.role} at ${formData.companyName}`,
      });
  
    } catch (error) {
      console.error('Generation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Please try again.";
      
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startEditing = (): void => {
    setEditingEmail(generatedEmail)
    setIsEditing(true)
  }

  const saveEdit = async (): Promise<void> => {
    setGeneratedEmail(editingEmail) // or setGeneratedLetter(editingLetter) for cover letter page
    setIsEditing(false)
    
    // If this was already saved, update the existing record
    if (savedHistoryId) {
      try {
        const response = await fetch(`/api/history/${savedHistoryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `${formData.role} at ${formData.companyName}`,
            company: formData.companyName,
            type: 'Email', // or 'Letter' for cover letter page
            content: editingEmail, // or editingLetter
            formData: formData
          }),
        });
  
        if (response.ok) {
          if (formData.recipientName && formData.companyName) {
            await updateContactMessage(editingEmail); 
          }
          
          toast({
            title: "Email updated",
            description: "Your changes have been saved and contact updated.",
          })
        } else {
          throw new Error('Failed to update email')
        }
      } catch (error) {
        console.error('Update error:', error)
        toast({
          title: "Update failed",
          description: "Changes saved locally but failed to update database.",
          variant: "destructive"
        })
      }
    } else {
      toast({
        title: "Email updated",
        description: "Your changes have been saved. Click 'Save' to save to history.",
      })
    }
  }

  const updateContactMessage = async (newMessage: string): Promise<void> => {
    try {
      const contactsResponse = await fetch('/api/contacts');
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        
        // Add null safety checks
        const contact = contactsData.contacts.find((c: any) => {
          // Check if contact and required fields exist
          if (!c || !c.name || !c.company || !formData.recipientName || !formData.companyName) {
            return false;
          }
          
          return (
            c.name.toLowerCase().trim() === formData.recipientName.toLowerCase().trim() &&
            c.company.toLowerCase().trim() === formData.companyName.toLowerCase().trim()
          );
        });
        
        if (contact) {
          await fetch(`/api/contacts/${contact.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalMessage: newMessage,
              lastContacted: new Date().toISOString()
            }),
          });
        }
      }
    } catch (error) {
      console.error('Error updating contact message:', error);
    }
  };

  const cancelEdit = (): void => {
    setEditingEmail("")
    setIsEditing(false)
  }

  const saveEmail = async (): Promise<void> => {
    if (!generatedEmail || !formData.role || !formData.companyName) {
      toast({
        title: "Nothing to save",
        description: "Please generate an email first.",
        variant: "destructive"
      });
      return;
    }

    // If already saved, don't save again
    if (isSaved) {
      toast({
        title: "Already saved",
        description: "This email is already saved to your history.",
      });
      return;
    }

    setSaving(true);
    
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${formData.role} at ${formData.companyName}`,
          company: formData.companyName,
          type: 'Email',
          content: generatedEmail, // This will save the current version (edited or original)
          formData: formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save email');
      }

      const data = await response.json()
      
      // Mark as saved
      setIsSaved(true)
      setSavedHistoryId(data.historyItem.id)

      toast({
        title: "Email saved successfully!",
        description: "You can find it in your recent activity on the dashboard.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveContact = async (): Promise<void> => {
    // Validate and trim inputs
    const name = formData.recipientName?.trim();
    const company = formData.companyName?.trim();
    const position = formData.recipientTitle?.trim();
  
    if (!name || !company || !position) {
      toast({
        title: "Missing contact information",
        description: "Please fill in recipient name, company, and title.",
        variant: "destructive"
      });
      return;
    }
  
    if (!generatedEmail) {
      toast({
        title: "No message to associate",
        description: "Please generate an email first before saving contact.",
        variant: "destructive"
      });
      return;
    }
  
    setSavingContact(true);
    
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name, // Use trimmed version
          company, // Use trimmed version
          position, // Use trimmed version
          originalMessage: generatedEmail,
          lastMessageType: 'email',
          status: 'contacted'
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        if (data.updated) {
          toast({
            title: "Contact updated",
            description: "Existing contact has been updated with new message.",
          });
          return;
        } else {
          throw new Error(data.error || 'Failed to save contact');
        }
      }
  
      toast({
        title: data.updated ? "Contact updated!" : "Contact saved successfully!",
        description: data.updated 
          ? "The contact has been updated with the new message."
          : "You can manage this contact in your Network page.",
      });
    } catch (error) {
      console.error('Save contact error:', error);
      toast({
        title: "Save contact failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingContact(false);
    }
  };

  const addReminder = async (): Promise<void> => {
    if (!reminderDate) {
      toast({
        title: "Missing date",
        description: "Please select a date for the reminder.",
        variant: "destructive"
      });
      return;
    }

    setAddingReminder(true);
    
    try {
      const reminderText = reminderNote || `Follow up: ${formData.role} at ${formData.companyName}`;
      
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: reminderText,
          date: reminderDate.toISOString(),
          color: 'bg-blue-500'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reminder');
      }

      toast({
        title: "Reminder added successfully!",
        description: "You can see it on your dashboard calendar.",
      });

      setReminderNote("");
    } catch (error) {
      console.error('Add reminder error:', error);
      toast({
        title: "Add reminder failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setAddingReminder(false);
    }
  };

  const copyToClipboard = (): void => {
    navigator.clipboard.writeText(generatedEmail)
    toast({
      title: "Copied to clipboard",
      description: "Email has been copied to your clipboard.",
    })
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Cold Email Generator
        </h1>
        <p className="text-muted-foreground">Create personalized cold emails for job opportunities</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Input Form */}
        <Card className="border-blue-100 dark:border-blue-900">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b border-blue-100 dark:border-blue-800">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Email Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div>
              <Label htmlFor="role" className="text-slate-700 dark:text-slate-300">
                Your Role
              </Label>
              <Input
                id="role"
                placeholder="e.g., Software Engineer, Product Manager"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            <div>
              <Label htmlFor="company" className="text-slate-700 dark:text-slate-300">
                Company Name
              </Label>
              <Input
                id="company"
                placeholder="e.g., TechCorp, StartupXYZ"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            <div>
              <Label htmlFor="website" className="text-slate-700 dark:text-slate-300">
                Company Website (Optional)
              </Label>
              <Input
                id="website"
                placeholder="https://company.com"
                value={formData.companyWebsite}
                onChange={(e) => handleInputChange("companyWebsite", e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            <div>
              <Label htmlFor="recipient" className="text-slate-700 dark:text-slate-300">
                Recipient Name
              </Label>
              <Input
                id="recipient"
                placeholder="e.g., Sarah Johnson"
                value={formData.recipientName}
                onChange={(e) => handleInputChange("recipientName", e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            <div>
              <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">
                Recipient Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Engineering Manager, HR Director"
                value={formData.recipientTitle}
                onChange={(e) => handleInputChange("recipientTitle", e.target.value)}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            <div>
              <Label htmlFor="purpose" className="text-slate-700 dark:text-slate-300">
                Email Purpose
              </Label>
              <Select value={formData.purpose} onValueChange={(value: string) => handleInputChange("purpose", value)}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intro">Introduction</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="coffee">Coffee Chat</SelectItem>
                  <SelectItem value="followup">Follow-Up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tone" className="text-slate-700 dark:text-slate-300">
                Tone
              </Label>
              <Select value={formData.tone} onValueChange={(value: string) => handleInputChange("tone", value)}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:border-green-400 focus:ring-green-400">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template" className="text-slate-700 dark:text-slate-300">
                Template (Optional)
              </Label>
              <Select value={formData.template} onValueChange={(value: string) => {
                handleInputChange("template", value)
                handleTemplateSelect(value)
              }}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:border-purple-400 focus:ring-purple-400">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template: Template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Using template: {selectedTemplate.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Must-Use Experiences (Optional)
              </Label>
              {workExperience.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add work experiences in your Profile to select them here.
                </p>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between border-slate-200 dark:border-slate-700"
                    >
                      {formData.priorityExperienceIds.length
                        ? `${formData.priorityExperienceIds.length} selected`
                        : "Select experiences to force-include"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80">
                    <DropdownMenuLabel>Select experiences</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {workExperience.map((exp) => {
                      const id = String(exp.id)
                      const checked = formData.priorityExperienceIds.includes(id)
                      return (
                        <DropdownMenuCheckboxItem
                          key={id}
                          checked={checked}
                          onCheckedChange={() => {
                            setFormData((prev) => {
                              const current = prev.priorityExperienceIds || []
                              return checked
                                ? { ...prev, priorityExperienceIds: current.filter((v) => v !== id) }
                                : { ...prev, priorityExperienceIds: [...current, id] }
                            })
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{exp.title}</span>
                            <span className="text-xs text-muted-foreground">{exp.company}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div>
              <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300">
                Additional Notes for AI (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Any specifics, links, or talking points to include..."
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                className="min-h-[100px] border-slate-200 dark:border-slate-700 focus:border-emerald-400 focus:ring-emerald-400"
              />
            </div>

            <Button
              onClick={generateEmail}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              disabled={isGenerating || !formData.role || !formData.companyName}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {selectedTemplate ? "Apply Template" : "Generate Email"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Generated Output */}
        <Card className="border-green-100 dark:border-green-900">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b border-green-100 dark:border-green-800">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              Generated Email
              {isEditing && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full ml-2">
                  Editing
                </span>
              )}
              {isSaved && !isEditing && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                  Saved
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {generatedEmail ? (
              <div className="space-y-4">
                {isEditing ? (
                  // Edit mode - show textarea
                  <div className="space-y-3">
                    <Textarea
                      value={editingEmail}
                      onChange={(e) => setEditingEmail(e.target.value)}
                      className="min-h-[400px] text-sm leading-relaxed border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                      placeholder="Edit your email content..."
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={saveEdit}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Confirm Changes
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        size="sm"
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode - show formatted content
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{generatedEmail}</div>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 bg-transparent"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      onClick={startEditing}
                      variant="outline"
                      className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950 bg-transparent"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={saveEmail}
                      disabled={saving || isSaved}
                      variant="outline"
                      className={`${isSaved 
                        ? 'border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-950/20' 
                        : 'border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950'
                      } bg-transparent`}
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : isSaved ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                    {formData.recipientName && formData.recipientTitle && (
                      <Button
                        onClick={saveContact}
                        disabled={savingContact}
                        variant="outline"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950 bg-transparent"
                      >
                        {savingContact ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Save Contact
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={generateEmail}
                      variant="outline"
                      className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950 bg-transparent"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950 bg-transparent"
                        >
                          <CalendarPlus className="mr-2 h-4 w-4" />
                          Add to Calendar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Calendar Reminder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reminder-date">Date</Label>
                            <div className="flex justify-center">
                              <Calendar
                                mode="single"
                                selected={reminderDate}
                                onSelect={setReminderDate}
                                className="rounded-md border w-fit"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="note">Note (Optional)</Label>
                            <Textarea
                              id="note"
                              placeholder={`Follow up: ${formData.role} at ${formData.companyName}`}
                              value={reminderNote}
                              onChange={(e) => setReminderNote(e.target.value)}
                              className="resize-none border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-indigo-400"
                            />
                          </div>
                          <Button 
                            onClick={addReminder} 
                            disabled={addingReminder}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                          >
                            {addingReminder ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              'Add Reminder'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Sparkles className="mx-auto h-12 w-12 mb-4 opacity-50 text-green-400" />
                  <p>
                    {selectedTemplate 
                      ? "Fill out the form and click 'Apply Template' to personalize your email." 
                      : "Fill out the form and click 'Generate Email' to see your personalized cold email here."
                    }
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
