"use client"

import { useState } from "react"
import { Home, Settings, Clock, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

interface InterviewNavbarProps {
  timeRemaining?: number
  formatTime: (seconds: number) => string
  onPause?: () => void
  onExit?: () => void
  isVisible: boolean
  onToggleVisibility: (visible: boolean) => void
}

export default function InterviewNavbar({
  timeRemaining,
  formatTime,
  onPause,
  onExit,
  isVisible,
  onToggleVisibility,
}: InterviewNavbarProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [fontSize, setFontSize] = useState("medium")
  const [darkMode, setDarkMode] = useState(true)
  const [hintsEnabled, setHintsEnabled] = useState(true)

  return (
    <>
      <div className="bg-[#1a1d23] border-b border-[#30363d] px-6 py-4">
        <div className="flex items-center justify-between max-w-full">
          {/* Left: Home Icon */}
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#30363d]">
              <Home className="h-5 w-5" />
            </Button>
          </Link>

          {/* Center: Timer with collapse button */}
          {timeRemaining !== undefined && (
            <div className="flex items-center justify-center flex-1">
              {isVisible ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-white font-mono text-lg">
                    <Clock className="h-5 w-5" />
                    <span className={timeRemaining < 300 ? "text-red-400" : ""}>{formatTime(timeRemaining)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleVisibility(false)}
                    className="text-gray-400 hover:text-white hover:bg-[#30363d]"
                    title="Hide timer"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleVisibility(true)}
                  className="text-gray-400 hover:text-white hover:bg-[#30363d] px-3 py-1 rounded-full text-xs flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  <span>Show timer</span>
                </Button>
              )}
            </div>
          )}

          {/* Right: Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-white hover:bg-[#30363d]"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-[#1a1d23] border-[#30363d] max-w-md w-full">
            <CardHeader className="border-b border-[#30363d]">
              <CardTitle className="text-white">Interview Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Pause Interview */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Pause Interview</div>
                  <div className="text-sm text-gray-400">Take a break</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPause}
                  className="border-[#30363d] text-gray-300 hover:text-white bg-transparent"
                >
                  Pause
                </Button>
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Font Size</div>
                  <div className="text-sm text-gray-400">Adjust text size</div>
                </div>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger className="w-[120px] bg-[#0d1117] border-[#30363d] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d23] border-[#30363d]">
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Dark Mode</div>
                  <div className="text-sm text-gray-400">Toggle theme</div>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              {/* Enable/Disable Hints */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Enable Hints</div>
                  <div className="text-sm text-gray-400">Show hint button</div>
                </div>
                <Switch checked={hintsEnabled} onCheckedChange={setHintsEnabled} />
              </div>

              {/* Emergency Exit */}
              <div className="pt-4 border-t border-[#30363d]">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowSettings(false)
                    onExit?.()
                  }}
                  className="w-full"
                >
                  Emergency Exit
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">Progress will not be saved</p>
              </div>

              {/* Close Button */}
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
                className="w-full border-[#30363d] text-gray-300 hover:text-white"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
