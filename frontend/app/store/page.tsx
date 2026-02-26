import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Check } from "lucide-react"

const products = [
  { title: "Interview Pack: FAANG", description: "50 company-specific interview simulations", price: "$49" },
  { title: "Resume Review Pro", description: "ATS optimization and design review", price: "$79" },
  { title: "Mock Interview 1-on-1", description: "60 min live interview with feedback", price: "$99" },
  { title: "Referral Boost", description: "Guaranteed referral to 3 target companies", price: "$149" },
  { title: "System Design Masterclass", description: "10 hours of advanced system design prep", price: "$129" },
  { title: "Complete Prep Bundle", description: "Everything you need to land offers", price: "$299" },
]

const tiers = [
  { name: "Free", price: "$0", period: null, features: ["5 interviews/month", "Basic feedback", "Community access"] },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: ["Unlimited interviews", "Advanced analytics", "Priority support", "Resume reviews", "All tools"],
    recommended: true,
  },
  {
    name: "Elite",
    price: "$99",
    period: "/month",
    features: ["Everything in Pro", "1-on-1 coaching", "Referral guarantee", "Custom prep plans"],
  },
]

export default function StorePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 pt-20 pb-24">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Store
          </h1>
          <p className="mt-3 text-muted-foreground">
            Interview packs, resume tools, and subscriptions. Green = primary actions.
          </p>
        </header>

        {/* Products */}
        <section className="mb-20">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-8">
            Products
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.title} className="border-border bg-card">
                <CardHeader className="pb-2">
                  <h3 className="font-medium text-foreground">{product.title}</h3>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-xl font-semibold tabular-nums text-foreground">{product.price}</span>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-90 shrink-0">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Subscription tiers */}
        <section className="mb-20">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-8">
            Subscription tiers
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`border-border bg-card ${tier.recommended ? "border-accent" : ""}`}
              >
                <CardHeader className="pb-2">
                  {tier.recommended && (
                    <span className="text-xs font-medium uppercase tracking-wider text-accent">Recommended</span>
                  )}
                  <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {tier.price}
                    {tier.period && <span className="text-base font-normal text-muted-foreground">{tier.period}</span>}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 text-accent" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={tier.price === "$0" ? "w-full" : "w-full bg-primary text-primary-foreground hover:opacity-90"}
                    variant={tier.price === "$0" ? "outline" : "default"}
                  >
                    {tier.price === "$0" ? "Get started" : "Subscribe"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Single bundle CTA */}
        <Card className="border-border bg-card">
          <CardContent className="py-10 px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Ultimate SWE Bundle</h2>
              <p className="mt-1 text-muted-foreground">
                Unlimited interviews, all courses, resume reviews, mock interviews, referrals. Save 40%.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-muted-foreground line-through tabular-nums">$697</span>
              <span className="text-2xl font-semibold tabular-nums text-primary">$399</span>
              <Button className="bg-primary text-primary-foreground hover:opacity-90">
                Get bundle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
