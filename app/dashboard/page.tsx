
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarDays, Mail, FileText, User, Plus, Eye, ArrowRight, Trash2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  title: string
  type: 'Email' | 'Letter'
  content: string
  preview: string
  createdAt: string
  lastUsed: string
}

interface HistoryItem {
  id: string
  title: string
  company: string
  type: 'Email' | 'Letter'
  content: string
  date: string
  formData?: any
}

interface Person {
  id: string
  name: string
  company: string
  position: string
  createdAt: string
  lastContacted: string
}

interface CalendarReminder {
  id: string
  text: string
  date: string
  color: string
  createdAt: string
}

interface Stats {
  emails: number
  letters: number
  templates: number
  contacts: number
}

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [calendarNote, setCalendarNote] = useState<string>("")
  const [reminderDate, setReminderDate] = useState<Date | undefined>(new Date())
  const [templates, setTemplates] = useState<Template[]>([])
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [peopleHistory, setPeopleHistory] = useState<Person[]>([])
  const [calendarReminders, setCalendarReminders] = useState<CalendarReminder[]>([])
  const [stats, setStats] = useState<Stats>({
    emails: 0,
    letters: 0,
    templates: 0,
    contacts: 0
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [addingReminder, setAddingReminder] = useState<boolean>(false)
  const [selectedDateReminders, setSelectedDateReminders] = useState<CalendarReminder[]>([])
  const [showRemindersModal, setShowRemindersModal] = useState<boolean>(false)
  const [selectedReminder, setSelectedReminder] = useState<CalendarReminder | null>(null)
  const [showReminderDetailModal, setShowReminderDetailModal] = useState<boolean>(false)

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (): Promise<void> => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [templatesRes, historyRes, contactsRes, remindersRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/history'),
        fetch('/api/contacts'),
        fetch('/api/reminders')
      ])

      const [templatesData, historyData, contactsData, remindersData] = await Promise.all([
        templatesRes.ok ? templatesRes.json() : { templates: [] },
        historyRes.ok ? historyRes.json() : { history: [] },
        contactsRes.ok ? contactsRes.json() : { contacts: [] },
        remindersRes.ok ? remindersRes.json() : { reminders: [] }
      ])

      setTemplates(templatesData.templates || [])
      setHistoryItems(historyData.history || [])
      setPeopleHistory(contactsData.contacts || [])
      setCalendarReminders(remindersData.reminders || [])

      // Calculate stats
      const emailHistory = historyData.history?.filter((h: HistoryItem) => h.type === 'Email') || []
      const letterHistory = historyData.history?.filter((h: HistoryItem) => h.type === 'Letter') || []
      
      setStats({
        emails: emailHistory.length,
        letters: letterHistory.length,
        templates: templatesData.templates?.length || 0,
        contacts: contactsData.contacts?.length || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = (template: Template): void => {
    const targetPage = template.type === 'Email' ? 'dashboard/cold-email' : 'dashboard/cover-letter'
    router.push(`${targetPage}?template=${template.id}`)
  }

  const handleHistoryClick = (item: HistoryItem): void => {
    const targetPage = item.type === 'Email' ? 'dashboard/cold-email' : 'dashboard/cover-letter'
    // Pass the history ID so the page can restore the content
    router.push(`${targetPage}?history=${item.id}`)
  }

  const handleFollowUp = (person: Person): void => {
    // Pre-fill cold email page with contact info
    const params = new URLSearchParams({
      recipientName: person.name,
      companyName: person.company,
      recipientTitle: person.position
    })
    router.push(`dashboard/cold-email?${params.toString()}`)
  }

  const deleteHistoryItem = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete history item')
      }

      setHistoryItems(prev => prev.filter(item => item.id !== id))
      setStats(prev => ({
        ...prev,
        emails: historyItems.filter(h => h.type === 'Email' && h.id !== id).length,
        letters: historyItems.filter(h => h.type === 'Letter' && h.id !== id).length
      }))

      toast({
        title: "Deleted successfully",
        description: "History item has been removed.",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete failed",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const deleteContact = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete contact')
      }

      setPeopleHistory(prev => prev.filter(person => person.id !== id))
      setStats(prev => ({
        ...prev,
        contacts: prev.contacts - 1
      }))

      toast({
        title: "Contact deleted",
        description: "Contact has been removed from your list.",
      })
    } catch (error) {
      console.error('Delete contact error:', error)
      toast({
        title: "Delete failed",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const addReminder = async (): Promise<void> => {
    if (!reminderDate || !calendarNote.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a date and enter a note.",
        variant: "destructive"
      })
      return
    }

    setAddingReminder(true)
    
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: calendarNote.trim(),
          date: reminderDate.toISOString(),
          color: 'bg-blue-500'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add reminder')
      }

      const data = await response.json()
      setCalendarReminders(prev => [...prev, data.reminder])
      setCalendarNote("")

      toast({
        title: "Reminder added!",
        description: "Your reminder has been saved.",
      })
    } catch (error) {
      console.error('Add reminder error:', error)
      toast({
        title: "Failed to add reminder",
        description: "Please try again.",
        variant: "destructive"
      })
    } finally {
      setAddingReminder(false)
    }
  }

  const handleCalendarDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (!date) {
      setSelectedDateReminders([])
      setShowRemindersModal(false)
      return
    }
    // Filter reminders for the selected date (ignoring time)
    const filtered = calendarReminders.filter(reminder => {
      const reminderDate = new Date(reminder.date)
      return (
        reminderDate.getFullYear() === date.getFullYear() &&
        reminderDate.getMonth() === date.getMonth() &&
        reminderDate.getDate() === date.getDate()
      )
    })
    setSelectedDateReminders(filtered)
    setShowRemindersModal(filtered.length > 0)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatReminderDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild className="w-full sm:w-auto">
            <Link href="dashboard/cold-email">
              <Mail className="mr-2 h-4 w-4" />
              New Email
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto bg-transparent">
            <Link href="dashboard/cover-letter">
              <FileText className="mr-2 h-4 w-4" />
              New Letter
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Hero Stats Section */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Total Emails</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.emails}</p>
                </div>
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Cover Letters</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">{stats.letters}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Templates</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.templates}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">Contacts</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.contacts}</p>
                </div>
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
          {/* Calendar Widget */}
          <Card className="lg:col-span-4 h-fit">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b border-blue-100 dark:border-blue-800">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                Calendar & Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleCalendarDateSelect}
                  className="rounded-md border w-fit"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Upcoming Reminders</h4>
                <ScrollArea className="h-24 sm:h-32">
                  <div className="space-y-2">
                    {calendarReminders.slice(0, 5).map((reminder: CalendarReminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded cursor-pointer"
                        style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
                        onClick={() => {
                          setSelectedReminder(reminder)
                          setShowReminderDetailModal(true)
                        }}
                      >
                        <div className={`w-2 h-2 ${reminder.color} rounded-full flex-shrink-0`}></div>
                        <span
                          className="text-xs"
                          style={{ overflowX: 'auto', whiteSpace: 'nowrap', minWidth: 0, display: 'block', maxWidth: 'calc(100vw - 120px)' }}
                        >
                          {reminder.text}
                        </span>
                        <span className="text-muted-foreground text-xs flex-shrink-0">
                          {formatReminderDate(reminder.date)}
                        </span>
                      </div>
                    ))}
                    {calendarReminders.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No reminders yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Dialog open={showRemindersModal} onOpenChange={setShowRemindersModal}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Reminder
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedDate && selectedDateReminders.length > 0
                        ? `Reminders for ${selectedDate.toLocaleDateString()}`
                        : 'Add Calendar Reminder'}
                    </DialogTitle>
                  </DialogHeader>
                  {selectedDate && selectedDateReminders.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateReminders.map(reminder => (
                        <div key={reminder.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                          <div className={`w-2 h-2 ${reminder.color} rounded-full flex-shrink-0`}></div>
                          <span className="flex-1 text-xs truncate">{reminder.text}</span>
                          <span className="text-muted-foreground text-xs flex-shrink-0">
                            {formatReminderDate(reminder.date)}
                          </span>
                        </div>
                      ))}
                      {selectedDateReminders.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No reminders for this date
                        </p>
                      )}
                    </div>
                  ) : (
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
                        <Label htmlFor="note">Note</Label>
                        <Textarea
                          id="note"
                          placeholder="Follow up with Sarah about the engineering role..."
                          value={calendarNote}
                          onChange={(e) => setCalendarNote(e.target.value)}
                          className="resize-none"
                        />
                      </div>
                      <Button 
                        onClick={addReminder} 
                        disabled={addingReminder}
                        className="w-full"
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
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Middle Column - Recent History and People */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {/* Recent History */}
            <Card className="h-fit">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b border-green-100 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    Recent Activity
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="border-green-200 text-green-600 dark:border-green-800 dark:text-green-400 text-xs"
                  >
                    {historyItems.length} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <ScrollArea className="h-60 sm:h-80">
                  <div className="space-y-3">
                    {historyItems.length > 0 ? historyItems.map((item: HistoryItem) => (
                      <div
                        key={item.id}
                        className="group rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div 
                            className="space-y-1 flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleHistoryClick(item)}
                          >
                            <div className="flex items-center gap-2">
                              {item.type === "Email" ? (
                                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                              ) : (
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                              )}
                              <p className="text-xs sm:text-sm font-medium leading-none truncate">{item.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium truncate">{item.company}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <Badge variant={item.type === "Email" ? "default" : "secondary"} className="text-xs">
                              {item.type}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteHistoryItem(item.id)
                              }}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">No activity yet</p>
                        <p className="text-xs text-muted-foreground">Generated emails and letters will appear here</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* People & Contacts */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 border-b border-rose-100 dark:border-rose-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
                    People & Contacts
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950 bg-transparent text-xs"
                  >
                    <Link href="dashboard/cold-email">
                      <Plus className="mr-1 sm:mr-2 h-3 w-3" />
                      <span className="hidden sm:inline">Add</span>
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <ScrollArea className="h-48 sm:h-64">
                  <div className="space-y-3">
                    {peopleHistory.length > 0 ? peopleHistory.map((person: Person) => (
                      <div key={person.id} className="group rounded-lg border p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm truncate">{person.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{person.company}</p>
                              <p className="text-xs text-muted-foreground truncate">{person.position}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteContact(person.id)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleFollowUp(person)}
                              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-xs h-7 flex-shrink-0"
                            >
                              <span className="hidden sm:inline">Follow Up</span>
                              <span className="sm:hidden">Follow</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <User className="mx-auto h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">No contacts yet</p>
                        <p className="text-xs text-muted-foreground">Save contacts from your emails</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Template Library */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-b border-purple-100 dark:border-purple-800">
                <CardTitle className="text-purple-700 dark:text-purple-300 text-sm sm:text-base">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3 sm:p-6">
                <Button asChild className="w-full justify-start h-10 sm:h-12">
                  <Link href="dashboard/cold-email">
                    <Mail className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    <div className="text-left">
                      <div className="font-medium text-xs sm:text-sm">New Email</div>
                      <div className="text-xs opacity-80 hidden sm:block">Create cold email</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start h-10 sm:h-12 bg-transparent">
                  <Link href="dashboard/cover-letter">
                    <FileText className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    <div className="text-left">
                      <div className="font-medium text-xs sm:text-sm">New Letter</div>
                      <div className="text-xs opacity-80 hidden sm:block">Create cover letter</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start h-10 sm:h-12 bg-transparent">
                  <Link href="/dashboard/templates">
                    <Plus className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                    <div className="text-left">
                      <div className="font-medium text-xs sm:text-sm">New Template</div>
                      <div className="text-xs opacity-80 hidden sm:block">Save for reuse</div>
                    </div>
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Template Library */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-b border-orange-100 dark:border-orange-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    Your Templates
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950"
                  >
                    <Link href="dashboard/templates">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {templates.length > 0 ? (
                  <div className="space-y-3">
                    {templates.slice(0, 3).map((template: Template) => (
                      <div
                        key={template.id}
                        className="group rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs sm:text-sm font-medium line-clamp-1 flex-1">{template.title}</p>
                            <Badge
                              variant={template.type === "Email" ? "default" : "secondary"}
                              className="text-xs shrink-0"
                            >
                              {template.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{template.preview}</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 h-6 sm:h-7 text-xs bg-transparent"
                              onClick={() => handleUseTemplate(template)}
                            >
                              <span className="hidden sm:inline">Use Template</span>
                              <span className="sm:hidden">Use</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 sm:h-7 w-6 sm:w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              asChild
                            >
                              <Link href="dashboard/templates">
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full mt-3 bg-transparent" size="sm" asChild>
                      <Link href="dashboard/templates">
                        <span className="hidden sm:inline">View All Templates</span>
                        <span className="sm:hidden">View All</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-3">No templates yet</p>
                    <Button variant="outline" size="sm" asChild className="bg-transparent">
                      <Link href="dashboard/templates">
                        <Plus className="mr-2 h-3 w-3" />
                        Create Template
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showReminderDetailModal} onOpenChange={setShowReminderDetailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reminder Details</DialogTitle>
          </DialogHeader>
          {selectedReminder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${selectedReminder.color} rounded-full flex-shrink-0`}></div>
                <span className="font-medium text-sm">{selectedReminder.text}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Date: {formatReminderDate(selectedReminder.date)}
              </div>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/reminders/${selectedReminder.id}`, {
                      method: 'DELETE'
                    });
                    if (!response.ok) {
                      throw new Error('Failed to delete reminder');
                    }
                    setCalendarReminders(prev => prev.filter(reminder => reminder.id !== selectedReminder?.id));
                    setSelectedReminder(null);
                    setShowReminderDetailModal(false);
                    toast({
                      title: "Reminder deleted",
                      description: "Your reminder has been removed.",
                    });
                  } catch (error) {
                    console.error('Delete reminder error:', error);
                    toast({
                      title: "Delete failed",
                      description: "Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Delete Reminder
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}