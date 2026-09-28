/**
 * HTML to PDF Converter
 * Playwright 기반 PDF 변환 유틸리티
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * HTML 파일을 PDF로 변환
 * @param {string} htmlPath - HTML 파일 경로
 * @param {string} outputPath - 출력 PDF 경로 (선택)
 * @param {object} options - PDF 옵션
 * @returns {Promise<object>} 변환 결과
 */
export async function convertToPDF(htmlPath, outputPath = null, options = {}) {
  const startTime = Date.now();

  // 입력 파일 확인
  const absoluteHtmlPath = resolve(htmlPath);
  if (!existsSync(absoluteHtmlPath)) {
    throw new Error(`HTML 파일을 찾을 수 없습니다: ${absoluteHtmlPath}`);
  }

  // 출력 경로 설정
  const pdfPath = outputPath || absoluteHtmlPath.replace(/\.html?$/i, '.pdf');

  // 기본 옵션
  const pdfOptions = {
    format: options.format || 'A4',
    margin: options.margin || {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0'
    },
    printBackground: options.printBackground !== false,
    preferCSSPageSize: options.preferCSSPageSize || false,
    scale: options.scale || 1.0
  };

  let browser = null;

  try {
    console.log('🚀 PDF 변환 시작...');
    console.log(`📄 입력: ${absoluteHtmlPath}`);

    // 브라우저 실행
    browser = await chromium.launch({
      headless: true
    });

    const page = await browser.newPage();

    // HTML 파일 로드
    const htmlContent = readFileSync(absoluteHtmlPath, 'utf-8');

    // 페이지에 HTML 설정
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle'
    });

    // 한글 폰트 로딩 대기
    await page.waitForTimeout(500);

    // PDF 생성
    const pdfBuffer = await page.pdf(pdfOptions);

    // 파일 저장
    writeFileSync(pdfPath, pdfBuffer);

    const endTime = Date.now();
    const fileSizeKB = Math.round(pdfBuffer.length / 1024);

    console.log('✅ PDF 변환 완료!');
    console.log(`📁 출력: ${pdfPath}`);
    console.log(`📦 크기: ${fileSizeKB}KB`);
    console.log(`⏱️ 소요시간: ${endTime - startTime}ms`);

    // 크몽 제한 확인 (10MB)
    if (fileSizeKB > 10240) {
      console.warn('⚠️ 경고: 파일 크기가 10MB를 초과합니다. 크몽 첨부 시 주의하세요.');
    }

    return {
      success: true,
      inputPath: absoluteHtmlPath,
      outputPath: pdfPath,
      sizeKB: fileSizeKB,
      duration: endTime - startTime
    };

  } catch (error) {
    console.error('❌ PDF 변환 실패:', error.message);
    throw error;

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * HTML 문자열을 PDF로 변환
 * @param {string} htmlContent - HTML 문자열
 * @param {string} outputPath - 출력 PDF 경로
 * @param {object} options - PDF 옵션
 * @returns {Promise<object>} 변환 결과
 */
export async function convertHTMLStringToPDF(htmlContent, outputPath, options = {}) {
  const startTime = Date.now();

  // 기본 옵션
  const pdfOptions = {
    format: options.format || 'A4',
    margin: options.margin || {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0'
    },
    printBackground: options.printBackground !== false,
    scale: options.scale || 1.0
  };

  let browser = null;

  try {
    console.log('🚀 PDF 변환 시작 (문자열 입력)...');

    browser = await chromium.launch({
      headless: true
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(500);

    const pdfBuffer = await page.pdf(pdfOptions);

    writeFileSync(outputPath, pdfBuffer);

    const endTime = Date.now();
    const fileSizeKB = Math.round(pdfBuffer.length / 1024);

    console.log('✅ PDF 변환 완료!');
    console.log(`📁 출력: ${outputPath}`);
    console.log(`📦 크기: ${fileSizeKB}KB`);

    return {
      success: true,
      outputPath,
      sizeKB: fileSizeKB,
      duration: endTime - startTime
    };

  } catch (error) {
    console.error('❌ PDF 변환 실패:', error.message);
    throw error;

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// CLI 실행
const args = process.argv.slice(2);

if (args.length > 0) {
  const htmlPath = args[0];
  const outputPath = args[1] || null;

  convertToPDF(htmlPath, outputPath)
    .then(result => {
      console.log('\n변환 결과:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n변환 실패:', error.message);
      process.exit(1);
    });
}

export default { convertToPDF, convertHTMLStringToPDF };
