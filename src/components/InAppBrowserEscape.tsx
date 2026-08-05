"use client"

import { useEffect } from "react"

export default function InAppBrowserEscape() {
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    // Kakaotalk, Line, Instagram 등 주요 인앱 브라우저를 모두 감지할 수 있지만, 카카오톡 딥링크를 명시적으로 사용.
    const isKakao = userAgent.includes("kakaotalk") || userAgent.includes("kakaostory")
    
    if (isKakao) {
      const currentUrl = window.location.href
      // 카카오 외부 브라우저 호출 스킴
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`
    }
  }, [])

  return null
}
