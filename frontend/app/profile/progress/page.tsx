import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProgressPage() {
  const stats = [
    { label: "Success rate", value: "83%" },
    { label: "Problems solved", value: "47" },
    { label: "Interviews", value: "12" },
    { label: "Avg runtime", value: "38m" },
  ]

  const skills = [
    { skill: "Arrays & Strings", level: 85 },
    { skill: "Trees & Graphs", level: 72 },
    { skill: "Dynamic Programming", level: 68 },
    { skill: "System Design", level: 79 },
    { skill: "Behavioral", level: 91 },
  ]

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Progress</h1>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-semibold tabular-nums text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Skill breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skills.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{item.skill}</span>
                  <span className="font-medium tabular-nums text-foreground">{item.level}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${item.level}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
