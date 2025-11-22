import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Terminal, Users, FileCode, Target, Shield, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen pt-16 bg-[#1a1d23]">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1d23] via-[#242830] to-[#1a1d23] opacity-60" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block px-4 py-2 bg-[#242830] border border-[#46a758] rounded">
              <span className="text-[#46a758] text-sm font-mono">$ initializing_system...</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight space-y-2">
              <span className="block text-[#46a758]">Execute flawless interviews. Max your offers.</span>
              <span className="block text-white text-2xl md:text-3xl mt-4">Access insider networks.</span>
            </h1>
            <p className="text-xl text-[#d0d0d0] max-w-2xl mx-auto leading-relaxed">
              Ever joined the CSCD Discord and wondered how people actually get into FAANG? SWEmaxx gives you the tools
              and insider knowledge you've never had access to.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-[#46a758] text-white hover:bg-[#50b962] border border-[#46a758] text-lg px-8 shadow-[0_0_0_1px_#46a758,0_0_8px_#46a758]"
              >
                <Link href="/interview">Initialize Interview</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white text-lg px-8 bg-transparent"
              >
                <Link href="/process">Access Intel</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature List */}
      <section className="py-16 px-4 bg-[#242830]/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">Core Systems</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Terminal Grind */}
            <Card className="bg-[#1a1d23] border-[#46a758] hover:border-[#50b962] transition-all shadow-[0_0_0_1px_#46a758,0_0_12px_#46a758]">
              <CardHeader>
                <Terminal className="h-12 w-12 text-[#46a758] mb-4" />
                <CardTitle className="text-2xl text-[#46a758]">Interview Simulator</CardTitle>
                <CardDescription className="text-[#b0b0b0]">Terminal Grind Aesthetic</CardDescription>
              </CardHeader>
              <CardContent className="text-[#d0d0d0] leading-relaxed space-y-2">
                <p>Run mock interviews styled after Google, Meta, Amazon, and more.</p>
                <ul className="space-y-2 mt-4 text-base">
                  <li className="flex items-start gap-2">
                    <span className="text-[#46a758]">$</span>
                    <span className="text-white">Real-time scoring feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#46a758]">$</span>
                    <span className="text-white">Performance diff reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#46a758]">$</span>
                    <span className="text-white">Complete execution logs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Hacker Collective */}
            <Card className="bg-[#1a1d23] border-[#3b82f6] hover:border-[#60a5fa] transition-all shadow-[0_0_0_1px_#3b82f6,0_0_12px_#3b82f6]">
              <CardHeader>
                <Users className="h-12 w-12 text-[#3b82f6] mb-4" />
                <CardTitle className="text-2xl text-[#3b82f6]">!process Community</CardTitle>
                <CardDescription className="text-[#b0b0b0]">Hacker Collective Network</CardDescription>
              </CardHeader>
              <CardContent className="text-[#d0d0d0] leading-relaxed space-y-2">
                <p>Browse real hiring timelines, referrals, and insider intel from students and employees.</p>
                <ul className="space-y-2 mt-4 text-base">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6]">{">"}</span>
                    <span className="text-white">Leaked resume strategies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6]">{">"}</span>
                    <span className="text-white">Real timeline data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6]">{">"}</span>
                    <span className="text-white">Referral connections</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why SWEmaxx */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-white">Why SWEmaxx?</h2>
          <div className="space-y-6 text-[#d0d0d0] text-lg leading-relaxed">
            <p>You don't need insider parents or twenty thousand dollar bootcamps. You just need the right intel.</p>
            <p>Welcome to SWEmaxx. We make the system work for you.</p>
            <p className="text-white border-l-4 border-[#46a758] pl-4 italic">
              "SWEmaxx is made to help aspiring developers without resources maximize their chances of landing top-tier
              software engineering roles."
            </p>
          </div>
        </div>
      </section>

      {/* Tools Directory */}
      <section className="py-16 px-4 bg-[#242830]/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">Tools Directory</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Terminal,
                title: "Interview Simulator",
                desc: "Company-specific mock interviews",
                color: "text-[#46a758]",
              },
              { icon: FileCode, title: "Problem Drills", desc: "Practice DSA patterns", color: "text-[#46a758]" },
              { icon: Target, title: "Resume Tools", desc: "ATS optimization", color: "text-[#46a758]" },
              {
                icon: Users,
                title: "Referrals Network",
                desc: "Connect with insiders",
                color: "text-[#3b82f6]",
              },
              { icon: Shield, title: "Timeline Intel", desc: "Real hiring data", color: "text-[#3b82f6]" },
              { icon: Zap, title: "Performance Analytics", desc: "Track your progress", color: "text-[#3b82f6]" },
            ].map((tool, index) => (
              <Card key={index} className="bg-[#1a1d23] border-[#3b3f4d] hover:border-[#46a758] transition-all">
                <CardContent className="pt-6">
                  <tool.icon className={`h-10 w-10 ${tool.color} mb-4`} />
                  <h3 className="text-xl font-bold text-white mb-2">{tool.title}</h3>
                  <p className="text-[#d0d0d0]">{tool.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-[#1a1d23] via-[#242830] to-[#1a1d23]">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Enter the Workspace</h2>
          <p className="text-xl text-[#d0d0d0] mb-8 leading-relaxed">
            Join thousands of developers who are maxing their chances at landing their dream roles.
          </p>
          <Button
            size="lg"
            className="bg-[#3b82f6] text-white hover:bg-[#60a5fa] border border-[#3b82f6] text-xl px-12 py-6 shadow-[0_0_0_1px_#3b82f6,0_0_8px_#3b82f6]"
          >
            Initialize Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#30363D] py-8 px-4">
        <div className="container mx-auto text-center text-[#8B949E] text-sm">
          <p>© 2025 SWEmaxx. Max your chances. Land your offers.</p>
          <p className="mt-2">Built for developers, by developers.</p>
        </div>
      </footer>
    </main>
  )
}
