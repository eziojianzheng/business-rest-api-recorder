const { test, expect, request } = require('@playwright/test');

const BASE_URL = 'http://localhost:9220';

// 测试数据（基于最新录制：新增学生完整信息）
const TEST_DATA = {
  email:    'Admin@standardformtest.com',
  password: 'pEeuozeupzezoEW6qTiAqN==',
  student: {
    studentName:    "da't",       // 含单引号
    studentId:      '123',
    email:          'dsad',
    phoneNumber:    '123',
    enrollmentDate: '2026-05-28', // 选择了28日
    major:          [],           // 专业未选中
    editableTable: {
      inserted: [{ digital: 123 }],
      updated:  [],
      deleted:  [],
    },
  },
};

test.describe.serial('新增学生完整信息（含专业、可编辑表格）', () => {
  let apiContext;
  let authToken;
  let countBefore;

  test.beforeAll(async () => {
    apiContext = await request.newContext({ baseURL: BASE_URL });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  // ── 1. 用户登录 ────────────────────────────────────────────────────────────
  test('1. 用户登录认证', async () => {
    const res = await apiContext.post('/user-management/api/user/login', {      
      data: {
        email:    TEST_DATA.email,
        username: TEST_DATA.email,
        password: TEST_DATA.password,
        captcha:   '',
        captchaId: '',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();

    authToken = body.accessToken;
    console.log('✓ 登录成功，token 已获取');
  });

  // ── 2. 获取用户信息 ────────────────────────────────────────────────────────
  test('2. 获取当前用户信息', async () => {
    const res = await apiContext.get('/user-management/api/user/get-user-info', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.username).toBeTruthy();
    console.log(`✓ 用户: ${body.username} (id: ${body.id})`);
  });

  // ── 3. 查询学生列表（记录提交前数量）─────────────────────────────────────  
  test('3. 查询学生列表（记录提交前数量）', async () => {
    const res = await apiContext.post('/form/api/v3/form-entity-data/basetest/base-test-form/list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { startRow: 0, endRow: 30 },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.count).toBeDefined();
    expect(Array.isArray(body.results)).toBe(true);

    countBefore = body.count;
    console.log(`✓ 提交前学生列表共 ${countBefore} 条记录`);
  });

  // ── 4. 提交新增学生记录（通过流程）──────────────────────────────────────── 
  test('4. 新增学生完整信息（通过流程提交）', async () => {
    const res = await apiContext.put(
      '/flow/api/v2/flow-definition/basetest/number-picker-flow/base-test-form/default/update-form?formPbcToken=basetest',
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          studentName:    TEST_DATA.student.studentName,
          studentId:      TEST_DATA.student.studentId,
          email:          TEST_DATA.student.email,
          phoneNumber:    TEST_DATA.student.phoneNumber,
          enrollmentDate: TEST_DATA.student.enrollmentDate,
          major:          TEST_DATA.student.major,
          editableTable:  TEST_DATA.student.editableTable,
        },
      }
    );

    expect(res.status()).toBe(200);
    const body = await res.json();

    // 断言：返回正确的表单信息
    expect(body.formEntityToken).toBe('base-test-form');
    expect(body.formEntityDataId).toBeDefined();
    expect(body.exceptionMessage).toBeNull();

    console.log(`✓ 学生记录创建成功，formEntityDataId: ${body.formEntityDataId}`);
  });

  // ── 5. 验证新记录出现在列表中，且数量+1 ──────────────────────────────────  
  test('5. 验证新增记录出现在列表中（数量+1）', async () => {
    const res = await apiContext.post('/form/api/v3/form-entity-data/basetest/base-test-form/list', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { startRow: 0, endRow: 30 },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    // 断言：总数量至少增加了 1（流程可能创建多条关联记录）
    expect(body.count).toBeGreaterThanOrEqual(countBefore + 1);

    // 在结果中找到我们创建的记录（按 studentName 匹配）
    const created = body.results.find(r => r.studentName === TEST_DATA.student.studentName);
    expect(created).toBeDefined();
    expect(created.studentId).toBe(TEST_DATA.student.studentId);
    expect(created.email).toBe(TEST_DATA.student.email);
    expect(created.phoneNumber).toBe(TEST_DATA.student.phoneNumber);

    console.log(`✓ 新增记录已出现在列表中: studentName=${created.studentName}, count: ${countBefore} → ${body.count}`);
  });
});
