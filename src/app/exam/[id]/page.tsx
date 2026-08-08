import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ExamClient from "./ExamClient"

export default async function ExamPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ editAttemptId?: string, editRound?: string, retryAttemptId?: string, retryRound?: string }> }) {
  const { id } = await params
  const { editAttemptId, editRound, retryAttemptId, retryRound } = (await searchParams) || {}
  
  const exam = await prisma.exam.findUnique({
    where: { id },
  })

  if (!exam) return notFound()

  const answerKey = exam.answer_key as any
  const objectiveCount = answerKey.objectiveCount || 0
  const subjectiveCount = answerKey.subjectiveCount || 0
  const hasAnswerKey = (answerKey.answers?.objective?.length > 0) || (answerKey.answers?.subjective?.length > 0)
  
  const objectiveNumbers = answerKey.objectiveNumbers
  const subjectiveNumbers = answerKey.subjectiveNumbers

  let initialValue = ""
  let lockedObjectives: boolean[] = []
  let lockedSubjectives: boolean[] = []

  if (editAttemptId && editRound) {
    const attempt = await prisma.examAttempt.findUnique({ where: { id: editAttemptId } })
    if (attempt) {
      const revisions = attempt.revisions as any[]
      const rev = revisions.find(r => r.round === parseInt(editRound))
      if (rev) {
        initialValue = rev.raw_input || ""
      }
    }
  } else if (retryAttemptId && retryRound) {
    const attempt = await prisma.examAttempt.findUnique({ where: { id: retryAttemptId } })
    if (attempt) {
      const revisions = attempt.revisions as any[]
      const rev = revisions.find(r => r.round === parseInt(retryRound))
      if (rev && rev.parsed_answers) {
        const parsed = rev.parsed_answers
        const grading = rev.grading || {}
        
        let newObjStr = ""
        lockedObjectives = Array(objectiveCount).fill(false)
        for (let i = 0; i < objectiveCount; i++) {
          const qNum = objectiveNumbers ? objectiveNumbers[i] : i + 1
          if (grading[qNum] === "O") {
            newObjStr += parsed.objective[i] || " "
            lockedObjectives[i] = true
          } else {
            newObjStr += " "
          }
        }

        let newSubjStr = ""
        lockedSubjectives = Array(subjectiveCount).fill(false)
        for (let i = 0; i < subjectiveCount; i++) {
          const qNum = subjectiveNumbers ? subjectiveNumbers[i] : objectiveCount + i + 1
          if (grading[qNum] === "O") {
            newSubjStr += (parsed.subjective[i] || " ") + (i < subjectiveCount - 1 ? "." : "")
            lockedSubjectives[i] = true
          } else {
            newSubjStr += " " + (i < subjectiveCount - 1 ? "." : "")
          }
        }
        
        initialValue = newObjStr
        if (subjectiveCount > 0) {
          // trailing dots can be messy, but rebuildValue logic in OMRInput handles standard format
          initialValue += "." + newSubjStr
        }
      }
    }
  }

  return <ExamClient 
    examId={exam.id} 
    examTitle={exam.title} 
    examSubject={exam.subject} 
    objectiveCount={objectiveCount} 
    subjectiveCount={subjectiveCount} 
    hasAnswerKey={hasAnswerKey} 
    objectiveNumbers={objectiveNumbers}
    subjectiveNumbers={subjectiveNumbers}
    initialValue={initialValue}
    lockedObjectives={lockedObjectives}
    lockedSubjectives={lockedSubjectives}
    editAttemptId={editAttemptId}
    editRound={editRound ? parseInt(editRound) : undefined}
    retryAttemptId={retryAttemptId}
    retryRound={retryRound ? parseInt(retryRound) : undefined}
  />
}
