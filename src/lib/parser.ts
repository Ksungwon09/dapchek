export interface ParsedAnswers {
  objective: number[] // 객관식 답안
  subjective: string[] // 서답형 답안
  isValid: boolean
  errors: string[]
}

export function parseAnswers(rawInput: string, objectiveCount: number): ParsedAnswers {
  const result: ParsedAnswers = {
    objective: [],
    subjective: [],
    isValid: true,
    errors: [],
  }

  if (!rawInput) return result

  // "." 기준으로 분할
  const parts = rawInput.split(".")
  
  // 첫 번째 파트는 객관식
  const objStr = parts[0] || ""
  if (objStr.length > 0 && objStr.length !== objectiveCount) {
    result.isValid = false
    result.errors.push(`객관식 문항 수(${objectiveCount}개)와 입력된 답안 수(${objStr.length}개)가 일치하지 않습니다.`)
  }
  
  for (let i = 0; i < objStr.length; i++) {
    result.objective.push(parseInt(objStr[i], 10))
  }

  // 두 번째 파트부터는 서답형
  for (let i = 1; i < parts.length; i++) {
    const subjAns = parts[i]
    if (subjAns.length > 3) {
      result.isValid = false
      result.errors.push(`주관식 답안은 3자리 이하의 숫자여야 합니다. (입력: ${subjAns})`)
    }
    result.subjective.push(subjAns)
  }

  return result
}
