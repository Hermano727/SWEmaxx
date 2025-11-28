import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Package, FileText, Video, Users, Zap, Check } from "lucide-react"

export default function StorePage() {
  const products = [
    {
      icon: Package,
      title: "Interview Pack: FAANG",
      description: "50 company-specific interview simulations",
      price: "$49",
      color: "text-[#46a758]",
      border: "border-[#46a758]",
    },
    {
      icon: FileText,
      title: "Resume Review Pro",
      description: "Expert ATS optimization + design review",
      price: "$79",
      color: "text-[#46a758]",
      border: "border-[#46a758]",
    },
    {
      icon: Video,
      title: "Mock Interview 1-on-1",
      description: "60min live interview with feedback",
      price: "$99",
      color: "text-[#3b82f6]",
      border: "border-[#3b82f6]",
    },
    {
      icon: Users,
      title: "Referral Boost",
      description: "Guaranteed referral to 3 target companies",
      price: "$149",
      color: "text-[#3b82f6]",
      border: "border-[#3b82f6]",
    },
    {
      icon: Zap,
      title: "System Design Masterclass",
      description: "10 hours of advanced system design prep",
      price: "$129",
      color: "text-[#46a758]",
      border: "border-[#46a758]",
    },
    {
      icon: Package,
      title: "Complete Prep Bundle",
      description: "Everything you need to land offers",
      price: "$299",
      color: "text-[#46a758]",
      border: "border-[#46a758]",
    },
  ]

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 bg-[#1a1d23]">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#46a758] mb-4">
            {"<"} Store {">"}
          </h1>
          <p className="text-xl text-[#d0d0d0]">Level up your interview game. Get the tools you need to succeed.</p>
        </div>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-3 justify-center">
          {["All Products", "Interview Packs", "Resume Tools", "Mock Interviews", "Referrals", "Courses"].map(
            (category) => (
              <Button
                key={category}
                variant="outline"
                className="border-[#3b3f4d] text-[#d0d0d0] hover:bg-[#46a758] hover:text-white hover:border-[#46a758] bg-transparent"
              >
                {category}
              </Button>
            ),
          )}
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {products.map((product, index) => (
            <Card key={index} className={`bg-[#242830] ${product.border} hover:scale-105 transition-all`}>
              <CardHeader>
                <product.icon className={`h-12 w-12 ${product.color} mb-4`} />
                <CardTitle className={`text-xl ${product.color}`}>{product.title}</CardTitle>
                <CardDescription className="text-[#b0b0b0] leading-relaxed">{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${product.color} mb-4`}>{product.price}</div>
                <Button className="w-full bg-[#46a758] text-white hover:bg-[#50b962]">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">Subscription Tiers</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free Tier",
                price: "$0",
                features: ["5 interviews/month", "Basic feedback", "Community access", "Problem bank"],
              },
              {
                name: "Pro",
                price: "$29",
                period: "/month",
                features: [
                  "Unlimited interviews",
                  "Advanced analytics",
                  "Priority support",
                  "Resume reviews",
                  "All tools access",
                ],
                popular: true,
              },
              {
                name: "Elite",
                price: "$99",
                period: "/month",
                features: [
                  "Everything in Pro",
                  "1-on-1 coaching",
                  "Referral guarantee",
                  "Custom prep plans",
                  "Lifetime access",
                ],
              },
            ].map((tier, index) => (
              <Card
                key={index}
                className={`bg-[#242830] ${tier.popular ? "border-[#46a758] scale-105" : "border-[#3b3f4d]"} hover:border-[#46a758] transition-all`}
              >
                <CardHeader>
                  {tier.popular && <div className="text-[#46a758] text-sm font-bold mb-2">MOST POPULAR</div>}
                  <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
                  <div className="text-4xl font-bold text-[#46a758] mt-4">
                    {tier.price}
                    {tier.period && <span className="text-lg text-[#b0b0b0]">{tier.period}</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-white">
                        <Check className="h-5 w-5 text-[#46a758] flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full mt-6 ${
                      tier.popular
                        ? "bg-[#46a758] text-white hover:bg-[#50b962]"
                        : "bg-[#3b82f6] text-white hover:bg-[#60a5fa]"
                    }`}
                  >
                    {tier.price === "$0" ? "Get Started" : "Subscribe"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Bundle */}
        <Card className="bg-gradient-to-r from-[#1a1d23] via-[#242830] to-[#1a1d23] border-[#46a758]">
          <CardContent className="pt-12 pb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#46a758] mb-4">Ultimate SWE Bundle</h2>
            <p className="text-xl text-[#d0d0d0] mb-6 max-w-2xl mx-auto leading-relaxed">
              Get access to everything: unlimited interviews, all courses, resume reviews, mock interviews, and
              guaranteed referrals. Save 40%.
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-[#8B949E] line-through text-2xl">$697</span>
              <span className="text-[#46a758] text-5xl font-bold">$399</span>
            </div>
            <Button size="lg" className="bg-[#46a758] text-white hover:bg-[#50b962] text-xl px-12 py-6">
              Get Ultimate Bundle
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
