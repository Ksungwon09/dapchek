"use client"

import React, { useRef } from "react"

interface OMRInputProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  objectiveCount: number
  subjectiveCount: number
  objectiveNumbers?: number[]
  subjectiveNumbers?: number[]
  lockedObjectives?: boolean[]
  lockedSubjectives?: boolean[]
}

export default function OMRInput({ 
  value, onChange, disabled, objectiveCount, subjectiveCount, 
  objectiveNumbers, subjectiveNumbers, lockedObjectives, lockedSubjectives 
}: OMRInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Fallbacks if numbers aren't provided
  const objNums = objectiveNumbers || Array.from({ length: objectiveCount }).map((_, i) => i + 1)
  const subjNums = subjectiveNumbers || Array.from({ length: subjectiveCount }).map((_, i) => objectiveCount + i + 1)

  const isAnyLocked = (lockedObjectives?.some(l => l) || lockedSubjectives?.some(l => l))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/,/g, ".")
    val = val.replace(/[^0-9. ]/g, "")
    
    // 초과 입력 방지
    const parts = val.split(".")
    if (parts[0].length > objectiveCount) {
      parts[0] = parts[0].substring(0, objectiveCount)
    }
    
    // 주관식 항목들 최대 3자리 제한
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].length > 3) {
        parts[i] = parts[i].substring(0, 3)
      }
    }

    if (parts.length > subjectiveCount + 1) {
      parts.splice(subjectiveCount + 1)
    }
    
    onChange(parts.join("."))
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 300)
  }

  // Parse current value for visual grid
  let parsedObjectives: string[] = []
  let parsedSubjectives: string[] = []
  
  if (value.includes(".")) {
    const parts = value.split(".")
    parsedObjectives = parts[0].split("")
    parsedSubjectives = parts.slice(1)
  } else {
    parsedObjectives = value.split("")
  }

  const rebuildValue = (objs: string[], subjs: string[]) => {
    const objStr = objs.map(c => c || " ").join("")
    
    if (subjectiveCount > 0 && (subjs.length > 0 || value.includes("."))) {
      const subjStr = subjs.map(s => s || " ").join(".")
      onChange(objStr + (value.includes(".") || subjStr.trim() ? "." + subjStr : ""))
    } else {
      onChange(objStr)
    }
  }

  const handleObjectiveGridChange = (index: number, newChar: string) => {
    if (lockedObjectives?.[index]) return;
    const safeChar = newChar.replace(/[^0-9 ]/g, "").slice(-1)
    const newObjs = [...parsedObjectives]
    while (newObjs.length <= index) newObjs.push(" ")
    newObjs[index] = safeChar || " "
    rebuildValue(newObjs, parsedSubjectives)
  }

  const handleSubjectiveGridChange = (index: number, newStr: string) => {
    if (lockedSubjectives?.[index]) return;
    const safeStr = newStr.replace(/[^0-9 ]/g, "").slice(0, 3) 
    const newSubjs = [...parsedSubjectives]
    while (newSubjs.length <= index) newSubjs.push(" ")
    newSubjs[index] = safeStr || " "
    rebuildValue(parsedObjectives, newSubjs)
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <label className="block text-sm font-bold text-gray-700 mb-2">빠른 답안 입력</label>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          disabled={disabled || isAnyLocked}
          placeholder={isAnyLocked ? "재풀이 시에는 아래 그리드를 이용해주세요" : "객관식(연속) . 주관식(.)"}
          className="w-full h-14 text-2xl tracking-[0.2em] text-center bg-gray-50 border-2 border-blue-400 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-mono shadow-inner disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-400 disabled:tracking-normal"
        />
        {!isAnyLocked && (
          <p className="text-center text-xs text-gray-500 mt-2">
            예: 1번 3, 2번 4 ➔ 34 / 주관식 구분은 마침표(.)
          </p>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">답안 확인 및 수정 그리드</h3>
        
        {objectiveCount > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 mb-2">객관식 ({objectiveCount}문항)</h4>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: objectiveCount }).map((_, i) => {
                const ans = parsedObjectives[i] || ""
                const isLocked = lockedObjectives?.[i]
                const baseClass = isLocked 
                  ? 'bg-gray-100 border-gray-300 opacity-70' 
                  : ans ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                
                return (
                  <div key={`obj-${i}`} className={`flex flex-col items-center justify-center p-1 rounded-lg border focus-within:ring-2 focus-within:ring-blue-400 ${baseClass}`}>
                    <span className="text-[10px] font-bold text-gray-500 mb-0.5">{objNums[i]}</span>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={ans}
                      onChange={(e) => handleObjectiveGridChange(i, e.target.value)}
                      disabled={disabled || isLocked}
                      className={`w-full text-center font-mono font-bold text-lg bg-transparent outline-none ${isLocked ? 'text-gray-500' : ans ? 'text-blue-700' : 'text-gray-400'}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {subjectiveCount > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-500 mb-2">주관식 ({subjectiveCount}문항)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Array.from({ length: subjectiveCount }).map((_, i) => {
                const ans = parsedSubjectives[i] || ""
                const isLocked = lockedSubjectives?.[i]
                const baseClass = isLocked 
                  ? 'bg-gray-100 border-gray-300 opacity-70' 
                  : ans ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'

                return (
                  <div key={`subj-${i}`} className={`flex flex-col items-center justify-center p-1 rounded-lg border focus-within:ring-2 focus-within:ring-green-400 ${baseClass}`}>
                    <span className="text-[10px] font-bold text-gray-500 mb-0.5">{subjNums[i]}</span>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={ans}
                      onChange={(e) => handleSubjectiveGridChange(i, e.target.value)}
                      disabled={disabled || isLocked}
                      className={`w-full text-center font-mono font-bold text-lg bg-transparent outline-none ${isLocked ? 'text-gray-500' : ans ? 'text-green-700' : 'text-gray-400'}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
