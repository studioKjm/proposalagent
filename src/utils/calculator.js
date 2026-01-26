/**
 * Proposal Calculator - 견적서 비용 계산 유틸리티
 *
 * SW기술자 평균임금 기반 공수(M/M) 및 비용 계산
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 데이터 로드
const swWageData = JSON.parse(
  readFileSync(join(__dirname, '../data/sw-wage-2024.json'), 'utf-8')
);
const taxData = JSON.parse(
  readFileSync(join(__dirname, '../data/tax-rates.json'), 'utf-8')
);

/**
 * 등급별 월 임금 조회
 * @param {string} grade - 등급 (special, advanced, intermediate, junior)
 * @returns {number} 월 임금
 */
export function getMonthlyWage(grade) {
  return swWageData.grades[grade]?.monthlyWage || swWageData.grades.intermediate.monthlyWage;
}

/**
 * 등급별 일 임금 조회
 * @param {string} grade - 등급
 * @returns {number} 일 임금
 */
export function getDailyWage(grade) {
  return swWageData.grades[grade]?.dailyWage || swWageData.grades.intermediate.dailyWage;
}

/**
 * 역할별 기본 등급 조회
 * @param {string} role - 역할 (pm, planner, designer, frontend, backend, etc.)
 * @returns {string} 기본 등급
 */
export function getRoleDefaultGrade(role) {
  return swWageData.roles[role]?.defaultGrade || 'intermediate';
}

/**
 * M/M(Man-Month) 비용 계산
 * @param {string} role - 역할
 * @param {number} months - 투입 개월 수
 * @param {string} grade - 등급 (optional, 기본값은 역할별 기본 등급)
 * @param {number} ratio - 투입률 (0.0 ~ 1.0, 기본값 1.0)
 * @returns {object} 계산 결과
 */
export function calculateManMonth(role, months, grade = null, ratio = 1.0) {
  const actualGrade = grade || getRoleDefaultGrade(role);
  const monthlyWage = getMonthlyWage(actualGrade);
  const manMonth = months * ratio;
  const cost = Math.round(monthlyWage * manMonth);

  return {
    role,
    roleName: swWageData.roles[role]?.name || role,
    grade: actualGrade,
    gradeName: swWageData.grades[actualGrade]?.name || actualGrade,
    monthlyWage,
    months,
    ratio,
    manMonth: Math.round(manMonth * 100) / 100,
    cost
  };
}

/**
 * 일 단위 비용 계산
 * @param {string} role - 역할
 * @param {number} days - 투입 일수
 * @param {string} grade - 등급 (optional)
 * @returns {object} 계산 결과
 */
export function calculateDays(role, days, grade = null) {
  const actualGrade = grade || getRoleDefaultGrade(role);
  const dailyWage = getDailyWage(actualGrade);
  const cost = Math.round(dailyWage * days);

  return {
    role,
    roleName: swWageData.roles[role]?.name || role,
    grade: actualGrade,
    gradeName: swWageData.grades[actualGrade]?.name || actualGrade,
    dailyWage,
    days,
    cost
  };
}

/**
 * 할인율 적용
 * @param {number} amount - 원래 금액
 * @param {string|number} discountType - 할인 타입 또는 직접 할인율 (0.0 ~ 1.0)
 * @returns {object} 할인 적용 결과
 */
export function applyDiscount(amount, discountType = 'standard') {
  let discountRate;
  let discountName;

  if (typeof discountType === 'number') {
    discountRate = discountType;
    discountName = `${Math.round(discountType * 100)}% 할인`;
  } else {
    const discount = swWageData.discountRates[discountType] || swWageData.discountRates.standard;
    discountRate = discount.rate;
    discountName = discount.description;
  }

  const discountAmount = Math.round(amount * discountRate);
  const finalAmount = amount - discountAmount;

  return {
    originalAmount: amount,
    discountRate,
    discountName,
    discountAmount,
    finalAmount
  };
}

/**
 * VAT 계산
 * @param {number} supplyAmount - 공급가액
 * @returns {object} VAT 계산 결과
 */
export function calculateVAT(supplyAmount) {
  const vatRate = taxData.vat.rate;
  const vatAmount = Math.round(supplyAmount * vatRate);
  const totalAmount = supplyAmount + vatAmount;

  return {
    supplyAmount,
    vatRate,
    vatRatePercent: `${vatRate * 100}%`,
    vatAmount,
    totalAmount
  };
}

/**
 * 원천세 계산
 * @param {number} amount - 금액
 * @param {string} type - 타입 (individual, corporate)
 * @returns {object} 원천세 계산 결과
 */
export function calculateWithholdingTax(amount, type = 'individual') {
  const taxInfo = taxData.withholdingTax[type] || taxData.withholdingTax.individual;
  const taxRate = taxInfo.rate;
  const taxAmount = Math.round(amount * taxRate);
  const netAmount = amount - taxAmount;

  return {
    grossAmount: amount,
    taxType: type,
    taxName: taxInfo.name,
    taxRate,
    taxRatePercent: `${(taxRate * 100).toFixed(1)}%`,
    taxAmount,
    netAmount
  };
}

/**
 * 전체 견적 계산
 * @param {Array} items - 항목 배열 [{role, months, grade, ratio}]
 * @param {object} options - 옵션 {discountType, includeVAT, withholdingType}
 * @returns {object} 전체 견적 계산 결과
 */
export function calculateFullEstimate(items, options = {}) {
  const {
    discountType = 'standard',
    includeVAT = true,
    withholdingType = null,
    customDiscount = null
  } = options;

  // 각 항목 계산
  const calculatedItems = items.map(item => {
    if (item.days) {
      return calculateDays(item.role, item.days, item.grade);
    }
    return calculateManMonth(item.role, item.months, item.grade, item.ratio || 1.0);
  });

  // 소계
  const subtotal = calculatedItems.reduce((sum, item) => sum + item.cost, 0);

  // 할인 적용
  const discount = applyDiscount(subtotal, customDiscount || discountType);
  const supplyAmount = discount.finalAmount;

  // VAT 계산
  let vatInfo = null;
  let totalAmount = supplyAmount;

  if (includeVAT) {
    vatInfo = calculateVAT(supplyAmount);
    totalAmount = vatInfo.totalAmount;
  }

  // 원천세 계산 (선택적)
  let withholdingInfo = null;
  if (withholdingType) {
    withholdingInfo = calculateWithholdingTax(supplyAmount, withholdingType);
  }

  return {
    items: calculatedItems,
    subtotal,
    discount: {
      type: discountType,
      rate: discount.discountRate,
      amount: discount.discountAmount,
      description: discount.discountName
    },
    supplyAmount,
    vat: vatInfo,
    withholding: withholdingInfo,
    totalAmount,
    summary: {
      공급가액: formatCurrency(supplyAmount),
      부가세: vatInfo ? formatCurrency(vatInfo.vatAmount) : '-',
      합계: formatCurrency(totalAmount)
    }
  };
}

/**
 * 결제 일정 생성
 * @param {number} totalAmount - 총 금액
 * @param {string} paymentType - 결제 타입 (standard, twoPhase, milestone, postPayment)
 * @returns {Array} 결제 일정
 */
export function generatePaymentSchedule(totalAmount, paymentType = 'standard') {
  const paymentInfo = taxData.paymentTerms[paymentType] || taxData.paymentTerms.standard;

  return {
    type: paymentType,
    name: paymentInfo.name,
    description: paymentInfo.description,
    schedule: paymentInfo.schedule.map(item => ({
      ...item,
      amount: Math.round(totalAmount * (item.percentage / 100)),
      amountFormatted: formatCurrency(Math.round(totalAmount * (item.percentage / 100)))
    })),
    note: paymentInfo.note || null
  };
}

/**
 * 금액 포맷팅
 * @param {number} amount - 금액
 * @returns {string} 포맷된 금액 문자열
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * 금액을 숫자 + 원 형식으로 포맷팅
 * @param {number} amount - 금액
 * @returns {string} 포맷된 금액 문자열
 */
export function formatAmount(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

/**
 * 프로젝트 타입별 기본 인력 구성 조회
 * @param {string} projectType - 프로젝트 타입 (web, mobile, fullstack, maintenance)
 * @returns {Array} 기본 역할 배열
 */
export function getProjectBaseRoles(projectType) {
  return swWageData.projectTypes[projectType]?.baseRoles || ['fullstack'];
}

/**
 * 프로젝트 복잡도별 승수 조회
 * @param {string} projectType - 프로젝트 타입
 * @param {string} complexity - 복잡도 (simple, medium, complex)
 * @returns {number} 승수
 */
export function getComplexityMultiplier(projectType, complexity) {
  return swWageData.projectTypes[projectType]?.complexity[complexity]?.multiplier || 1.0;
}

// 기본 내보내기
export default {
  getMonthlyWage,
  getDailyWage,
  getRoleDefaultGrade,
  calculateManMonth,
  calculateDays,
  applyDiscount,
  calculateVAT,
  calculateWithholdingTax,
  calculateFullEstimate,
  generatePaymentSchedule,
  formatCurrency,
  formatAmount,
  getProjectBaseRoles,
  getComplexityMultiplier,
  swWageData,
  taxData
};
