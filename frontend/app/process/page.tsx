import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, MessageCircle, ArrowRight } from "lucide-react"

export default function ProcessPage() {
  const pillars = [
    {
      icon: Calendar,
      title: "Timelines",
      description: "Typical process length and stages (OA, interviews, onsite) so you know what to expect.",
    },
    {
      icon: Users,
      title: "Referrals",
      description: "Community-submitted intel and referral paths. MVP runs via Discord; in-app later.",
    },
    {
      icon: MessageCircle,
      title: "Community",
      description: "Threads and discussions. For now we lean on Discord; we’ll migrate in-app over time.",
    },
  ]

  const companies = [
    { name: "Google", timeline: "3–4 weeks", focus: "Clarification, no running code" },
    { name: "Meta", timeline: "2–3 weeks", focus: "LC-style, optimize" },
    { name: "Amazon", timeline: "4–5 weeks", focus: "LC + Leadership Principles" },
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 pt-20 pb-24">
        {/* Headline — one focal, no decoration */}
        <header className="mb-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            !process
          </h1>
          <p className="mt-3 text-muted-foreground">
            Pre-application prep: timelines, referrals, and community. Know the pipeline before you apply.
          </p>
        </header>

        {/* What you get — three items, minimal cards */}
        <section className="mb-16">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-8">
            What you get
          </h2>
          <div className="space-y-4">
            {pillars.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-border bg-card">
                <CardContent className="flex gap-4 py-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Company snapshot — simple table-like list */}
        <section className="mb-16">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-6">
            Supported companies (MVP)
          </h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-foreground">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Typical timeline</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Focus</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((row) => (
                  <tr key={row.name} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.timeline}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Single CTA */}
        <section>
          <Card className="border-border bg-card">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-6">
                Join the community for timelines, referral tips, and prep discussions.
              </p>
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                Join Discord
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
