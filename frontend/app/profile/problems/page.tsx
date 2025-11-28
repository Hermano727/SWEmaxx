import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"

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
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-[#00FF41] mb-8">{">"} My Problems</h1>

        <div className="grid gap-4">
          {problems.map((problem, index) => (
            <Card key={index} className="bg-[#1E2127] border-[#30363D] hover:border-[#00FF41] transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {problem.status === "solved" ? (
                      <CheckCircle2 className="h-6 w-6 text-[#00FF41]" />
                    ) : (
                      <Circle className="h-6 w-6 text-[#8B949E]" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-[#00FF41]">{problem.title}</h3>
                      <p className="text-sm text-[#8B949E]">{problem.attempts} attempts</p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded text-sm ${
                      problem.difficulty === "Easy"
                        ? "bg-[#00FF41]/20 text-[#00FF41]"
                        : problem.difficulty === "Medium"
                          ? "bg-[#FFB86C]/20 text-[#FFB86C]"
                          : "bg-[#EC4899]/20 text-[#EC4899]"
                    }`}
                  >
                    {problem.difficulty}
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
