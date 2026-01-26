/**
 * Proposal Validator - 견적서 유효성 검증 유틸리티
 */

/**
 * 견적서 데이터 검증
 * @param {object} proposalData - 견적서 데이터
 * @returns {object} 검증 결과 {valid, errors, warnings}
 */
export function validateProposal(proposalData) {
  const errors = [];
  const warnings = [];

  // 필수 필드 검증
  const requiredFields = [
    'projectName',
    'clientName',
    'items',
    'supplyAmount',
    'totalAmount'
  ];

  for (const field of requiredFields) {
    if (!proposalData[field]) {
      errors.push(`필수 필드 누락: ${field}`);
    }
  }

  // 항목 검증
  if (proposalData.items && Array.isArray(proposalData.items)) {
    if (proposalData.items.length === 0) {
      errors.push('최소 1개 이상의 작업 항목이 필요합니다.');
    }

    proposalData.items.forEach((item, index) => {
      if (!item.name && !item.role && !item.roleName) {
        errors.push(`항목 ${index + 1}: 항목명 또는 역할이 필요합니다.`);
      }
      // cost 또는 amount 필드 확인
      const itemCost = item.cost ?? item.amount;
      if (itemCost === undefined && itemCost !== 0) {
        errors.push(`항목 ${index + 1}: 비용이 필요합니다.`);
      }
      if (itemCost < 0) {
        errors.push(`항목 ${index + 1}: 비용은 0 이상이어야 합니다.`);
      }
    });
  }

  // 금액 검증
  if (proposalData.supplyAmount !== undefined) {
    if (proposalData.supplyAmount < 0) {
      errors.push('공급가액은 0 이상이어야 합니다.');
    }
    if (proposalData.supplyAmount < 100000) {
      warnings.push('공급가액이 100,000원 미만입니다. 확인해주세요.');
    }
  }

  // VAT 검증
  if (proposalData.vat) {
    const expectedVAT = Math.round(proposalData.supplyAmount * 0.1);
    if (Math.abs(proposalData.vat.vatAmount - expectedVAT) > 10) {
      warnings.push(`VAT 금액이 예상과 다릅니다. (예상: ${expectedVAT}, 실제: ${proposalData.vat.vatAmount})`);
    }
  }

  // 합계 검증
  if (proposalData.supplyAmount && proposalData.totalAmount) {
    const vatAmount = proposalData.vat?.vatAmount || proposalData.vatAmount || 0;
    const expectedTotal = proposalData.supplyAmount + vatAmount;

    // 반올림 오차 허용 (1% 이내)
    const tolerance = Math.max(100, expectedTotal * 0.01);
    if (Math.abs(proposalData.totalAmount - expectedTotal) > tolerance) {
      warnings.push(`합계 금액 확인 필요 (예상: ${expectedTotal}, 실제: ${proposalData.totalAmount})`);
    }
  }

  // 날짜 검증 (한글 형식 "2024년 1월 26일" 또는 ISO 형식 모두 허용)
  if (proposalData.createdAt) {
    const isValidKoreanDate = /^\d{4}년\s*\d{1,2}월\s*\d{1,2}일$/.test(proposalData.createdAt);
    const createdDate = new Date(proposalData.createdAt);
    if (!isValidKoreanDate && isNaN(createdDate.getTime())) {
      errors.push('작성일 형식이 올바르지 않습니다.');
    }
  }

  if (proposalData.validUntil) {
    const isValidKoreanDate = /^\d{4}년\s*\d{1,2}월\s*\d{1,2}일$/.test(proposalData.validUntil);
    const validDate = new Date(proposalData.validUntil);
    if (!isValidKoreanDate && isNaN(validDate.getTime())) {
      errors.push('유효기간 형식이 올바르지 않습니다.');
    }
  }

  // 연락처 검증
  if (proposalData.contact) {
    if (proposalData.contact.email && !isValidEmail(proposalData.contact.email)) {
      warnings.push('이메일 형식이 올바르지 않습니다.');
    }
    if (proposalData.contact.phone && !isValidPhone(proposalData.contact.phone)) {
      warnings.push('전화번호 형식이 올바르지 않습니다.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: errors.length === 0
      ? `검증 통과 (경고 ${warnings.length}건)`
      : `검증 실패 (오류 ${errors.length}건, 경고 ${warnings.length}건)`
  };
}

/**
 * 이메일 유효성 검증
 * @param {string} email - 이메일 주소
 * @returns {boolean} 유효 여부
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 전화번호 유효성 검증
 * @param {string} phone - 전화번호
 * @returns {boolean} 유효 여부
 */
function isValidPhone(phone) {
  const phoneRegex = /^[\d\-\+\(\)\s]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9;
}

/**
 * HTML 템플릿 검증
 * @param {string} html - HTML 문자열
 * @returns {object} 검증 결과
 */
export function validateHTML(html) {
  const errors = [];
  const warnings = [];

  if (!html || html.trim().length === 0) {
    errors.push('HTML 내용이 비어있습니다.');
    return { valid: false, errors, warnings };
  }

  // 기본 구조 검증
  if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
    warnings.push('DOCTYPE 선언이 없습니다.');
  }

  if (!html.includes('<html')) {
    errors.push('html 태그가 없습니다.');
  }

  if (!html.includes('<head>') && !html.includes('<head ')) {
    warnings.push('head 태그가 없습니다.');
  }

  if (!html.includes('<body>') && !html.includes('<body ')) {
    errors.push('body 태그가 없습니다.');
  }

  // 필수 견적서 요소 검증
  const requiredElements = [
    { pattern: /견적서|QUOTATION|ESTIMATE/i, name: '견적서 제목' },
    { pattern: /공급가|supply|금액/i, name: '금액 정보' },
    { pattern: /합계|total|TOTAL/i, name: '합계' }
  ];

  for (const element of requiredElements) {
    if (!element.pattern.test(html)) {
      warnings.push(`${element.name} 요소가 발견되지 않았습니다.`);
    }
  }

  // 태그 균형 검증 (간단한 버전)
  const openTags = (html.match(/<table[\s>]/gi) || []).length;
  const closeTags = (html.match(/<\/table>/gi) || []).length;
  if (openTags !== closeTags) {
    errors.push(`table 태그 불균형: 열림 ${openTags}, 닫힘 ${closeTags}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    size: html.length,
    summary: errors.length === 0
      ? `HTML 검증 통과 (${html.length} bytes, 경고 ${warnings.length}건)`
      : `HTML 검증 실패 (오류 ${errors.length}건)`
  };
}

/**
 * 인력 구성 검증
 * @param {Array} team - 팀 구성 배열
 * @returns {object} 검증 결과
 */
export function validateTeamComposition(team) {
  const errors = [];
  const warnings = [];

  if (!team || team.length === 0) {
    errors.push('최소 1명 이상의 인력이 필요합니다.');
    return { valid: false, errors, warnings };
  }

  // PM 존재 여부
  const hasPM = team.some(member =>
    member.role === 'pm' || member.role?.toLowerCase().includes('pm')
  );
  if (!hasPM && team.length > 2) {
    warnings.push('PM이 지정되지 않았습니다. 3인 이상 프로젝트는 PM 배치를 권장합니다.');
  }

  // QA 존재 여부
  const hasQA = team.some(member =>
    member.role === 'qa' || member.role?.toLowerCase().includes('qa')
  );
  if (!hasQA) {
    warnings.push('QA가 지정되지 않았습니다. 품질 보증을 위해 QA 배치를 권장합니다.');
  }

  // 투입률 검증
  for (const member of team) {
    if (member.ratio !== undefined) {
      if (member.ratio < 0 || member.ratio > 1) {
        errors.push(`${member.role}: 투입률은 0~1 사이여야 합니다.`);
      }
      if (member.ratio < 0.3) {
        warnings.push(`${member.role}: 투입률이 30% 미만입니다.`);
      }
    }

    if (member.months !== undefined && member.months <= 0) {
      errors.push(`${member.role}: 투입 기간은 0보다 커야 합니다.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    teamSize: team.length,
    summary: `팀 ${team.length}명 구성 검증 ${errors.length === 0 ? '통과' : '실패'}`
  };
}

export default {
  validateProposal,
  validateHTML,
  validateTeamComposition
};
