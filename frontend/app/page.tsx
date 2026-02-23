import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Terminal, Users } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen pt-16 bg-[#1a1d23]">
      {/* Hero — title, description, two CTAs only */}
      <section className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            SWEmaxx
          </h1>
          <p className="mt-3 text-2xl md:text-3xl font-semibold text-white/95">
            A better way to prepare for SWE interviews.
          </p>
          <p className="mt-4 text-lg text-[#9ca3af] leading-relaxed max-w-xl">
            Company-specific mock interviews and insider intel. Practice like Google, Meta, and Amazon actually interview — then access timelines, referrals, and real process data.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              size="lg"
              className="bg-[#46a758] text-white hover:bg-[#3d9450] font-medium px-6"
            >
              <Link href="/interview">Start Interview</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-[#14b8a6] text-[#14b8a6] hover:bg-[#14b8a6]/15 hover:text-[#2dd4bf] font-medium px-6"
            >
              <Link href="/process">!process</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Single purposeful section: two entry points, no bloat */}
      <section className="px-4 py-12 md:py-16 border-t border-[#2d323b]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-white mb-1">Get started</h2>
          <p className="text-[#9ca3af] text-sm mb-8">
            Choose how you want to use SWEmaxx.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/interview" className="group">
              <Card className="bg-[#22262e] border-[#2d323b] hover:border-[#46a758]/50 transition-colors h-full">
                <CardContent className="pt-6 pb-6">
                  <Terminal className="h-10 w-10 text-[#46a758] mb-4" />
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#46a758] transition-colors">
                    Interview Simulator
                  </h3>
                  <p className="mt-2 text-[#9ca3af] text-sm leading-relaxed">
                    Run company-style mock interviews (Google, Meta, Amazon). Silent interviewer mode with a real scorecard at the end.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/process" className="group">
              <Card className="bg-[#22262e] border-[#2d323b] hover:border-[#14b8a6]/60 transition-colors h-full">
                <CardContent className="pt-6 pb-6">
                  <Users className="h-10 w-10 text-[#14b8a6] mb-4" />
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#2dd4bf] transition-colors">
                    !process
                  </h3>
                  <p className="mt-2 text-[#9ca3af] text-sm leading-relaxed">
                    Timelines, referrals, and insider intel. See how others got process and connect with the community.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#2d323b] py-6 px-4 mt-12">
        <div className="container mx-auto max-w-4xl text-center text-[#6b7280] text-sm">
          <p>© 2025 SWEmaxx. Max your chances. Land your offers.</p>
        </div>
      </footer>
    </main>
  )
}
