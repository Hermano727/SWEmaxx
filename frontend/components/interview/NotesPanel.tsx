import { ChevronDown, ChevronUp } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface NotesPanelProps {
  notes: string
  notesCollapsed: boolean
  onToggleCollapsed: () => void
  onChangeNotes: (value: string) => void
  onNotesKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export function NotesPanel({
  notes,
  notesCollapsed,
  onToggleCollapsed,
  onChangeNotes,
  onNotesKeyDown,
}: NotesPanelProps) {
  return (
    <div className="border-t border-[#30363d] bg-[#0d1117] flex flex-col">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="px-4 pt-3 pb-2 flex items-center justify-between hover:bg-[#0d1117]"
        aria-expanded={!notesCollapsed}
      >
        <p className="text-xs font-medium text-[#c9d1d9]">
          Notes{" "}
          <span className="ml-1 text-[11px] font-normal text-[#6e7681]">
            Optional – leaving this empty will not affect your score.
          </span>
        </p>
        {notesCollapsed ? (
          <ChevronUp className="h-4 w-4 text-[#8b949e]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#8b949e]" />
        )}
      </button>
      {!notesCollapsed && (
        <div className="px-4 pb-3">
          <Textarea
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            onKeyDown={onNotesKeyDown}
            className="w-full h-28 bg-[#1a1d23] border border-[#30363d] text-white resize-none rounded-md focus-visible:ring-2 focus-visible:ring-[#46a758] focus-visible:ring-offset-0 focus-visible:ring-offset-[#0d1117] placeholder:text-[#6e7681]"
            placeholder="Write your thoughts, draw diagrams, plan your approach..."
          />
        </div>
      )}
    </div>
  )
}

