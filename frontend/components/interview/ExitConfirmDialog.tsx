import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ExitConfirmDialogProps {
  open: boolean
  onCancel: () => void
  onExit: () => void
}

export function ExitConfirmDialog({ open, onCancel, onExit }: ExitConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-[#1a1d23] border border-[#30363d] max-w-md rounded-lg shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Exit interview?</h3>
              <p className="text-sm text-[#8b949e]">Your progress will not be saved.</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-[#30363d] text-[#c9d1d9] hover:bg-[#22262e] hover:text-white"
            >
              Continue
            </Button>
            <Button onClick={onExit} variant="destructive" className="text-sm">
              Exit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

