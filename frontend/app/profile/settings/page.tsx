"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type TabId = "profile" | "notifications" | "privacy" | "billing"

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy & Security" },
  { id: "billing", label: "Billing" },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile")

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto max-w-5xl px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          <nav
            className="shrink-0 md:w-52"
            aria-label="Settings sections"
          >
            <ul className="space-y-1 border-r border-border pr-4 md:pr-6">
              {TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex-1 min-w-0">
            <Card className="border-border bg-card">
              {activeTab === "profile" && (
                <>
                  <CardHeader>
                    <CardTitle className="text-foreground">Profile</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Manage your account information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <div className="mt-1 text-foreground">user@swe.dev</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Username</Label>
                      <div className="mt-1 text-foreground">swemaxxer_2025</div>
                    </div>
                    <Button className="bg-primary text-primary-foreground hover:opacity-90">
                      Edit profile
                    </Button>
                  </CardContent>
                </>
              )}

              {activeTab === "notifications" && (
                <>
                  <CardHeader>
                    <CardTitle className="text-foreground">Notifications</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Configure notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {["Email notifications", "Interview reminders", "New intel drops", "Referral updates"].map(
                      (item, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                          <Label htmlFor={`notif-${i}`} className="text-foreground font-normal">
                            {item}
                          </Label>
                          <Switch id={`notif-${i}`} defaultChecked={i < 2} />
                        </div>
                      )
                    )}
                  </CardContent>
                </>
              )}

              {activeTab === "privacy" && (
                <>
                  <CardHeader>
                    <CardTitle className="text-foreground">Privacy & Security</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Manage security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full border-border text-foreground hover:bg-muted">
                      Change password
                    </Button>
                    <Button variant="outline" className="w-full border-border text-foreground hover:bg-muted">
                      Enable 2FA
                    </Button>
                  </CardContent>
                </>
              )}

              {activeTab === "billing" && (
                <>
                  <CardHeader>
                    <CardTitle className="text-foreground">Billing</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Subscription and payment methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="font-medium text-foreground">Pro Plan</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        $29/month. Renews Feb 15, 2025
                      </div>
                    </div>
                    <Button className="bg-primary text-primary-foreground hover:opacity-90">
                      Manage subscription
                    </Button>
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
