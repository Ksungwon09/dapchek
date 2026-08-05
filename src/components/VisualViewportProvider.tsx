"use client"

import React, { useEffect, useState } from "react"

export default function VisualViewportProvider({ children }: { children: React.ReactNode }) {
  const [viewportHeight, setViewportHeight] = useState("100vh")

  useEffect(() => {
    if (!window.visualViewport) return

    const handleResize = () => {
      setViewportHeight(`${window.visualViewport?.height}px`)
    }

    window.visualViewport.addEventListener("resize", handleResize)
    window.visualViewport.addEventListener("scroll", handleResize)
    
    // 초기 세팅
    handleResize()

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize)
      window.visualViewport?.removeEventListener("scroll", handleResize)
    }
  }, [])

  return (
    <div style={{ height: viewportHeight, width: "100%", overflow: "hidden" }} className="relative flex flex-col">
      {children}
    </div>
  )
}
