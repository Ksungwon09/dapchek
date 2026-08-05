"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function parseRange(input: string, offset: number = 0): number[] {
  if (!input) return [];
  // if it's purely a number (like "20")
  if (/^\d+$/.test(input.trim())) {
    const count = parseInt(input.trim(), 10);
    return Array.from({ length: count }).map((_, i) => i + 1 + offset);
  }
  
  const numbers = new Set<number>();
  const parts = input.split(",");
  for (let part of parts) {
    part = part.trim();
    if (!part) continue;
    const match = part.match(/^(\d+)(?:[-~](\d+))?$/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : start;
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      for (let i = min; i <= max; i++) {
        numbers.add(i);
      }
    }
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

export async function saveCustomExam(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const id = formData.get("id") as string | null
  const title = formData.get("title") as string
  const subject = formData.get("subject") as string
  
  const objInput = formData.get("objectiveCount") as string || "0"
  const subjInput = formData.get("subjectiveCount") as string || "0"

  const objectiveNumbers = parseRange(objInput, 0)
  const objectiveCount = objectiveNumbers.length
  
  // if subjInput is a simple count, offset it by the last objective number
  const lastObj = objectiveNumbers.length > 0 ? objectiveNumbers[objectiveNumbers.length - 1] : 0;
  const subjectiveNumbers = parseRange(subjInput, /^\d+$/.test(subjInput.trim()) ? lastObj : 0)
  const subjectiveCount = subjectiveNumbers.length

  // Extract optional answer keys (allow empty strings to preserve positions)
  const objRaw = (formData.get("objectiveKeys") as string || "").trim()
  const subjRaw = (formData.get("subjectiveKeys") as string || "").trim()
  
  let objectiveKeys = objRaw ? objRaw.split(",").map(s => s.trim()) : []
  let subjectiveKeys = subjRaw ? subjRaw.split(",").map(s => s.trim()) : []
  
  // 초과 입력 방지 (slice)
  objectiveKeys = objectiveKeys.slice(0, objectiveCount)
  subjectiveKeys = subjectiveKeys.slice(0, subjectiveCount)

  if (!title || !subject) {
    throw new Error("제목과 과목을 입력해주세요.")
  }

  const payload = {
    title,
    subject,
    isSample: false,
    userId: session.user.id,
    answer_key: {
      objectiveCount,
      subjectiveCount,
      objectiveRange: objInput,
      subjectiveRange: subjInput,
      objectiveNumbers,
      subjectiveNumbers,
      answers: {
        objective: objectiveKeys,
        subjective: subjectiveKeys
      }
    }
  }

  if (id) {
    // Update existing
    const existing = await prisma.exam.findUnique({ where: { id } })
    if (existing && (existing as any).userId === session.user.id) {
      await prisma.exam.update({
        where: { id },
        data: payload
      })
    }
  } else {
    // Create new
    await prisma.exam.create({
      data: payload
    })
  }

  redirect("/exam/manage")
}

export async function deleteCustomExam(examId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const exam = await prisma.exam.findUnique({ where: { id: examId } })
  if (!exam || (exam as any).isSample || (exam as any).userId !== session.user.id) {
    throw new Error("삭제할 수 없는 시험입니다.")
  }

  await prisma.exam.delete({ where: { id: examId } })
  revalidatePath("/exam/manage")
  revalidatePath("/")
}

export async function seedSampleExams() {
  // 기존 샘플 삭제 (초기화)
  await (prisma.exam as any).deleteMany({ where: { isSample: true } })

  const samples = [
    {
      title: "수능 수학 영역 (공통+선택)",
      subject: "수학",
      isSample: true,
      answer_key: {
        objectiveCount: 22,
        subjectiveCount: 8,
        answers: {
          objective: [], // 정답 없음
          subjective: []
        }
      }
    },
    {
      title: "수능 국어 영역",
      subject: "국어",
      isSample: true,
      answer_key: {
        objectiveCount: 45,
        subjectiveCount: 0,
        answers: {
          objective: [], // 정답 없음
          subjective: []
        }
      }
    },
    {
      title: "수능 영어 영역",
      subject: "영어",
      isSample: true,
      answer_key: {
        objectiveCount: 45,
        subjectiveCount: 0,
        answers: {
          objective: [], // 정답 없음
          subjective: []
        }
      }
    },
    {
      title: "수능 탐구 영역 (과목당)",
      subject: "탐구",
      isSample: true,
      answer_key: {
        objectiveCount: 20,
        subjectiveCount: 0,
        answers: {
          objective: [], // 정답 없음
          subjective: []
        }
      }
    }
  ]

  for (const sample of samples) {
    await prisma.exam.create({
      data: sample
    })
  }
}
