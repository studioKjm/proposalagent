# Proposal Agent - 크몽 견적서 작성 AI 에이전트

## 프로젝트 개요
크몽, 위시켓 등 프리랜서 마켓플레이스에서 IT 개발 프로젝트 수주를 위한 전문 견적서를 자동 생성하는 AI 에이전트입니다.

## 핵심 기능
1. **요구사항 분석**: RFP/프로젝트 설명 분석 및 핵심 요구사항 추출
2. **공수 산정**: SW기술자 평균임금 기준 M/M 계산
3. **견적서 작성**: 전문적인 견적서 자동 생성
4. **PDF 출력**: 크몽 제출용 PDF 파일 생성

## 디렉토리 구조
```
proposalagent/
├── .claude/
│   ├── agents/           # AI 에이전트 정의
│   │   ├── analyzer-agent.md
│   │   ├── estimator-agent.md
│   │   └── writer-agent.md
│   ├── skills/           # 스킬 정의
│   │   ├── proposal-skill/
│   │   └── pdf-skill/
│   └── commands/         # 사용자 커맨드
│       └── proposal.md
├── src/
│   ├── data/            # 데이터 (SW임금, 세금율)
│   ├── templates/       # HTML 템플릿
│   └── utils/           # 유틸리티 함수
└── output/              # 생성된 견적서
```

## 사용법

### 대화형 견적서 생성
```
/proposal
```

### RFP 파일 기반 생성
```
/proposal --file [RFP파일경로]
```

### 직접 정보 입력
```
/proposal --project "쇼핑몰 앱 개발" --platform "React Native" --duration "3개월"
```

## 에이전트 파이프라인
```
사용자 입력 → Analyzer Agent → Estimator Agent → Writer Agent → PDF Skill → 견적서
```

## 주요 데이터 소스
- **SW기술자 평균임금**: 한국소프트웨어산업협회 2024년 기준
- **세금 계산**: VAT 10%, 원천세 3.3%

## 크몽 견적서 작성 규칙 (필수 준수)

### 1. 개인정보 제외 (크몽 정책)
- **연락처 기입 금지**: 전화번호, 이메일 등 외부 연락처 절대 포함 금지
- **사업자번호 제외**: 사업자등록번호 기입 금지
- 위반 시 크몽 정책 위반으로 불이익 발생

### 2. 금액 표기
- **총액은 깔끔한 정수로 표시**: 수수료, VAT 등 세부 내역 제외
- 예: "300만원", "500만원" (O) / "2,727,273원 + VAT" (X)
- 크몽 수수료는 플랫폼에서 자동 처리되므로 견적서에 포함하지 않음

### 3. 결제 조건
- **크몽 안전결제 사용**: 중개 플랫폼 결제 구조
- 의뢰인이 크몽에 결제 → 작업 완료 후 전문가가 대금 수령
- 계약금/중도금/잔금 분할은 크몽 마일스톤 기능 활용

### 4. 공급자 정보
- **크몽 닉네임 사용**: 코딩하는핑크빈
- 실명, 회사명 대신 크몽 활동명 사용

### 5. 개발자 소개 섹션 (필수 포함)
- **프로젝트 필수 기술**: PHP, MySQL, CSS, HTML5, Figma, ReactJS
- **경력 표시**: PHP + WordPress 환경의 웹페이지 외주 프로젝트 진행 경험 보유
- **보유 기술 스택 (요약 표시)**:
  - Backend: Python, Django, DRF, Java, Spring Boot, WebSocket, Celery, asyncio
  - Database: PostgreSQL, Redis, MySQL
  - Frontend: Next.js, React, Tailwind
  - DevOps: Docker, AWS EC2/Nginx, Blue-Green 배포, GitHub Actions
  - Tools: GitHub, Claude Code, Cursor Editor, Figma, Streamlit, Notion
- 견적서에 개발자 소개 섹션을 추가하여 신뢰도 향상

## 확장 가능 영역
- [ ] 디자인 분야 템플릿 추가
- [ ] 마케팅/콘텐츠 분야 템플릿 추가
- [ ] 크몽 API 연동 (자동 제출)
- [ ] 포트폴리오 자동 첨부
- [ ] 다국어 견적서 지원
