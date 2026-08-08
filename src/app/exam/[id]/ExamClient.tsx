"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import OMRInput from "@/components/OMRInput"
import { useExamStore } from "@/store/useExamStore"
import { submitExamAttempt } from "./actions"

export default function ExamClient({ 
  examId, examTitle, examSubject, objectiveCount, subjectiveCount, hasAnswerKey, objectiveNumbers, subjectiveNumbers,
  initialValue, lockedObjectives, lockedSubjectives, editAttemptId, editRound, retryAttemptId, retryRound
}: { 
  examId: string, examTitle: string, examSubject: string, objectiveCount: number, subjectiveCount: number, hasAnswerKey?: boolean, objectiveNumbers?: number[], subjectiveNumbers?: number[],
  initialValue?: string, lockedObjectives?: boolean[], lockedSubjectives?: boolean[], editAttemptId?: string, editRound?: number, retryAttemptId?: string, retryRound?: number
}) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [customTitle, setCustomTitle] = useState(examTitle)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  const draftAnswers = useExamStore((state) => state.draftAnswers)
  const setDraftAnswer = useExamStore((state) => state.setDraftAnswer)
  const clearDraftAnswer = useExamStore((state) => state.clearDraftAnswer)

  useEffect(() => {
    if (editAttemptId || retryAttemptId) {
      setValue(initialValue || "")
    } else if (draftAnswers[examId]) {
      setValue(draftAnswers[examId])
    }
  }, [examId, editAttemptId, retryAttemptId, initialValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (val: string) => {
    setValue(val)
    setDraftAnswer(examId, val)
    setError("")
  }

  const handleSubmit = async () => {
    if (!value) {
      setError("답안을 입력해 주세요.")
      return
    }
    
    setIsSubmitting(true)
    setError("")

    try {
      const attemptId = await submitExamAttempt(examId, value, customTitle, editRound, retryRound)
      clearDraftAnswer(examId)
      router.push(`/result/${attemptId}`)
    } catch (err: any) {
      setError(err.message || "제출 중 오류가 발생했습니다.")
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError("인터넷 연결이 오프라인 상태입니다. 네트워크 연결 후 다시 시도해주세요.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto h-full p-6 relative">
      <div className="mb-6 mt-2">
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg">{examSubject}</span>
        <input 
          type="text" 
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="모의고사 이름을 입력하세요"
          className="w-full text-2xl font-black mt-3 text-gray-800 tracking-tight bg-transparent border-b-2 border-transparent focus:border-blue-300 focus:outline-none transition-colors"
        />
        <p className="text-xs text-gray-400 mt-1">※ 클릭해서 이름을 변경할 수 있습니다.</p>
      </div>

      <div className="flex-1 flex flex-col justify-start mb-10">
        <OMRInput 
          value={value} 
          onChange={handleChange} 
          disabled={isSubmitting} 
          objectiveCount={objectiveCount} 
          subjectiveCount={subjectiveCount} 
          objectiveNumbers={objectiveNumbers}
          subjectiveNumbers={subjectiveNumbers}
          lockedObjectives={lockedObjectives}
          lockedSubjectives={lockedSubjectives}
        />
        {error && (
          <p className="text-red-600 font-bold text-sm mt-6 text-center bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>
        )}
      </div>

      <div className="w-full pb-4 mt-auto">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          {isSubmitting ? "처리 중..." : (hasAnswerKey ? "답안 제출 및 채점하기" : "답안 제출")}
        </button>
      </div>
    </div>
  )
}
