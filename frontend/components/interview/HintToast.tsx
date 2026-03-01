import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

interface HintToastProps {
  hintsEnabled: boolean
  isOpen: boolean
  revealedHintsCount: number
  hints: string[]
  onClose: () => void
}

export function HintToast({
  hintsEnabled,
  isOpen,
  revealedHintsCount,
  hints,
  onClose,
}: HintToastProps) {
  if (!hintsEnabled || !isOpen || revealedHintsCount <= 0 || hints.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 max-w-md z-40">
      <Card className="bg-[#1a1d23] border border-[#30363d] shadow-xl rounded-lg overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[#46a758]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#8b949e]">
                Interview hint{revealedHintsCount > 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-xs text-[#8b949e] hover:text-white hover:bg-[#22262e] rounded-md px-2 py-1 transition-colors"
            >
              Hide
            </button>
          </div>

          <div className="space-y-2">
            {hints.slice(0, revealedHintsCount).map((hint, index) => (
              <div
                key={index}
                className="rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2"
              >
                <p className="text-[11px] font-medium text-[#8b949e] mb-1">
                  Hint {index + 1}
                </p>
                <p className="text-sm text-[#e6edf3] leading-relaxed">{hint}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

