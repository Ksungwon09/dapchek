import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { deleteAttempt } from "./actions"
import DeleteButton from "@/components/DeleteButton"

export default async function Dashboard() {
  const session = await auth()
  if (!session?.user?.id) return null

  // 사용자 이력 조회
  const attempts = await prisma.examAttempt.findMany({
    where: { userId: session.user.id },
    include: { exam: true },
    orderBy: { id: "desc" },
  })

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col gap-8 pb-20">
      <section className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
        <h2 className="text-3xl font-black mb-2 tracking-tight">새 모의고사 채점하기</h2>
        <p className="text-blue-100 mb-6 font-medium break-keep">모의고사를 풀고 바로 OMR을 입력해 채점과 오답 노트를 시작하세요.</p>
        <Link 
          href="/exam/manage" 
          className="inline-flex items-center justify-center bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 active:scale-95 transition-all shadow-sm"
        >
          + 새 채점 시작
        </Link>
      </section>

      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4">내 학습 이력</h3>
        {attempts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <span className="text-4xl block mb-3">📝</span>
            <p className="text-gray-500 font-medium">아직 채점한 모의고사가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {attempts.map((attempt) => {
              // revisions 파싱하여 최종 점수 및 회차 도출
              const revs = attempt.revisions as any[]
              const latest = revs[revs.length - 1]
              
              return (
                <div key={attempt.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between group relative">
                  <Link 
                    href={`/result/${attempt.id}`}
                    className="flex-1 block absolute inset-0 rounded-2xl z-0"
                  />
                  <div className="relative z-10 pointer-events-none">
                    <h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{latest?.customTitle || attempt.exam.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{attempt.exam.subject} 영역 • <span className="font-semibold text-blue-500">{revs.length}회차 진행 중</span></p>
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="text-right pointer-events-none">
                      <span className="block text-2xl font-black text-gray-800">
                        {latest?.correct_count ?? 0}
                        <span className="text-sm text-gray-500 font-bold ml-1">
                          / {attempt.exam.answer_key ? (attempt.exam.answer_key as any).objectiveCount + (attempt.exam.answer_key as any).subjectiveCount : 0} 맞음
                        </span>
                      </span>
                    </div>
                    <form 
                      action={async () => {
                        "use server"
                        await deleteAttempt(attempt.id)
                      }}
                    >
                      <DeleteButton 
                        onConfirmText="정말 이 학습 이력을 삭제하시겠습니까?"
                        title="이력 삭제"
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors relative z-20 pointer-events-auto block"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </DeleteButton>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
