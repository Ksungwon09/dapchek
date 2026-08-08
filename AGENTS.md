<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🤖 Agent Workspace & Project Documentation (Dapchek)

이 문서는 Dapchek 프로젝트의 유지보수 및 인수인계를 위해 AI 에이전트들이 읽고 지속적으로 관리해야 하는 핵심 컨텍스트 가이드입니다. 

## 📌 AGENTS.md 관리 원칙 (모든 에이전트 필독)
1. **간결성 유지**: 새로운 사실을 추가할 때는 장황한 설명 대신 핵심 내용과 해결책(코드 조각) 위주로 간결하게 기록합니다.
2. **최신화**: 프로젝트의 아키텍처가 변경되거나, 이전에 기록된 이슈가 근본적으로 해결되어 더 이상 신경 쓰지 않아도 된다면 해당 항목을 과감히 삭제/수정하여 문서가 불필요하게 길어지는 것을 방지합니다.
3. **카테고리 분류**: 내용 추가 시 아키텍처, 알려진 이슈 및 우회법, 배포 환경 등으로 분류하여 작성합니다.
4. **시행착오 기록**: 특정 기술적 결정이나 에러 해결에 오랜 시간이 걸렸다면(예: 서버 환경변수 설정, 라이브러리 충돌 등), 동일한 실수를 반복하지 않도록 그 원인과 해결법을 명시합니다.

---

## 🏗️ 아키텍처 및 기술 스택
- **Framework**: Next.js (App Router 기반)
- **DB & ORM**: MySQL, Prisma ORM
- **Auth**: NextAuth (Auth.js v5) - Google Provider
- **Styling**: Tailwind CSS
- **Features**: 
  - OMR 카드 형태의 커스텀 시험 생성 및 자동 채점
  - `html-to-image`를 활용한 동적 성적표 이미지 캡처 및 공유

## ⚠️ 알려진 이슈 및 주요 시행착오 (Troubleshooting)

### 1. Prisma & Server Actions 타입 이슈
- **문제**: Server Action에서 DB 데이터를 조회하여 클라이언트 컴포넌트로 전달할 때, Prisma의 `InputJsonValue` 타입 등이 직렬화(Serialization) 과정에서 Next.js의 엄격한 타입 검사와 충돌하여 빌드 에러가 발생함. (예: `ParsedAnswers` 타입)
- **해결책**: `actions.ts` 등에서 DB에 데이터를 Insert/Update 할 때 `as any`로 캐스팅하여 우회함. Prisma 스키마 업데이트 시 직렬화 가능한 타입 처리에 유의할 것.

### 2. NextAuth (Auth.js v5) 배포 환경 설정 (UntrustedHost 에러)
- **문제**: 배포 서버에서 리버스 프록시(Caddy 등)를 통해 HTTPS를 연동했을 때, 구글 로그인 시 `UntrustedHost` 에러 발생.
- **해결책**: 
  - 서버의 `.env` 파일에 `AUTH_TRUST_HOST=true`를 반드시 추가할 것.
  - 리다이렉트 URL 문제 방지를 위해 `NEXTAUTH_URL` 환경 변수를 프록시 도메인(예: `https://dapchek.igise.kro.kr`)으로 명시적으로 지정할 것.

### 3. 이미지 캡처 (`html-to-image`) 기능 최적화
- **문제**: 결과 공유 시 사용자 선택(점수 포함 여부, 타이틀 포함 여부)에 따라 특정 UI 요소만 숨기고 이미지를 캡처해야 함.
- **해결책**: 대상 노드들에 `className`(예: `exclude-from-share`, `score-container`)을 부여하고, `html-to-image`의 `filter` 옵션을 사용해 해당 클래스를 가진 DOM 노드일 경우 렌더링에서 제외하도록 구현함. 

## 🚀 배포 환경 (Deployment)
- **서버 IP**: `155.248.219.159` (Ubuntu)
- **도메인**: `https://dapchek.igise.kro.kr`
- **웹 서버 (Reverse Proxy)**: Caddy (Host Network로 구동 중)가 도메인을 받아 내부의 `localhost:3001` 포트로 포워딩하고, ZeroSSL을 통해 HTTPS 인증서를 자동 갱신함.
- **애플리케이션 구동**: Docker를 활용 (`dapchek_app` 이미지, 컨테이너명: `dapchek`)
- **Docker 팁**: 
  - 런타임 환경변수(NEXTAUTH_URL 등)를 변경할 때는 컨테이너 내부의 `.env`는 빌드 시점에 복사된 구버전이므로, `docker run` 시 반드시 `--env-file .env` 플래그를 사용하여 호스트의 최신 환경변수를 주입해야 함.
  - 빌드 시 `package-lock.json` 동기화 문제로 `npm ci`가 실패한 이력이 있으므로, Dockerfile에서는 `npm install`을 사용 중임.
