/**
 * Proposal Agent - 메인 엔트리 포인트
 *
 * 크몽/위시켓 견적서 자동 생성 시스템
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import calculator from './utils/calculator.js';
import validator from './utils/validator.js';
import { convertHTMLStringToPDF } from './utils/html2pdf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 견적서 생성 메인 함수
 * @param {object} input - 입력 데이터
 * @returns {Promise<object>} 생성 결과
 */
export async function generateProposal(input) {
  console.log('🚀 견적서 생성 시작...\n');

  // 1. 입력 데이터 검증 및 기본값 적용
  const data = prepareData(input);

  // 2. 비용 계산
  const estimate = calculateEstimate(data);

  // 3. 견적서 데이터 구성
  const proposalData = buildProposalData(data, estimate);

  // 4. 데이터 검증
  const validation = validator.validateProposal(proposalData);
  if (!validation.valid) {
    console.error('❌ 검증 실패:', validation.errors);
    throw new Error('견적서 데이터 검증 실패: ' + validation.errors.join(', '));
  }
  if (validation.warnings.length > 0) {
    console.warn('⚠️ 경고:', validation.warnings);
  }

  // 5. HTML 생성
  const html = renderHTML(proposalData);

  // 6. 파일 저장
  const outputDir = join(__dirname, '../output');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = data.projectInfo.name.replace(/[^가-힣a-zA-Z0-9]/g, '');
  const baseName = `proposal-${safeName}-${timestamp}`;

  const htmlPath = join(outputDir, `${baseName}.html`);
  const jsonPath = join(outputDir, `${baseName}.json`);

  writeFileSync(htmlPath, html, 'utf-8');
  writeFileSync(jsonPath, JSON.stringify(proposalData, null, 2), 'utf-8');

  console.log(`📄 HTML 저장: ${htmlPath}`);
  console.log(`📋 JSON 저장: ${jsonPath}`);

  // 7. PDF 변환
  let pdfPath = null;
  try {
    const pdfResult = await convertHTMLStringToPDF(
      html,
      join(outputDir, `${baseName}.pdf`)
    );
    pdfPath = pdfResult.outputPath;
  } catch (error) {
    console.warn('⚠️ PDF 변환 실패 (HTML 파일은 정상 생성됨):', error.message);
  }

  // 8. 결과 반환
  const result = {
    success: true,
    projectName: data.projectInfo.name,
    summary: estimate.summary,
    files: {
      html: htmlPath,
      json: jsonPath,
      pdf: pdfPath
    },
    data: proposalData
  };

  printSummary(result);

  return result;
}

/**
 * 입력 데이터 준비 및 기본값 적용
 */
function prepareData(input) {
  const defaults = {
    projectInfo: {
      name: '프로젝트명 미정',
      type: 'web',
      complexity: 'medium',
      description: ''
    },
    timeline: {
      durationMonths: 3,
      milestones: []
    },
    team: [],
    supplier: {
      name: '개발 전문가',
      ceo: '-',
      bizNo: '-',
      phone: '-',
      email: '-'
    },
    client: {
      name: '고객사',
      contact: '-',
      phone: '-',
      email: '-'
    },
    options: {
      discountType: 'standard',
      paymentType: 'standard',
      includeVAT: true
    },
    inclusions: [
      '상기 명시된 모든 개발 작업',
      '소스코드 및 산출물 일체',
      '납품 후 1개월 무상 하자보수',
      '기술 문서 및 사용 가이드',
      '배포 지원'
    ],
    exclusions: [
      '서버/호스팅 비용',
      '도메인 비용',
      '외부 API 사용료',
      '앱스토어 등록 비용',
      '추가 기능 개발',
      '콘텐츠 제작 (이미지, 텍스트)'
    ]
  };

  // 깊은 병합
  return deepMerge(defaults, input);
}

/**
 * 비용 계산
 */
function calculateEstimate(data) {
  const { projectInfo, timeline, team, options } = data;

  // 팀 구성이 없으면 자동 생성
  let teamItems = team;
  if (!teamItems || teamItems.length === 0) {
    teamItems = generateDefaultTeam(projectInfo.type, projectInfo.complexity, timeline.durationMonths);
  }

  // 전체 견적 계산
  const estimate = calculator.calculateFullEstimate(teamItems, {
    discountType: options.discountType,
    includeVAT: options.includeVAT
  });

  // 결제 일정 생성
  const payment = calculator.generatePaymentSchedule(
    estimate.totalAmount,
    options.paymentType
  );

  return {
    ...estimate,
    payment
  };
}

/**
 * 기본 팀 구성 생성
 */
function generateDefaultTeam(projectType, complexity, months) {
  const baseTeams = {
    web: [
      { role: 'pm', months, ratio: 0.3 },
      { role: 'planner', months, ratio: 0.3 },
      { role: 'designer', months, ratio: 0.5 },
      { role: 'frontend', months, ratio: 1.0 },
      { role: 'backend', months, ratio: 1.0 },
      { role: 'qa', months, ratio: 0.3 }
    ],
    mobile: [
      { role: 'pm', months, ratio: 0.3 },
      { role: 'planner', months, ratio: 0.3 },
      { role: 'designer', months, ratio: 0.5 },
      { role: 'mobile', months, ratio: 1.5 },
      { role: 'backend', months, ratio: 1.0 },
      { role: 'qa', months, ratio: 0.3 }
    ],
    fullstack: [
      { role: 'pm', months, ratio: 0.2 },
      { role: 'fullstack', months, ratio: 1.5 },
      { role: 'qa', months, ratio: 0.2 }
    ],
    maintenance: [
      { role: 'fullstack', months, ratio: 0.5 },
      { role: 'qa', months, ratio: 0.1 }
    ]
  };

  const team = baseTeams[projectType] || baseTeams.fullstack;

  // 복잡도에 따른 조정
  const multiplier = calculator.getComplexityMultiplier(projectType, complexity);

  return team.map(member => ({
    ...member,
    ratio: Math.round(member.ratio * multiplier * 100) / 100
  }));
}

/**
 * 견적서 데이터 구성
 */
function buildProposalData(data, estimate) {
  const now = new Date();
  const validDate = new Date(now);
  validDate.setDate(validDate.getDate() + 30);

  const proposalNumber = `PRO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  // 작업 항목 구성
  const items = buildWorkItems(estimate.items, data.projectInfo);

  // 마일스톤 구성
  const milestones = data.timeline.milestones.length > 0
    ? data.timeline.milestones
    : generateDefaultMilestones(data.timeline.durationMonths);

  return {
    proposalNumber,
    createdAt: formatDate(now),
    validUntil: formatDate(validDate),

    // 공급자 정보
    supplierName: data.supplier.name,
    supplierCeo: data.supplier.ceo,
    supplierBizNo: data.supplier.bizNo,
    supplierPhone: data.supplier.phone,
    supplierEmail: data.supplier.email,

    // 수신자 정보
    clientName: data.client.name,
    clientContact: data.client.contact,
    clientPhone: data.client.phone,
    clientEmail: data.client.email,

    // 프로젝트 정보
    projectName: data.projectInfo.name,
    projectDescription: data.projectInfo.description || `${data.projectInfo.name} 프로젝트의 성공적인 수행을 위한 견적입니다.`,

    // 작업 항목
    items,

    // 금액
    supplyAmount: estimate.supplyAmount,
    supplyAmountFormatted: calculator.formatAmount(estimate.supplyAmount),
    vatAmount: estimate.vat?.vatAmount || 0,
    vatAmountFormatted: calculator.formatAmount(estimate.vat?.vatAmount || 0),
    totalAmount: estimate.totalAmount,
    totalAmountFormatted: calculator.formatAmount(estimate.totalAmount),

    // 일정
    totalDuration: `약 ${data.timeline.durationMonths}개월`,
    milestones,

    // 결제 조건
    paymentSchedule: estimate.payment.schedule,

    // 포함/미포함 사항
    inclusions: data.inclusions,
    exclusions: data.exclusions,

    // 연락처
    contactName: data.supplier.ceo || data.supplier.name,
    contactPhone: data.supplier.phone,
    contactEmail: data.supplier.email,

    // 기술 스택 (있는 경우)
    techStack: data.techStack || null,

    // 팀 구성 (상세)
    team: estimate.items
  };
}

/**
 * 작업 항목 구성
 */
function buildWorkItems(teamItems, projectInfo) {
  const itemGroups = {
    pm: { name: '프로젝트 관리', detail: 'PM, 일정/리스크 관리, 커뮤니케이션' },
    planner: { name: '기획/분석', detail: '요구사항 분석, 기능 정의, 화면 설계' },
    designer: { name: 'UI/UX 디자인', detail: '디자인 시스템, 화면 디자인, 프로토타입' },
    frontend: { name: '프론트엔드 개발', detail: '웹 프론트엔드, 반응형 UI, 성능 최적화' },
    backend: { name: '백엔드 개발', detail: 'API 개발, 데이터베이스, 서버 로직' },
    fullstack: { name: '풀스택 개발', detail: '프론트엔드 + 백엔드 통합 개발' },
    mobile: { name: '모바일 앱 개발', detail: 'iOS/Android 앱 개발' },
    qa: { name: '테스트/QA', detail: '기능 테스트, 버그 수정, 품질 검증' },
    devops: { name: '인프라/배포', detail: 'CI/CD 구축, 클라우드 설정, 배포' },
    publisher: { name: '퍼블리싱', detail: 'HTML/CSS 마크업, 웹 표준' }
  };

  // 역할별로 그룹화하여 합산
  const groupedItems = {};

  for (const item of teamItems) {
    const role = item.role;
    if (!groupedItems[role]) {
      groupedItems[role] = {
        ...itemGroups[role] || { name: item.roleName, detail: '' },
        cost: 0
      };
    }
    groupedItems[role].cost += item.cost;
  }

  // 배열로 변환
  return Object.values(groupedItems).map((item, index) => ({
    no: index + 1,
    name: item.name,
    detail: item.detail,
    unit: '1식',
    amount: item.cost,
    amountFormatted: calculator.formatAmount(item.cost)
  }));
}

/**
 * 기본 마일스톤 생성
 */
function generateDefaultMilestones(months) {
  if (months <= 1) {
    return [
      { name: '기획/설계', period: '1주', description: '요구사항 확정, 설계' },
      { name: '개발', period: '2주', description: '기능 개발' },
      { name: '테스트/배포', period: '1주', description: 'QA, 배포' }
    ];
  }

  if (months <= 2) {
    return [
      { name: '기획/설계', period: '2주', description: '요구사항 분석, 화면 설계' },
      { name: '디자인', period: '2주', description: 'UI/UX 디자인' },
      { name: '개발', period: '3주', description: '프론트엔드, 백엔드 개발' },
      { name: '테스트/배포', period: '1주', description: 'QA, 버그 수정, 배포' }
    ];
  }

  const designWeeks = Math.ceil(months * 0.15);
  const devWeeks = Math.ceil(months * 4 * 0.6);
  const testWeeks = Math.ceil(months * 0.1);
  const planWeeks = months * 4 - designWeeks - devWeeks - testWeeks;

  return [
    { name: '기획/설계', period: `${planWeeks}주`, description: '요구사항 확정, 기능 정의, 화면 설계' },
    { name: '디자인', period: `${designWeeks}주`, description: 'UI/UX 디자인, 디자인 시스템 구축' },
    { name: '개발', period: `${devWeeks}주`, description: '프론트엔드, 백엔드, API 개발' },
    { name: '테스트/배포', period: `${testWeeks}주`, description: 'QA, 버그 수정, 배포, 인수' }
  ];
}

/**
 * HTML 렌더링
 */
function renderHTML(data) {
  const templatePath = join(__dirname, 'templates/proposal-template.html');
  const templateContent = readFileSync(templatePath, 'utf-8');

  // Handlebars 헬퍼 등록
  Handlebars.registerHelper('add', (a, b) => a + b);

  const template = Handlebars.compile(templateContent);
  return template(data);
}

/**
 * 결과 요약 출력
 */
function printSummary(result) {
  console.log('\n' + '='.repeat(50));
  console.log('✅ 견적서 생성 완료!');
  console.log('='.repeat(50));
  console.log(`\n📋 프로젝트: ${result.projectName}`);
  console.log(`\n💰 견적 금액:`);
  console.log(`   공급가액: ${result.summary.공급가액}`);
  console.log(`   부가세: ${result.summary.부가세}`);
  console.log(`   ─────────────────────`);
  console.log(`   합계: ${result.summary.합계}`);
  console.log(`\n📁 생성된 파일:`);
  console.log(`   HTML: ${result.files.html}`);
  if (result.files.pdf) {
    console.log(`   PDF: ${result.files.pdf}`);
  }
  console.log(`   JSON: ${result.files.json}`);
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * 날짜 포맷팅
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 깊은 객체 병합
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      result[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }

  return result;
}

// CLI 실행 예시
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // 테스트용 샘플 데이터
  const sampleInput = {
    projectInfo: {
      name: '헬스케어 예약 앱',
      type: 'mobile',
      complexity: 'medium',
      description: '사용자가 운동 프로그램을 예약하고 결제할 수 있는 모바일 앱입니다. iOS와 Android 모두 지원하며, React Native로 개발합니다.'
    },
    timeline: {
      durationMonths: 3
    },
    supplier: {
      name: 'Studio KJM',
      ceo: '김지민',
      bizNo: '123-45-67890',
      phone: '010-1234-5678',
      email: 'contact@studiokjm.com'
    },
    client: {
      name: '헬스케어 주식회사',
      contact: '홍길동',
      phone: '02-1234-5678',
      email: 'hong@healthcare.co.kr'
    },
    techStack: {
      frontend: ['React Native', 'TypeScript'],
      backend: ['Node.js', 'Express'],
      database: ['PostgreSQL', 'Redis'],
      infrastructure: ['AWS', 'Docker']
    },
    options: {
      discountType: 'standard',
      paymentType: 'standard'
    }
  };

  generateProposal(sampleInput)
    .then(() => console.log('완료!'))
    .catch(err => console.error('오류:', err));
}

export default { generateProposal };
