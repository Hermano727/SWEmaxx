import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Target, Award, Zap } from "lucide-react"

export default function ProgressPage() {
  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-[#00FF41] mb-8">{">"} Progress Dashboard</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#1E2127] border-[#00FF41]">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 text-[#00FF41] mx-auto mb-2" />
              <div className="text-3xl font-bold text-[#00FF41]">83%</div>
              <div className="text-sm text-[#8B949E] mt-1">Success Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E2127] border-[#FFB86C]">
            <CardContent className="pt-6 text-center">
              <Target className="h-8 w-8 text-[#FFB86C] mx-auto mb-2" />
              <div className="text-3xl font-bold text-[#FFB86C]">47</div>
              <div className="text-sm text-[#8B949E] mt-1">Problems Solved</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E2127] border-[#06B6D4]">
            <CardContent className="pt-6 text-center">
              <Award className="h-8 w-8 text-[#06B6D4] mx-auto mb-2" />
              <div className="text-3xl font-bold text-[#06B6D4]">12</div>
              <div className="text-sm text-[#8B949E] mt-1">Interviews</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E2127] border-[#84CC16]">
            <CardContent className="pt-6 text-center">
              <Zap className="h-8 w-8 text-[#84CC16] mx-auto mb-2" />
              <div className="text-3xl font-bold text-[#84CC16]">38m</div>
              <div className="text-sm text-[#8B949E] mt-1">Avg Runtime</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#1E2127] border-[#30363D] mb-8">
          <CardHeader>
            <CardTitle className="text-[#00FF41]">Skill Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { skill: "Arrays & Strings", level: 85 },
              { skill: "Trees & Graphs", level: 72 },
              { skill: "Dynamic Programming", level: 68 },
              { skill: "System Design", level: 79 },
              { skill: "Behavioral", level: 91 },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-[#8B949E]">{item.skill}</span>
                  <span className="text-[#00FF41] font-bold">{item.level}%</span>
                </div>
                <div className="h-2 bg-[#30363D] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00FF41]" style={{ width: `${item.level}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
