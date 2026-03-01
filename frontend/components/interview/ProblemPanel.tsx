import { ChevronDown, ChevronUp } from "lucide-react"
import type { QuestionBankItem } from "@/lib/constants/questions"
import { companyAllowsExamples } from "@/lib/constants/companies"

interface ProblemPanelProps {
  problem: QuestionBankItem
  company?: string
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function ProblemPanel({
  problem,
  company,
  collapsed,
  onToggleCollapsed,
}: ProblemPanelProps) {
  const showExamples = companyAllowsExamples(company)

  return (
    <div
      className={`${
        collapsed ? "h-12" : "min-h-[36%] max-h-[40%]"
      } border-b border-[#30363d] transition-all duration-200 flex flex-col`}
    >
      <button
        onClick={onToggleCollapsed}
        className="flex items-center justify-between px-4 py-3 bg-[#1a1d23] border-b border-[#30363d] text-left text-white hover:bg-[#22262e] active:bg-[#242830] transition-colors rounded-none"
        aria-expanded={!collapsed}
      >
        <span className="text-sm font-semibold tracking-tight">
          Problem: {problem.title}
        </span>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#8b949e]" />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#8b949e]" />
        )}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4 bg-[#0d1117] min-h-0 problem-scroll">
          <div className="text-[#e6edf3] space-y-4 text-sm leading-relaxed">
            <p>{problem.description}</p>

            {showExamples && problem.examples.length > 0 && (
              <div>
                <p className="font-medium text-white text-[13px] mb-2">
                  Example{problem.examples.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-3">
                  {problem.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="bg-[#1a1d23] p-4 rounded-md border border-[#30363d] font-mono text-[13px] text-[#e6edf3]"
                    >
                      <div>Input: {ex.input}</div>
                      <div>Output: {ex.output}</div>
                      {ex.explanation && (
                        <div className="text-[#8b949e] mt-2">
                          Explanation: {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="font-medium text-white text-[13px] mb-2">Constraints</p>
              <ul className="list-disc list-inside space-y-1 text-[#8b949e] text-[13px]">
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

