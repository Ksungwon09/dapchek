import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { saveCustomExam, deleteCustomExam, seedSampleExams } from "./actions"
import DeleteButton from "@/components/DeleteButton"

export default async function ManageExamsPage(
  props: { searchParams?: Promise<{ editId?: string }> }
) {
  const searchParams = await props.searchParams
  const editId = searchParams?.editId
  
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  let exams = await prisma.exam.findMany({
    where: {
      OR: [
        { isSample: true },
        { userId: session.user.id }
      ]
    } as any,
    orderBy: { id: "asc" }
  })

  // If no samples exist, auto-seed them (useful for fresh DBs)
  if (!exams.some((e: any) => (e as any).isSample)) {
    await seedSampleExams()
    exams = await prisma.exam.findMany({
      where: { OR: [{ isSample: true }, { userId: session.user.id }] } as any,
      orderBy: { id: "asc" }
    })
  }

  const samples = exams.filter((e: any) => (e as any).isSample)
  const customs = exams.filter((e: any) => !(e as any).isSample)
  
  let editExam = null
  if (editId) {
    editExam = customs.find((c: any) => c.id === editId)
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col gap-8 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tight">모의고사 관리</h2>
        <Link href="/" className="text-gray-500 hover:text-gray-800 font-medium">← 홈으로</Link>
      </div>

      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4">기본 제공 샘플</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {samples.map((exam: any) => (
            <div key={exam.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-gray-800 text-lg">{exam.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{exam.subject} 영역</p>
                <p className="text-xs text-gray-400 mt-2">
                  객관식 {(exam.answer_key as any).objectiveCount}문항 / 주관식 {(exam.answer_key as any).subjectiveCount}문항
                </p>
              </div>
              <Link 
                href={`/exam/${exam.id}`} 
                className="mt-4 text-center bg-blue-50 text-blue-600 font-bold py-2 rounded-xl hover:bg-blue-100 transition-colors"
              >
                선택하여 채점하기
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4">내 커스텀 시험</h3>
        {customs.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mb-6">
            <p className="text-gray-500 font-medium">직접 추가한 시험이 없습니다.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {customs.map((exam: any) => (
              <div key={exam.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between relative group">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{exam.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{exam.subject} 영역</p>
                  <p className="text-xs text-gray-400 mt-2">
                    객관식 {(exam.answer_key as any).objectiveCount}문항 / 주관식 {(exam.answer_key as any).subjectiveCount}문항
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link 
                    href={`/exam/${exam.id}`} 
                    className="flex-1 text-center bg-blue-50 text-blue-600 font-bold py-2 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    선택
                  </Link>
                  <Link 
                    href={`/exam/manage?editId=${exam.id}`} 
                    className="px-4 bg-gray-100 text-gray-600 font-bold py-2 rounded-xl hover:bg-gray-200 transition-colors text-center flex items-center justify-center"
                  >
                    수정
                  </Link>
                  <form action={async () => {
                    "use server"
                    await deleteCustomExam(exam.id)
                  }}>
                    <DeleteButton 
                      onConfirmText="이 모의고사를 정말 삭제하시겠습니까?"
                      className="px-4 bg-red-50 text-red-500 font-bold py-2 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      삭제
                    </DeleteButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-sm mt-4" id="edit-form">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg text-gray-800">
              {editExam ? "시험 수정하기" : "새 시험 추가하기"}
            </h4>
            {editExam && (
              <Link href="/exam/manage" className="text-sm text-gray-500 hover:text-gray-700 font-bold">취소</Link>
            )}
          </div>
          
          <form key={editExam ? editExam.id : "new"} action={saveCustomExam} className="flex flex-col gap-4">
            {editExam && <input type="hidden" name="id" value={editExam.id} />}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">시험 제목</label>
                <input required type="text" name="title" defaultValue={editExam?.title || ""} placeholder="예: 3월 모의고사" className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">과목명</label>
                <input required type="text" name="subject" defaultValue={editExam?.subject || ""} placeholder="예: 생명과학 I" className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">객관식 문항 수 또는 범위</label>
                <input required type="text" name="objectiveCount" defaultValue={editExam ? ((editExam.answer_key as any)?.objectiveRange || (editExam.answer_key as any)?.objectiveCount || 20) : "20"} placeholder="예: 20 또는 1-15, 20-30" className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">주관식 문항 수 또는 범위</label>
                <input required type="text" name="subjectiveCount" defaultValue={editExam ? ((editExam.answer_key as any)?.subjectiveRange || (editExam.answer_key as any)?.subjectiveCount || 0) : "0"} placeholder="예: 5 또는 21-25" className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">객관식 정답 (선택)</label>
              <input type="text" name="objectiveKeys" defaultValue={editExam ? ((editExam.answer_key as any).answers?.objective || []).join(", ") : ""} placeholder="예: 1, 3, 2, 5 (쉼표 구분)" className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">주관식 정답 (선택)</label>
              <input type="text" name="subjectiveKeys" defaultValue={editExam ? ((editExam.answer_key as any).answers?.subjective || []).join(", ") : ""} placeholder="예: 15, 23 (쉼표 구분)" className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <button type="submit" className={`w-full font-bold py-3 rounded-xl mt-2 transition-colors ${editExam ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
              {editExam ? "수정 완료" : "추가하기"}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
