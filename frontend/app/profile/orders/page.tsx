import { Card, CardContent } from "@/components/ui/card"

export default function OrdersPage() {
  const orders = [
    { id: "ORD-2847", product: "Interview Pack: FAANG", date: "2025-01-15", status: "Delivered", amount: "$49" },
    { id: "ORD-2821", product: "Resume Review Pro", date: "2025-01-08", status: "Completed", amount: "$79" },
    { id: "ORD-2793", product: "Mock Interview 1-on-1", date: "2024-12-28", status: "Completed", amount: "$99" },
  ]

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Order history</h1>
        </header>

        <div className="space-y-4">
          {orders.map((order, index) => (
            <Card key={index} className="border-border bg-card transition-colors hover:border-[var(--border-strong)]">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">{order.product}</h3>
                    <p className="text-sm text-muted-foreground">
                      {order.id}, {order.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-lg font-semibold tabular-nums text-foreground">{order.amount}</span>
                    <span className="text-sm text-primary">{order.status}</span>
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
