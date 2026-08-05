import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ResultClient from "./ResultClient"
import { auth } from "@/auth"

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user?.id) return null

  const attempt = await prisma.examAttempt.findUnique({
    where: { id },
    include: { exam: true },
  })

  if (!attempt || attempt.userId !== session.user.id) return notFound()

  const revisions = attempt.revisions as any[]
  const latestRevision = revisions[revisions.length - 1]

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  return (
    <ResultClient 
      attempt={attempt} 
      latestRevision={latestRevision} 
      baseUrl={baseUrl} 
    />
  )
}
