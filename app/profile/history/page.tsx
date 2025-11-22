import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"

export default function HistoryPage() {
  const history = [
    {
      date: "2025-01-18",
      company: "Google",
      problem: "Two Sum Variant",
      result: "Strong Hire",
      runtime: "42m",
      score: 95,
    },
    {
      date: "2025-01-17",
      company: "Meta",
      problem: "Binary Tree Level Order",
      result: "Hire",
      runtime: "38m",
      score: 87,
    },
    {
      date: "2025-01-16",
      company: "Amazon",
      problem: "Merge K Sorted Lists",
      result: "Strong Hire",
      runtime: "35m",
      score: 92,
    },
    { date: "2025-01-15", company: "Microsoft", problem: "LRU Cache", result: "No Hire", runtime: "52m", score: 64 },
    {
      date: "2025-01-14",
      company: "Apple",
      problem: "Design URL Shortener",
      result: "Hire",
      runtime: "45m",
      score: 81,
    },
  ]

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-[#00FF41] mb-8">{">"} Interview History</h1>

        <div className="space-y-4">
          {history.map((item, index) => (
            <Card key={index} className="bg-[#1E2127] border-[#30363D] hover:border-[#00FF41] transition-all">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#00FF41]">{item.company}</h3>
                      <span className="text-[#8B949E]">•</span>
                      <span className="text-[#8B949E]">{item.date}</span>
                    </div>
                    <p className="text-[#8B949E]">{item.problem}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-[#8B949E]">Runtime</div>
                      <div className="text-[#FFB86C] font-bold">{item.runtime}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[#8B949E]">Score</div>
                      <div className="text-[#00FF41] font-bold">{item.score}%</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.result.includes("Strong Hire") || item.result === "Hire" ? (
                        <CheckCircle2 className="h-6 w-6 text-[#00FF41]" />
                      ) : (
                        <XCircle className="h-6 w-6 text-[#EC4899]" />
                      )}
                      <span
                        className={
                          item.result.includes("Strong Hire") || item.result === "Hire"
                            ? "text-[#00FF41]"
                            : "text-[#EC4899]"
                        }
                      >
                        {item.result}
                      </span>
                    </div>
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
