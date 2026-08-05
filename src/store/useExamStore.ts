import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ExamState {
  draftAnswers: Record<string, string> 
  setDraftAnswer: (examId: string, value: string) => void
  clearDraftAnswer: (examId: string) => void
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      draftAnswers: {},
      setDraftAnswer: (examId, value) =>
        set((state) => ({
          draftAnswers: { ...state.draftAnswers, [examId]: value },
        })),
      clearDraftAnswer: (examId) =>
        set((state) => {
          const newDrafts = { ...state.draftAnswers }
          delete newDrafts[examId]
          return { draftAnswers: newDrafts }
        }),
    }),
    {
      name: "dapchek-exam-drafts",
    }
  )
)
