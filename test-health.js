// test-health.js - Integration test script to verify API health and endpoints
const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const fullPath = API_BASE + (path.startsWith('/') ? path : '/' + path);
    const url = new URL(fullPath);
    const payload = options.body ? JSON.stringify(options.body) : null;
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : {}),
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('   CampusConnect API Test & Health Verification     ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(` \x1b[32m✔ PASS\x1b[0m: ${name}`);
      passed++;
    } catch (err) {
      console.log(` \x1b[31m✖ FAIL\x1b[0m: ${name} -> ${err.message}`);
    }
  }

  // 1. Health check
  await test('GET /api/health returns 200 and operational status UP', async () => {
    const res = await request('/health');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.status !== 'UP') throw new Error(`Body status is ${res.body.status}`);
    console.log(`        [Mode: ${res.body.mode}, Engine: ${res.body.message}]`);
  });

  // 2. Dashboard metrics
  await test('GET /api/dashboard returns metrics and statistics', async () => {
    const res = await request('/dashboard');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (typeof res.body.total_students !== 'number') {
      throw new Error('Missing body.total_students');
    }
    console.log(`        [Students: ${res.body.total_students}, Companies: ${res.body.total_companies}, Jobs: ${res.body.total_jobs}]`);
  });

  // 3. Students list
  await test('GET /api/students returns student records', async () => {
    const res = await request('/students');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body) || res.body.length === 0) {
      throw new Error('Students array is empty');
    }
  });

  // 4. Companies list
  await test('GET /api/companies returns registered companies', async () => {
    const res = await request('/companies');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body) || res.body.length === 0) {
      throw new Error('Companies array is empty');
    }
  });

  // 5. Jobs list
  await test('GET /api/jobs returns active job openings', async () => {
    const res = await request('/jobs');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body) || res.body.length === 0) {
      throw new Error('Jobs array is empty');
    }
  });

  // 6. Eligibility evaluation test
  await test('POST /api/eligibility/check evaluates PL/SQL criteria', async () => {
    const res = await request('/eligibility/check', {
      method: 'POST',
      body: { student_id: 1001, job_id: 201 },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    if (typeof res.body.is_eligible !== 'boolean') {
      throw new Error('Missing is_eligible boolean in response');
    }
    console.log(`        [Aarav Sharma -> Job 201: ${res.body.is_eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (${res.body.reasons})]`);
  });

  // 7. Reports
  await test('GET /api/reports/placements returns placement summary', async () => {
    const res = await request('/reports/placements');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (typeof res.body.placement_percentage !== 'number') {
      throw new Error('Placement summary missing placement_percentage');
    }
    console.log(`        [Placement Rate: ${res.body.placement_percentage}%, Offers: ${res.body.total_offers}]`);
  });

  console.log('\n----------------------------------------------------');
  console.log(`Results: ${passed}/${total} tests passed.`);
  if (passed === total) {
    console.log('\x1b[32mAll core system checks verified successfully!\x1b[0m\n');
  } else {
    console.log('\x1b[31mSome tests failed. Ensure backend server is running.\x1b[0m\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
