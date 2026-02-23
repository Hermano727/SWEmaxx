import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Network, TrendingUp, Users, FileText, Shield, Zap } from "lucide-react"

export default function ProcessPage() {
  return (
    <main className="min-h-screen pt-24 pb-16 px-4 bg-[#1a1d23]">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="inline-block mb-4">
            <span className="text-[#14b8a6] text-6xl md:text-7xl font-bold">!process</span>
          </div>
          <p className="text-xl text-[#d0d0d0] mt-4">
            Infiltrate the hiring pipeline. Access leaked intel. Connect with insiders.
          </p>
          <div className="mt-6 inline-block px-6 py-2 border-2 border-[#14b8a6] rounded">
            <span className="text-[#14b8a6]">ACCESS GRANTED</span>
          </div>
        </div>

        <div className="mb-12">
          <Card className="bg-[#1a1d23] border-[#14b8a6]/70">
            <CardHeader>
              <CardTitle className="text-[#14b8a6] flex items-center gap-2 text-2xl">
                <Network className="h-6 w-6" />
                Network Intelligence Dashboard
              </CardTitle>
              <CardDescription className="text-[#b0b0b0]">
                Real-time hiring intel from 2,847 active nodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#242830] rounded border border-[#14b8a6]">
                  <div className="text-[#14b8a6] text-3xl font-bold">342</div>
                  <div className="text-[#b0b0b0] text-sm mt-1">Active Referrals</div>
                </div>
                <div className="p-4 bg-[#242830] rounded border border-[#46a758]">
                  <div className="text-[#46a758] text-3xl font-bold">156</div>
                  <div className="text-[#b0b0b0] text-sm mt-1">Intel Drops Today</div>
                </div>
                <div className="p-4 bg-[#242830] rounded border border-[#46a758]">
                  <div className="text-[#46a758] text-3xl font-bold">2.8K</div>
                  <div className="text-[#b0b0b0] text-sm mt-1">Network Members</div>
                </div>
                <div className="p-4 bg-[#242830] rounded border border-[#14b8a6]">
                  <div className="text-[#14b8a6] text-3xl font-bold">94%</div>
                  <div className="text-[#b0b0b0] text-sm mt-1">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Targets */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">{">"} TARGET_COMPANIES</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Google", intel: 47, referrals: 23, timeline: "3-4 weeks", status: "active" },
              { name: "Meta", intel: 38, referrals: 19, timeline: "2-3 weeks", status: "active" },
              { name: "Amazon", intel: 52, referrals: 31, timeline: "4-5 weeks", status: "active" },
              { name: "Microsoft", intel: 41, referrals: 27, timeline: "3-4 weeks", status: "active" },
              { name: "Apple", intel: 29, referrals: 15, timeline: "5-6 weeks", status: "limited" },
              { name: "Netflix", intel: 18, referrals: 9, timeline: "2-3 weeks", status: "active" },
            ].map((company, index) => (
              <Card
                key={index}
                className="bg-[#1a1d23] border-[#3b3f4d] hover:border-[#14b8a6]/60 transition-all cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-[#14b8a6] text-xl">{company.name}</CardTitle>
                    <div
                      className={`px-2 py-1 rounded text-xs ${
                        company.status === "active"
                          ? "bg-[#46a758]/20 text-[#46a758]"
                          : "bg-[#14b8a6]/20 text-[#14b8a6]"
                      }`}
                    >
                      {company.status.toUpperCase()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#b0b0b0]">Intel Drops</span>
                    <span className="text-[#14b8a6]">{company.intel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#b0b0b0]">Active Referrals</span>
                    <span className="text-[#46a758]">{company.referrals}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#b0b0b0]">Avg Timeline</span>
                    <span className="text-[#14b8a6]">{company.timeline}</span>
                  </div>
                  <Button className="w-full mt-4 bg-[#46a758] text-white hover:bg-[#50b962]">Access Intel</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Intel Feed */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">{">"} LEAKED_INTEL_FEED</h2>
          <div className="space-y-4">
            {[
              {
                type: "Resume Strategy",
                company: "Google",
                title: "L4 SWE Resume that got 3 offers",
                author: "anon_dev_847",
                time: "2h ago",
                votes: 127,
              },
              {
                type: "Timeline Data",
                company: "Meta",
                title: "E5 hiring process - complete breakdown",
                author: "meta_insider_23",
                time: "5h ago",
                votes: 89,
              },
              {
                type: "Referral",
                company: "Amazon",
                title: "SDE2 referral available - 3 spots left",
                author: "aws_engineer",
                time: "8h ago",
                votes: 243,
              },
              {
                type: "Interview Prep",
                company: "Stripe",
                title: "Actual system design questions from recent interviews",
                author: "stripe_alumni",
                time: "12h ago",
                votes: 156,
              },
            ].map((post, index) => (
              <Card
                key={index}
                className="bg-[#242830] border-[#3b3f4d] hover:border-[#14b8a6]/60 transition-all cursor-pointer"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <TrendingUp className="h-5 w-5 text-[#46a758]" />
                      <span className="text-[#46a758] text-sm font-bold">{post.votes}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-[#14b8a6]/20 text-[#14b8a6] text-xs rounded">{post.type}</span>
                        <span className="px-2 py-1 bg-[#46a758]/20 text-[#46a758] text-xs rounded">{post.company}</span>
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">{post.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-[#b0b0b0]">
                        <span>by {post.author}</span>
                        <span>•</span>
                        <span>{post.time}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">{">"} COLLECTIVE_FEATURES</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Referral Network",
                desc: "Direct connections to engineers at target companies",
                color: "text-[#14b8a6]",
              },
              {
                icon: FileText,
                title: "Resume Database",
                desc: "Successful resumes that landed offers",
                color: "text-[#14b8a6]",
              },
              {
                icon: TrendingUp,
                title: "Timeline Intel",
                desc: "Real hiring timelines from recent applicants",
                color: "text-[#46a758]",
              },
              {
                icon: Shield,
                title: "Interview Questions",
                desc: "Actual questions from recent interviews",
                color: "text-[#14b8a6]",
              },
              { icon: Network, title: "Salary Data", desc: "Leaked compensation packages", color: "text-[#46a758]" },
              { icon: Zap, title: "Fast Track", desc: "Expedited referral connections", color: "text-[#14b8a6]" },
            ].map((feature, index) => (
              <Card key={index} className="bg-[#1a1d23] border-[#3b3f4d] hover:border-[#14b8a6]/60 transition-all">
                <CardContent className="pt-6">
                  <feature.icon className={`h-10 w-10 ${feature.color} mb-4`} />
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-[#d0d0d0]">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
