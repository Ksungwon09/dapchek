"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveExamGrading(attemptId: string, round: number, grading: Record<string, "O" | "X">) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.")

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId }
  })
  
  if (!attempt || attempt.userId !== session.user.id) {
    throw new Error("권한이 없거나 시험을 찾을 수 없습니다.")
  }

  const revisions = attempt.revisions as any[]
  const targetIndex = revisions.findIndex(r => r.round === round)
  if (targetIndex === -1) throw new Error("해당 회차를 찾을 수 없습니다.")

  // Update grading
  revisions[targetIndex].grading = grading

  // Compute correct score (맞은 개수) based on manual grading for the dashboard
  const correctCount = Object.values(grading).filter(g => g === "O").length
  revisions[targetIndex].correct_count = correctCount

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { revisions }
  })

  revalidatePath(`/result/${attemptId}`)
  revalidatePath("/")
}
