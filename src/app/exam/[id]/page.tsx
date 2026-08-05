import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ExamClient from "./ExamClient"

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
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

  return <ExamClient 
    examId={exam.id} 
    examTitle={exam.title} 
    examSubject={exam.subject} 
    objectiveCount={objectiveCount} 
    subjectiveCount={subjectiveCount} 
    hasAnswerKey={hasAnswerKey} 
    objectiveNumbers={objectiveNumbers}
    subjectiveNumbers={subjectiveNumbers}
  />
}
