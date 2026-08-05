"use client"

import React, { useCallback, useState } from "react"
import { toBlob } from "html-to-image"

export default function ShareResult({ 
  elementRef, 
  shareUrl, 
  score,
  grading
}: { 
  elementRef: React.RefObject<HTMLElement | null>, 
  shareUrl: string, 
  score: number,
  grading?: Record<string, "O" | "X">
}) {
  const [includeGrading, setIncludeGrading] = useState(true)
  const [includeScore, setIncludeScore] = useState(true)
  const [includeTitle, setIncludeTitle] = useState(true)

  const handleShare = useCallback(async () => {
    if (!elementRef.current) return

    let offscreen: HTMLDivElement | null = null;
    
    try {
      // Create a clone to manipulate safely without screen flickering
      const clone = elementRef.current.cloneNode(true) as HTMLElement
      
      // Remove excluded elements completely from the clone
      if (!includeScore) clone.querySelectorAll('.score-container').forEach(el => el.remove())
      if (!includeTitle) clone.querySelectorAll('.title-container').forEach(el => el.remove())
      if (!includeGrading) clone.querySelectorAll('.grading-mark').forEach(el => el.remove())
      clone.querySelectorAll('.exclude-from-share').forEach(el => el.remove())

      // Create an offscreen wrapper that matches the exact width to preserve text wrapping
      offscreen = document.createElement("div")
      offscreen.style.position = "absolute"
      offscreen.style.left = "-9999px"
      offscreen.style.top = "0"
      offscreen.style.width = elementRef.current.offsetWidth + "px"
      
      offscreen.appendChild(clone)
      document.body.appendChild(offscreen)

      // Wait a tiny bit for the browser to compute the new tight layout
      await new Promise(r => setTimeout(r, 50))

      const blob = await toBlob(clone, { 
        cacheBust: true, 
        style: { background: "white", margin: "0" } 
      })
      
      if (!blob) throw new Error("Failed to create image")

      const file = new File([blob], "result.png", { type: "image/png" })
      
      const shareText = includeGrading 
        ? `답쳌(Dapchek)에서 모의고사 정답과 채점 결과를 공유합니다! (${score}개 정답)`
        : `답쳌(Dapchek)에서 모의고사 답안을 공유합니다!`

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Dapchek 답안 공유",
          text: shareText,
          url: shareUrl,
        })
      } else {
        alert("네이티브 공유 기능을 지원하지 않는 기기입니다. 결과 링크가 복사되었습니다.")
        navigator.clipboard.writeText(shareUrl)
      }
    } catch (err) {
      console.error(err)
      alert("이미지 생성 중 오류가 발생했습니다.")
    } finally {
      if (offscreen && document.body.contains(offscreen)) {
        document.body.removeChild(offscreen)
      }
    }
  }, [elementRef, shareUrl, score, includeGrading, includeScore, includeTitle])

  return (
    <div className="flex flex-col items-center gap-3 mt-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={includeGrading} 
            onChange={(e) => setIncludeGrading(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm font-bold text-gray-700">채점 결과(O/X)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={includeScore} 
            onChange={(e) => setIncludeScore(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm font-bold text-gray-700">맞은 개수</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={includeTitle} 
            onChange={(e) => setIncludeTitle(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm font-bold text-gray-700">시험 제목</span>
        </label>
      </div>
      <button 
        onClick={handleShare}
        className="w-full px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
      >
        답안 이미지 공유하기 🚀
      </button>
    </div>
  )
}
