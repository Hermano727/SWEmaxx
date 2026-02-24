import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function ProblemsPage() {
  const problems = [
    { title: "Two Sum", difficulty: "Easy", status: "solved", attempts: 3 },
    { title: "Add Two Numbers", difficulty: "Medium", status: "solved", attempts: 2 },
    { title: "Longest Substring Without Repeating", difficulty: "Medium", status: "attempted", attempts: 1 },
    { title: "Median of Two Sorted Arrays", difficulty: "Hard", status: "unsolved", attempts: 0 },
    { title: "Reverse Integer", difficulty: "Easy", status: "solved", attempts: 1 },
    { title: "String to Integer (atoi)", difficulty: "Medium", status: "solved", attempts: 2 },
  ]

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">My problems</h1>
        </header>

        <div className="space-y-4">
          {problems.map((problem, index) => (
            <Card
              key={index}
              className="border-border bg-card transition-colors hover:border-[var(--border-strong)]"
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">{problem.title}</h3>
                    <p className="text-sm text-muted-foreground">{problem.attempts} attempts</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "rounded px-3 py-1 text-sm font-medium",
                        problem.difficulty === "Easy" && "bg-primary/20 text-primary",
                        problem.difficulty === "Medium" && "bg-chart-4/20 text-chart-4",
                        problem.difficulty === "Hard" && "bg-destructive/20 text-destructive"
                      )}
                    >
                      {problem.difficulty}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {problem.status === "solved" ? "Solved" : problem.status === "attempted" ? "Attempted" : "Unsolved"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
