# 크몽 견적서 생성

IT 개발 프로젝트의 전문 견적서를 생성합니다.

## 실행 단계

### 1단계: 프로젝트 정보 수집

다음 정보를 사용자에게 질문하세요:

1. **프로젝트 유형** (필수)
   - 웹 개발 (웹사이트, 웹 애플리케이션)
   - 모바일 앱 (iOS, Android, 크로스플랫폼)
   - 풀스택 (웹 + 백엔드)
   - 유지보수 (기존 시스템 개선)

2. **프로젝트명 및 설명** (필수)
   - 예: "헬스케어 예약 앱 - 운동 프로그램 예약 및 결제 앱"

3. **주요 기능** (필수)
   - 예: 회원가입/로그인, 예약 시스템, 결제 연동

4. **예상 기간** (필수)
   - 1개월 미만 / 1~2개월 / 2~3개월 / 3~6개월 / 6개월 이상

5. **클라이언트 정보** (선택)
   - 회사명, 담당자명, 연락처

### 2단계: 비용 산정

`src/data/sw-wage-2024.json`의 SW기술자 평균임금을 기준으로 M/M(Man-Month)를 계산합니다.

프로젝트 유형별 기본 팀 구성:
- **웹 개발**: PM(0.3), 기획(0.3), 디자이너(0.5), 프론트엔드(1.0), 백엔드(0.5)
- **모바일 앱**: PM(0.3), 기획(0.3), 디자이너(0.5), 모바일(1.5), 백엔드(1.0)
- **풀스택**: PM(0.3), 기획(0.3), 디자이너(0.5), 풀스택(1.5)

### 3단계: 견적서 생성

다음 코드를 실행하여 견적서를 생성합니다:

```javascript
import { generateProposal } from './src/index.js';

const projectInfo = {
  projectName: '{프로젝트명}',
  projectDescription: '{프로젝트 설명}',
  clientName: '{클라이언트 회사명}',
  clientContact: '{담당자명}',
  duration: {기간(월)},
  projectType: '{web|mobile|fullstack|maintenance}',
  team: [
    // 프로젝트 유형에 맞는 팀 구성
  ]
};

const result = await generateProposal(projectInfo);
```

### 4단계: 결과 출력

생성된 견적서 정보를 다음 형식으로 출력:

```
견적서 생성 완료!

프로젝트 정보
   프로젝트명: {프로젝트명}
   유형: {프로젝트 유형}
   기간: {기간}

견적 금액
   공급가액: {공급가액}원
   부가세: {VAT}원
   합계: {총액}원 (VAT 포함)

결제 조건
   계약금 30%: {금액}원 (계약 체결 시)
   중도금 40%: {금액}원 (중간 산출물 확인 후)
   잔금 30%: {금액}원 (최종 납품 후)

생성된 파일
   HTML: output/proposal-{프로젝트명}-{날짜}.html
   PDF: output/proposal-{프로젝트명}-{날짜}.pdf
   JSON: output/proposal-{프로젝트명}-{날짜}.json
```

## 참고 파일

- 계산 로직: `src/utils/calculator.js`
- 검증 로직: `src/utils/validator.js`
- HTML 템플릿: `src/templates/proposal-template.html`
- SW 임금 데이터: `src/data/sw-wage-2024.json`
- 세금 정보: `src/data/tax-rates.json`

## 수정 요청 처리

사용자가 수정을 요청하면:
- "금액 낮춰줘" → 할인율 조정 후 재생성
- "기간 늘려줘" → duration 조정 후 재생성
- "인원 추가해줘" → team 배열에 역할 추가 후 재생성

$ARGUMENTS
