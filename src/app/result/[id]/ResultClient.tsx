"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import ShareResult from "@/components/ShareResult"
import { saveExamGrading } from "./actions"
import { useRouter } from "next/navigation"

export default function ResultClient({ attempt, latestRevision, baseUrl }: { attempt: any, latestRevision: any, baseUrl: string }) {
  const router = useRouter()
  const resultRef = useRef<HTMLDivElement>(null)
  
  const revisions = attempt.revisions as any[]
  const [selectedRound, setSelectedRound] = useState(latestRevision.round || 1)
  const currentRevision = revisions.find((r: any) => r.round === selectedRound) || latestRevision
  
  const round = currentRevision.round || 1
  const parsedAnswers = currentRevision.parsed_answers || { objective: [], subjective: [] }
  const answerKey = attempt.exam.answer_key as any
  const correctObj = answerKey.answers?.objective || []
  const correctSub = answerKey.answers?.subjective || []

  const objectiveCount = answerKey.objectiveCount || 0
  const subjectiveCount = answerKey.subjectiveCount || 0

  const [grading, setGrading] = useState<Record<string, "O" | "X">>(currentRevision.grading || {})
  const [isSaving, setIsSaving] = useState(false)

  React.useEffect(() => {
    setGrading(currentRevision.grading || {})
  }, [selectedRound, currentRevision])

  const handleMark = (qNum: string, mark: "O" | "X") => {
    setGrading(prev => ({ ...prev, [qNum]: mark }))
  }

  const handleMarkAll = (mark: "O" | "X") => {
    const newGrading: Record<string, "O" | "X"> = {}
    
    const objNums = answerKey.objectiveNumbers || Array.from({ length: objectiveCount }).map((_, i) => i + 1)
    const subjNums = answerKey.subjectiveNumbers || Array.from({ length: subjectiveCount }).map((_, i) => objectiveCount + i + 1)
    
    let isAllMarked = true
    
    objNums.forEach((num: number) => {
      if (grading[num.toString()] !== mark) isAllMarked = false
      newGrading[num.toString()] = mark
    })
    
    subjNums.forEach((num: number) => {
      if (grading[num.toString()] !== mark) isAllMarked = false
      newGrading[num.toString()] = mark
    })
    
    if (isAllMarked) {
      setGrading({})
    } else {
      setGrading(newGrading)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveExamGrading(attempt.id, round, grading)
      alert("채점 결과가 저장되었습니다.")
      router.refresh()
    } catch (err) {
      alert("저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate correct count
  const correctCount = Object.values(grading).filter(g => g === "O").length
  const totalQuestions = objectiveCount + subjectiveCount
  const isFullyGraded = Object.keys(grading).length === totalQuestions

  const shareUrl = "https://dapchek.igise.kro.kr"

  const renderQuestion = (qNum: number, userAnswer: string | number, correctAnswer: string) => {
    const status = grading[qNum.toString()]
    
    const handleClick = () => {
      if (!status) handleMark(qNum.toString(), "O")
      else if (status === "O") handleMark(qNum.toString(), "X")
      else {
        // Unmark
        const newGrading = { ...grading }
        delete newGrading[qNum.toString()]
        setGrading(newGrading)
      }
    }

    const baseColor = status === 'O' ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm' 
      : status === 'X' ? 'bg-red-50 border-red-400 text-red-700 shadow-sm' 
      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'

    return (
      <div 
        key={qNum} 
        onClick={handleClick}
        className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 cursor-pointer select-none transition-all ${baseColor} relative overflow-hidden`}
      >
        <span className="text-[10px] font-bold opacity-70 mb-0.5">{qNum}</span>
        <span className="font-mono font-black text-xl z-10">{userAnswer || "-"}</span>
        
        {correctAnswer && (
          <span className="text-[10px] font-bold mt-1 opacity-80 z-10">답: {correctAnswer}</span>
        )}
        
        {status === 'O' && (
          <div className="absolute inset-0 flex items-center justify-center text-blue-500 opacity-20 pointer-events-none grading-mark">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle></svg>
          </div>
        )}
        {status === 'X' && (
          <div className="absolute inset-0 flex items-center justify-center text-red-500 opacity-20 pointer-events-none grading-mark">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto h-full p-6 relative pb-20">
      {revisions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-2 pb-2">
          {revisions.map((rev: any) => (
            <button
              key={rev.round}
              onClick={() => setSelectedRound(rev.round)}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                selectedRound === rev.round 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {rev.round}회차
            </button>
          ))}
        </div>
      )}

      <div className="mt-2">
        <div 
          ref={resultRef}
          className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 p-8 flex flex-col items-center text-center"
        >
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg mb-4 title-container">{attempt.exam.subject} 영역</span>
          <h1 className="text-xl font-bold text-gray-800 mb-6 break-keep title-container">{currentRevision.customTitle || attempt.exam.title}</h1>
          
          <div className="flex items-end justify-center gap-1 mb-2 score-container">
            <span className="text-7xl font-black text-blue-600 tracking-tighter">{correctCount}</span>
            <span className="text-2xl font-bold text-gray-400 mb-2">/ {totalQuestions}</span>
          </div>
          <p className="text-gray-500 font-bold mb-8 score-container">맞은 개수</p>

          <div className="w-full text-left">
            <div className="flex justify-between items-center mb-6 exclude-from-share">
              <h3 className="text-lg font-bold text-gray-800">답안 채점 그리드</h3>
              <div className="flex gap-2">
                <button onClick={() => handleMarkAll("O")} className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200">전체 O</button>
                <button onClick={() => handleMarkAll("X")} className="text-xs font-bold bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200">전체 X</button>
              </div>
            </div>

            <div>
              {objectiveCount > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-500 mb-3">객관식</h4>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {Array.from({ length: objectiveCount }).map((_, i) => {
                      const qNum = answerKey.objectiveNumbers ? answerKey.objectiveNumbers[i] : i + 1;
                      return renderQuestion(qNum, parsedAnswers.objective[i], correctObj[i])
                    })}
                  </div>
                </div>
              )}

              {subjectiveCount > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-500 mb-3">주관식</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {Array.from({ length: subjectiveCount }).map((_, i) => {
                      const qNum = answerKey.subjectiveNumbers ? answerKey.subjectiveNumbers[i] : objectiveCount + i + 1;
                      return renderQuestion(qNum, parsedAnswers.subjective[i], correctSub[i])
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-8 bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 exclude-from-share"
            >
              {isSaving ? "저장 중..." : "채점 결과 저장하기"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ShareResult elementRef={resultRef} shareUrl={shareUrl} score={correctCount} grading={grading} />
      </div>

      <div className="mt-4 pb-10 flex flex-col gap-3">
        {totalQuestions - correctCount > 0 && isFullyGraded && selectedRound === revisions[revisions.length - 1].round && (
          <Link 
            href={`/exam/${attempt.exam.id}?retryAttemptId=${attempt.id}&retryRound=${selectedRound}`}
            className="w-full flex items-center justify-center bg-gray-800 text-white font-bold text-lg py-4 rounded-2xl shadow-md hover:bg-black active:scale-95 transition-all"
          >
            틀린 문제만 다시 풀기 ({revisions.length + 1}회차 시작)
          </Link>
        )}
        <Link 
          href={`/exam/${attempt.exam.id}?editAttemptId=${attempt.id}&editRound=${selectedRound}`}
          className="w-full flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-lg py-4 rounded-2xl hover:bg-blue-200 active:scale-95 transition-all"
        >
          오입력 수정하기 ({selectedRound}회차)
        </Link>
        <Link 
          href="/"
          className="w-full flex items-center justify-center bg-gray-100 text-gray-600 font-bold text-lg py-4 rounded-2xl hover:bg-gray-200 active:scale-95 transition-all"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </div>
  )
}
