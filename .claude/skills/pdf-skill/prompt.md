# PDF Skill - HTML to PDF 변환 스킬

## 개요
HTML 파일을 크몽 제출용 PDF 파일로 변환합니다.

## 사용법

### 기본 사용
proposal-skill에서 자동으로 호출됩니다.

### 직접 변환
```bash
node src/utils/html2pdf.js [HTML파일경로] [출력PDF경로]
```

## 변환 옵션

### 기본 설정
- **용지 크기**: A4 (210mm x 297mm)
- **여백**: 15mm (상하좌우)
- **배경 인쇄**: 활성화
- **스케일**: 1.0

### 최적화
- 크몽 첨부 제한: 10MB 이하
- 이미지 압축 적용
- 웹 폰트 임베딩

## 의존성

### Playwright 설치
```bash
npm install playwright
npx playwright install chromium
```

## 출력

### 성공 시
```
✅ PDF 변환 완료
📄 파일: output/proposal-xxx.pdf
📦 크기: 245KB
```

### 실패 시
```
❌ PDF 변환 실패
원인: [오류 메시지]
해결: [해결 방법]
```

## 주의사항

1. **첫 실행 시**: Chromium 브라우저 다운로드 필요 (약 200MB)
2. **한글 폰트**: 시스템에 한글 폰트 필요 (Noto Sans KR 권장)
3. **메모리**: 대용량 HTML 변환 시 메모리 주의
