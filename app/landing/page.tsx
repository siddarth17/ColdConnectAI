"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  Mail, 
  FileText, 
  Users, 
  BarChart3, 
  Zap, 
  Target, 
  Brain,
  CheckCircle,
  ArrowRight,
  Star,
  MessageSquare,
  Calendar,
  Layout
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation Header */}
      <nav className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                ColdConnect AI
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600">
                <Link href="/auth/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            Supercharge Your Recruiting and
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Get Hired Faster
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Stop sending generic applications. ColdConnect AI tailors your resume bullets to each JD, crafts role-specific emails and cover letters, and prepares interview answers from your profile and stories.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-lg px-8 py-6">
              <Link href="/auth/signup">
                Start Creating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
              <Link href="/auth/signin">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why ColdConnect AI for Recruiting?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your recruiting with intelligent personalization
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <Card className="border-blue-100 dark:border-blue-900 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-blue-900 dark:text-blue-100">AI-Powered Personalization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Our smart AI analyzes your profile to emphasize the most relevant experiences for each role, and now even rewrites resume bullets to match each job description.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-emerald-100 dark:border-emerald-900 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-emerald-900 dark:text-emerald-100">Universal Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Works for any role in any industry, from tech to healthcare to finance. No hardcoded limitations, just intelligent adaptation.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-purple-100 dark:border-purple-900 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mb-4">
                <Layout className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-purple-900 dark:text-purple-100">Smart Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Save and reuse your best-performing templates. Each one gets personalized with your relevant background for every application.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border-orange-100 dark:border-orange-900 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-orange-900 dark:text-orange-100">Activity Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Track applications, manage contacts, set follow-up reminders, and see your saved progress in one organized dashboard.
              </p>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="border-rose-100 dark:border-rose-900 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-rose-900 dark:text-rose-100">Contact Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Save contacts from your applications and easily follow up with personalized messages. Build your professional network strategically.
              </p>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="border-indigo-100 dark:border-indigo-900 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-indigo-900 dark:text-indigo-100">Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Spend less time writing and more time networking.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From profile setup to landing responses in 4 simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Build Your Profile</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Add your work experience, education, and skills once. Our AI learns your complete background.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Target a Job</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Paste the job description, select experiences, and let AI tailor your bullets, emails, and letters.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">AI Creates Magic</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI aligns your bullets, drafts outreach, and prepares interview answers using your stories.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Apply & Track</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Copy your personalized application, send it out, and track your progress with built-in reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              The Smart Difference
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Unlike generic templates, ColdConnect AI understands context. Every application utilizes your unique data, perfectly tailored for the opportunity.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Context-Aware Personalization</h4>
                  <p className="text-gray-600 dark:text-gray-300">PM role at Netflix? Emphasizes product strategy. Nursing position? Highlights patient care.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Quality Over Quantity</h4>
                  <p className="text-gray-600 dark:text-gray-300">AI selects only your most impressive and relevant experiences for each application.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Professional Results</h4>
                  <p className="text-gray-600 dark:text-gray-300">Every email and cover letter maintains professional standards while feeling personal.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <Card className="border-blue-100 dark:border-blue-900">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Cold Emails</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Get responses from hiring managers</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    "Hi Sarah, I noticed Scale AI's focus on training data quality aligns perfectly with my ML engineering experience at..."
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 dark:border-emerald-900">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-8 w-8 text-emerald-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Cover Letters</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Stand out from generic applications</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    "My experience scaling data pipelines at TechCorp directly addresses Netflix's need for robust content recommendation systems..."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Outreach?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
              <Link href="/auth/signup">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">ColdConnect AI</span>
            </div>
            
            <div className="text-gray-400 text-sm">
              © 2025 ColdConnect AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
