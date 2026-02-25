"use client"

import dynamic from "next/dynamic"

import type { EditorLanguage } from "@/lib/constants/questions"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
})

interface InterviewCodeEditorProps {
  language: EditorLanguage
  value: string
  onChange: (value: string) => void
}

export default function CodeEditor({ language, value, onChange }: InterviewCodeEditorProps) {
  const monacoLanguage = language === "cpp" ? "cpp" : language

  return (
    <div className="h-full w-full rounded-md border border-[#30363d] bg-[#0b1015] overflow-hidden">
      <MonacoEditor
        language={monacoLanguage}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily:
            '"Geist Mono","SFMono-Regular",ui-monospace,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
          lineHeight: 22,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          automaticLayout: true,
          overviewRulerLanes: 0,
          renderLineHighlight: "line",
          tabSize: 4,
          wordWrap: "on",
        }}
      />
    </div>
  )
}

