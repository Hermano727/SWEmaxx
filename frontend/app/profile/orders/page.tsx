import { Card, CardContent } from "@/components/ui/card"
import { Package, CheckCircle2 } from "lucide-react"

export default function OrdersPage() {
  const orders = [
    { id: "#ORD-2847", product: "Interview Pack: FAANG", date: "2025-01-15", status: "Delivered", amount: "$49" },
    { id: "#ORD-2821", product: "Resume Review Pro", date: "2025-01-08", status: "Completed", amount: "$79" },
    { id: "#ORD-2793", product: "Mock Interview 1-on-1", date: "2024-12-28", status: "Completed", amount: "$99" },
  ]

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-[#00FF41] mb-8">{">"} Order History</h1>

        <div className="space-y-4">
          {orders.map((order, index) => (
            <Card key={index} className="bg-[#1E2127] border-[#30363D] hover:border-[#00FF41] transition-all">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Package className="h-8 w-8 text-[#00FF41] mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-[#00FF41] mb-1">{order.product}</h3>
                      <p className="text-sm text-[#8B949E]">
                        Order {order.id} • {order.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[#00FF41] font-bold text-xl">{order.amount}</div>
                    </div>
                    <div className="flex items-center gap-2 text-[#84CC16]">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>{order.status}</span>
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
