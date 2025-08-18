"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search, Filter, Eye, MessageSquare, Users, Mail, 
  RefreshCw, Copy, Edit, Trash2, Calendar, ExternalLink,
  Plus, Send, Linkedin, MessageCircle, Clock, CheckCircle, User
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Contact {
  id: string
  name: string
  company: string
  position: string
  email?: string
  linkedinUrl?: string
  status: 'contacted' | 'responded' | 'no_response' | 'follow_up_sent' | 'connected'
  lastMessageSent?: string
  lastMessageType?: 'email' | 'cover_letter'
  originalMessage?: string
  createdAt: string
  lastContacted: string
  responseReceived?: boolean
  followUpCount: number
  notes?: string
}

export default function NetworkPage() {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [companyFilter, setCompanyFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'followup' | 'linkedin'>('followup')
  const [generatedContent, setGeneratedContent] = useState("")
  const [showContactModal, setShowContactModal] = useState(false)

  // Follow-up form state
  const [followUpForm, setFollowUpForm] = useState({
    purpose: "",
    tone: "professional",
    additionalContext: ""
  })

  // LinkedIn form state
  const [linkedInForm, setLinkedInForm] = useState({
    connectionReason: "",
    tone: "friendly",
    additionalContext: ""
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    filterContacts()
  }, [contacts, searchTerm, statusFilter, companyFilter])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filterContacts = () => {
    let filtered = contacts

    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(contact => contact.status === statusFilter)
    }

    if (companyFilter !== "all") {
      filtered = filtered.filter(contact => contact.company === companyFilter)
    }

    setFilteredContacts(filtered)
  }

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact)
    setGeneratedContent("")
    
    // Pre-fill forms with contact data
    setFollowUpForm({
      purpose: contact.status === 'no_response' ? "follow_up_no_response" : "general_follow_up",
      tone: "professional",
      additionalContext: ""
    })

    setLinkedInForm({
      connectionReason: "professional_interest",
      tone: "friendly",
      additionalContext: ""
    })
  }

  const generateFollowUp = async () => {
    if (!selectedContact || !selectedContact.originalMessage) {
      toast({
        title: "No original message",
        description: "Cannot generate follow-up without original message context",
        variant: "destructive"
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/generate-followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'followup',
          contactId: selectedContact.id,
          originalMessage: selectedContact.originalMessage,
          contactName: selectedContact.name,
          company: selectedContact.company,
          position: selectedContact.position,
          lastMessageType: selectedContact.lastMessageType,
          followUpCount: selectedContact.followUpCount,
          purpose: followUpForm.purpose,
          tone: followUpForm.tone,
          additionalContext: followUpForm.additionalContext
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setGeneratedContent(data.content)
      } else {
        throw new Error(data.error || 'Failed to generate follow-up')
      }
    } catch (error) {
      console.error('Error generating follow-up:', error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const generateLinkedInMessage = async () => {
    if (!selectedContact) {
      toast({
        title: "No contact selected",
        description: "Please select a contact first",
        variant: "destructive"
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/generate-followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'linkedin',
          contactName: selectedContact.name,
          company: selectedContact.company,
          position: selectedContact.position,
          connectionReason: linkedInForm.connectionReason,
          tone: linkedInForm.tone,
          additionalContext: linkedInForm.additionalContext,
          originalMessage: selectedContact.originalMessage
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setGeneratedContent(data.content)
      } else {
        throw new Error(data.error || 'Failed to generate LinkedIn message')
      }
    } catch (error) {
      console.error('Error generating LinkedIn message:', error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const updateContactStatus = async (contactId: string, status: Contact['status'], notes?: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          notes,
          lastContacted: new Date().toISOString()
        }),
      })

      if (response.ok) {
        const updatedContact = await response.json()
        setContacts(prev => prev.map(c => 
          c.id === contactId ? updatedContact.contact : c
        ))
        toast({
          title: "Status updated",
          description: "Contact status has been updated successfully",
        })
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      toast({
        title: "Update failed",
        description: "Failed to update contact status",
        variant: "destructive"
      })
    }
  }

  const markAsSent = async () => {
    if (!selectedContact) return

    try {
      const response = await fetch(`/api/contacts/${selectedContact.id}/follow-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followUpMessage: generatedContent,
          type: activeTab
        }),
      })

      if (response.ok) {
        const updatedContact = await response.json()
        setContacts(prev => prev.map(c => 
          c.id === selectedContact.id ? updatedContact.contact : c
        ))
        setGeneratedContent("")
        
        const statusUpdate = activeTab === 'followup' ? 'follow_up_sent' : 'connected'
        await updateContactStatus(selectedContact.id, statusUpdate)
        
        toast({
          title: `${activeTab === 'followup' ? 'Follow-up' : 'LinkedIn message'} marked as sent`,
          description: "Contact has been updated",
        })
      }
    } catch (error) {
      console.error('Error marking as sent:', error)
      toast({
        title: "Update failed",
        description: "Failed to mark as sent",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${type} has been copied to your clipboard`,
    })
  }

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'contacted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'responded': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'no_response': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'follow_up_sent': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'connected': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: Contact['status']) => {
    switch (status) {
      case 'contacted': return <Mail className="h-3 w-3" />
      case 'responded': return <CheckCircle className="h-3 w-3" />
      case 'no_response': return <Clock className="h-3 w-3" />
      case 'follow_up_sent': return <RefreshCw className="h-3 w-3" />
      case 'connected': return <Users className="h-3 w-3" />
      default: return <MessageCircle className="h-3 w-3" />
    }
  }

  const uniqueCompanies = [...new Set(contacts.map(c => c.company))].filter(Boolean)

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your network...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Network Management
        </h1>
        <p className="text-muted-foreground">Manage your professional contacts and follow-up communications</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Contacts Table */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Your Network ({filteredContacts.length})
                </CardTitle>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="no_response">No Response</SelectItem>
                      <SelectItem value="follow_up_sent">Follow-up Sent</SelectItem>
                      <SelectItem value="connected">Connected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {uniqueCompanies.map(company => (
                        <SelectItem key={company} value={company}>{company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 p-4">
                  {filteredContacts.length > 0 ? filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                        selectedContact?.id === contact.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : ''
                      }`}
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{contact.name}</h3>
                              <p className="text-xs text-muted-foreground">{contact.position}</p>
                              <p className="text-xs text-muted-foreground font-medium">{contact.company}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-xs ${getStatusColor(contact.status)}`}>
                              {getStatusIcon(contact.status)}
                              <span className="ml-1 capitalize">{contact.status.replace('_', ' ')}</span>
                            </Badge>
                            {contact.followUpCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {contact.followUpCount} follow-up{contact.followUpCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Last contacted: {new Date(contact.lastContacted).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          {contact.originalMessage && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedContact(contact)
                                setShowContactModal(true)
                              }}
                              className="h-7 w-7 p-0 bg-transparent"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}

                          <Select
                            value={contact.status}
                            onValueChange={(value) => updateContactStatus(contact.id, value as Contact['status'])}
                          >
                            <SelectTrigger className="w-[100px] h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="responded">Responded</SelectItem>
                              <SelectItem value="no_response">No Response</SelectItem>
                              <SelectItem value="follow_up_sent">Follow-up Sent</SelectItem>
                              <SelectItem value="connected">Connected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || statusFilter !== "all" || companyFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Start building your network by generating emails and saving contacts"}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: Action Forms and Generated Content */}
        <div className="lg:col-span-7">
          {selectedContact ? (
            <div className="space-y-6">
              {/* Contact Info Header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{selectedContact.name}</h2>
                      <p className="text-muted-foreground">{selectedContact.position} at {selectedContact.company}</p>
                      <Badge className={`text-xs mt-1 ${getStatusColor(selectedContact.status)}`}>
                        {getStatusIcon(selectedContact.status)}
                        <span className="ml-1 capitalize">{selectedContact.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Communication</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'followup' | 'linkedin')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="followup">Follow-up Email</TabsTrigger>
                      <TabsTrigger value="linkedin">LinkedIn Message</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="followup" className="space-y-4 mt-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Purpose</Label>
                          <Select 
                            value={followUpForm.purpose} 
                            onValueChange={(value) => setFollowUpForm(prev => ({ ...prev, purpose: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="follow_up_no_response">Follow up - No Response</SelectItem>
                              <SelectItem value="check_in">General Check-in</SelectItem>
                              <SelectItem value="new_opportunity">New Opportunity</SelectItem>
                              <SelectItem value="thank_you">Thank You</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Tone</Label>
                          <Select 
                            value={followUpForm.tone} 
                            onValueChange={(value) => setFollowUpForm(prev => ({ ...prev, tone: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="friendly">Friendly</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="formal">Formal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Additional Context (Optional)</Label>
                          <Textarea
                            placeholder="Any specific points you want to mention..."
                            value={followUpForm.additionalContext}
                            onChange={(e) => setFollowUpForm(prev => ({ ...prev, additionalContext: e.target.value }))}
                            className="resize-none"
                            rows={3}
                          />
                        </div>

                        <Button
                          onClick={generateFollowUp}
                          disabled={generating || !selectedContact.originalMessage}
                          className="w-full"
                        >
                          {generating ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Generate Follow-up Email
                            </>
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="linkedin" className="space-y-4 mt-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Connection Reason</Label>
                          <Select 
                            value={linkedInForm.connectionReason} 
                            onValueChange={(value) => setLinkedInForm(prev => ({ ...prev, connectionReason: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional_interest">Professional Interest</SelectItem>
                              <SelectItem value="mutual_connections">Mutual Connections</SelectItem>
                              <SelectItem value="company_admiration">Company Admiration</SelectItem>
                              <SelectItem value="industry_networking">Industry Networking</SelectItem>
                              <SelectItem value="career_advice">Career Advice</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Tone</Label>
                          <Select 
                            value={linkedInForm.tone} 
                            onValueChange={(value) => setLinkedInForm(prev => ({ ...prev, tone: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="friendly">Friendly</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="respectful">Respectful</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Additional Context (Optional)</Label>
                          <Textarea
                            placeholder="Specific interests or mutual connections..."
                            value={linkedInForm.additionalContext}
                            onChange={(e) => setLinkedInForm(prev => ({ ...prev, additionalContext: e.target.value }))}
                            className="resize-none"
                            rows={3}
                          />
                        </div>

                        <Button
                          onClick={generateLinkedInMessage}
                          disabled={generating}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {generating ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Linkedin className="mr-2 h-4 w-4" />
                              Generate LinkedIn Message
                            </>
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Generated Content */}
              {generatedContent && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Generated {activeTab === 'followup' ? 'Follow-up Email' : 'LinkedIn Message'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="whitespace-pre-wrap text-sm">{generatedContent}</div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedContent, activeTab === 'followup' ? 'Follow-up email' : 'LinkedIn message')}
                        className="bg-transparent"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={markAsSent}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Mark as Sent
                      </Button>
                      
                      {activeTab === 'linkedin' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          asChild
                        >
                          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                            <Linkedin className="mr-2 h-4 w-4" />
                            Open LinkedIn
                          </a>
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setGeneratedContent("")
                          if (activeTab === 'followup') {
                            generateFollowUp()
                          } else {
                            generateLinkedInMessage()
                          }
                        }}
                        disabled={generating}
                        className="bg-transparent"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <Users className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Select a Contact</h3>
                  <p className="text-muted-foreground">
                    Click on a contact from the left to generate follow-ups and LinkedIn messages
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Contact Details Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedContact ? `${selectedContact.name} - Contact Details` : 'Contact Details'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <div className="text-sm">{selectedContact.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <div className="text-sm">{selectedContact.company}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Position</Label>
                  <div className="text-sm">{selectedContact.position}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={`text-xs ${getStatusColor(selectedContact.status)}`}>
                    {getStatusIcon(selectedContact.status)}
                    <span className="ml-1 capitalize">{selectedContact.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </div>

              {selectedContact.originalMessage && (
                <div>
                  <Label className="text-sm font-medium">Original Message Sent</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-muted/50 max-h-40 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-sm">{selectedContact.originalMessage}</div>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea
                  placeholder="Add notes about this contact..."
                  value={selectedContact.notes || ''}
                  onChange={(e) => setSelectedContact(prev => 
                    prev ? { ...prev, notes: e.target.value } : null
                  )}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (selectedContact) {
                      updateContactStatus(selectedContact.id, selectedContact.status, selectedContact.notes)
                      setShowContactModal(false)
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Notes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowContactModal(false)}
                  className="bg-transparent"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}