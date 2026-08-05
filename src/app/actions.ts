"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function deleteAttempt(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const attempt = await prisma.examAttempt.findUnique({ where: { id } })
  if (!attempt || attempt.userId !== session.user.id) {
    throw new Error("삭제할 수 없습니다.")
  }

  await prisma.examAttempt.delete({ where: { id } })
  revalidatePath("/")
}
