import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Bell, Shield, CreditCard } from "lucide-react"

export default function SettingsPage() {
  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-[#00FF41] mb-8">{">"} Settings</h1>

        <div className="space-y-6">
          <Card className="bg-[#1E2127] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-[#00FF41] flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription className="text-[#8B949E]">Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-[#8B949E] block mb-2">Email</label>
                <div className="text-[#00FF41]">user@swe.dev</div>
              </div>
              <div>
                <label className="text-sm text-[#8B949E] block mb-2">Username</label>
                <div className="text-[#00FF41]">swemaxxer_2025</div>
              </div>
              <Button className="bg-[#00FF41] text-[#0A0E11] hover:bg-[#FFB86C] glitch-hover">Edit Profile</Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1E2127] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-[#00FF41] flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription className="text-[#8B949E]">Configure your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Email notifications", "Interview reminders", "New intel drops", "Referral updates"].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[#8B949E]">{item}</span>
                  <div className="w-12 h-6 bg-[#00FF41] rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[#1E2127] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-[#00FF41] flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription className="text-[#8B949E]">Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full border-[#30363D] text-[#00FF41] hover:bg-[#00FF41] hover:text-[#0A0E11] bg-transparent"
              >
                Change Password
              </Button>
              <Button
                variant="outline"
                className="w-full border-[#30363D] text-[#00FF41] hover:bg-[#00FF41] hover:text-[#0A0E11] bg-transparent"
              >
                Enable 2FA
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1E2127] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-[#00FF41] flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing
              </CardTitle>
              <CardDescription className="text-[#8B949E]">Manage your subscription and payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-[#0A0E11] rounded border border-[#00FF41]">
                <div className="text-[#00FF41] font-bold mb-1">Pro Plan</div>
                <div className="text-sm text-[#8B949E]">$29/month • Renews on Feb 15, 2025</div>
              </div>
              <Button className="bg-[#00FF41] text-[#0A0E11] hover:bg-[#FFB86C] glitch-hover">
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
