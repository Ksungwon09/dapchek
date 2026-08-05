"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { parseAnswers } from "@/lib/parser"

export async function submitExamAttempt(examId: string, rawInput: string, customTitle?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.")

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  })
  if (!exam) throw new Error("시험 정보를 찾을 수 없습니다.")

  const answerKey = exam.answer_key as any
  const objectiveCount = answerKey.objectiveCount || 0

  const parsed = parseAnswers(rawInput, objectiveCount)
  if (!parsed.isValid) {
    throw new Error(parsed.errors.join("\n"))
  }

  const correctObj = answerKey.answers?.objective || []
  const correctSub = answerKey.answers?.subjective || []

  // 자동 채점 진행
  const grading: Record<string, "O" | "X"> = {}
  
  if (correctObj.length > 0 || correctSub.length > 0) {
    const subjectiveCount = answerKey.subjectiveCount || 0
    const objectiveNumbers = answerKey.objectiveNumbers || Array.from({ length: objectiveCount }).map((_, i) => i + 1)
    const subjectiveNumbers = answerKey.subjectiveNumbers || Array.from({ length: subjectiveCount }).map((_, i) => objectiveCount + i + 1)
    
    // 객관식
    for (let i = 0; i < correctObj.length; i++) {
      if (!correctObj[i]) continue
      const qNum = objectiveNumbers[i]
      const userAns = parsed.objective[i] || ""
      grading[qNum.toString()] = userAns.toString() === correctObj[i].toString() ? "O" : "X"
    }
    // 주관식
    for (let i = 0; i < correctSub.length; i++) {
      if (!correctSub[i]) continue
      const qNum = subjectiveNumbers[i]
      const userAns = parsed.subjective[i] || ""
      grading[qNum.toString()] = userAns.toString() === correctSub[i].toString() ? "O" : "X"
    }
  }

  // 채점 데이터 저장
  const newRevision = {
    round: 1,
    customTitle,
    raw_input: rawInput,
    parsed_answers: parsed,
    grading: grading,
    submitted_at: new Date().toISOString()
  }

  // 기존 시도가 있는지 확인 (N회차 처리) - 샘플(프리셋)은 항상 새로 생성하도록 isSample 확인
  let existingAttempt = null;
  if (!(exam as any).isSample) {
    existingAttempt = await prisma.examAttempt.findFirst({
      where: { userId: session.user.id, examId },
    })
  }

  let attemptId = ""

  if (existingAttempt) {
    const revisions = existingAttempt.revisions as any[]
    newRevision.round = revisions.length + 1
    
    await prisma.examAttempt.update({
      where: { id: existingAttempt.id },
      data: { revisions: [...revisions, newRevision as any] }
    })
    attemptId = existingAttempt.id
  } else {
    const attempt = await prisma.examAttempt.create({
      data: {
        userId: session.user.id,
        examId,
        revisions: [newRevision as any]
      }
    })
    attemptId = attempt.id
  }

  return attemptId
}
