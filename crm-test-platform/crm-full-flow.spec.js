const { test, expect, request } = require("@playwright/test");

const BASE_URL = "https://bot.ceta.crm.duxing.cn";

function encryptPassword(plainText) {
  const charMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const encoded = Buffer.from(plainText).toString('base64');
  return encoded.split('').map(char => {
    const index = charMap.indexOf(char);
    return index !== -1 ? charMap[(index + 13) % 64] : char;
  }).join('');
}

const TEST_DATA = {
  login: {
    username: "xuanyu.lu@bizops.com.cn",
    password: "Test@123456",
    email: "xuanyu.lu@bizops.com.cn",
    captcha: ""
  },
  myOrgId: "14329",
  myUserId: "10084",
  // 同一个 RUN_ID 贯穿本次所有测试数据，方便在系统里识别
  runId: `AT_${new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14)}`,
  get customer() {
    return { customerName: `[自动化]博迈历程_${this.runId}`, region: "华南" };
  }
};

// ✅ 当前只跑第几步（改这里控制进度）
const RUN_UP_TO_STEP = 11;

test.describe.serial("CRM 流程 - 逐步调试", () => {
  // 赢单审批轮询最多等 2 分钟
  test.setTimeout(120000);
  let apiContext;
  let authToken = null;
  let approverToken = null;
  let customerId = null;
  let leadId = null;
  let opportunityId = null;
  let quotationId = null;
  let quotationFlowInstanceId = null;
  let opportunityFlowInstanceId = null;
  let contractId = null;

  test.beforeAll(async () => {
    apiContext = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { "Content-Type": "application/json", "Accept": "application/json" }
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  // ────────────────── 步骤 1：登录 ──────────────────
  test("1. 用户登录认证", async () => {
    // Sales Representative A
    const response = await apiContext.post("/user-management/api/user/login", {
      data: {
        username: TEST_DATA.login.username,
        password: encryptPassword(TEST_DATA.login.password),
        email: TEST_DATA.login.email,
        captcha: TEST_DATA.login.captcha
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    authToken = body.accessToken || body.token;
    expect(authToken).toBeTruthy();
    console.log("✅ Sales Representative A 登录成功");

    // Sales Manager A（审批人）
    const approverRes = await apiContext.post("/user-management/api/user/login", {
      data: {
        email: "593969718@qq.com",
        username: "593969718@qq.com",
        password: encryptPassword("593969718@qq.com"),
        captcha: ""
      }
    });
    expect(approverRes.status()).toBe(200);
    const approverBody = await approverRes.json();
    approverToken = approverBody.accessToken || approverBody.token;
    expect(approverToken).toBeTruthy();
    console.log("✅ Sales Manager A 登录成功（审批人）");
  });

  // ────────────────── 步骤 2：用户信息 ──────────────────
  test("2. 获取用户信息", async () => {
    if (RUN_UP_TO_STEP < 2) { test.skip(true); return; }
    const response = await apiContext.get("/user-management/api/user/get-user-info", {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    expect(response.status()).toBe(200);
    const userInfo = await response.json();
    console.log(`✅ 用户信息: id=${userInfo.id}, username=${userInfo.username}`);
  });

  // ────────────────── 步骤 3：语音线索 ──────────────────
  test("3. 语音线索生成", async () => {
    if (RUN_UP_TO_STEP < 3) { test.skip(true); return; }
    const response = await apiContext.post("/flow/api/flow-rest/meeting-file-to-clue-flow", {
      headers: { "Authorization": `Bearer ${authToken}`, "accept-language": "zh-CN" },
      data: {
        audioFile: { resources: [{ storageId: "5fa51a47-63a8-49c0-8dbc-c32f574de893.mp3", fileName: "20260605204051.mp3", url: "/fss/api/public/tenant/System/persistent/5fa51a47-63a8-49c0-8dbc-c32f574de893.mp3", token: "9d035c4a-311f-4ec9-8226-0db247cf270a_20260605204051.mp3" }], value: null },
        myOrgId: "14313", title: "Hitachi Cable test", voiceType: "Meeting", flowInstanceId: null,
        myUserId: "10085", threadId: null, formEntityId: 1236, createdTime: "2026-06-25T04:22:28.333+00:00",
        parallelStreamIndex: 3, id: 24787, uploaderEmail: "runzhi.zhang@bizops.com.cn", totalDuration: "2672",
        formEntityName: "Voice Summary Table Form", pbcToken: "crm", uploadTime: "2026-06-25 12:22:27",
        userId: 10077, textFile: { resources: [], value: null }, objectVersion: 0, deleted: false,
        formEntityToken: "voice-summary-table-form",
        transcriptionContent: { longText: "但是的话不是说就是说怎么做，具体怎么怎么搞", value: null }
      }
    });
    console.log("语音线索接口状态:", response.status());
    const rawBody = await response.text();
    console.log("语音线索接口返回:", rawBody);
    expect(response.status()).toBe(200);

    // 接口返回没有线索ID，等待异步生成后查询最新线索
    console.log("⏳ 等待线索异步生成...");
    await new Promise(r => setTimeout(r, 3000));

    const leadRes = await apiContext.post("/form/api/v3/form-entity-data/lead-management/lead-management-form/list", {
      headers: { "Authorization": `Bearer ${authToken}` },
      data: {
        startRow: 0,
        endRow: 5,
        selectColId: ["id", "myOrgId", "myUserId", "createdTime"],
        sortModel: [{ colId: "createdTime", sort: "desc" }]
      }
    });
    console.log("线索列表状态:", leadRes.status());
    if (leadRes.status() === 200) {
      const leadBody = await leadRes.json();
      // 查最新一条的完整详情
      const latest = leadBody.results && leadBody.results[0];
      if (latest) {
        console.log(`📦 最新线索(列表字段):\n${JSON.stringify(latest, null, 2)}`);
        // 再单独查详情，拿完整字段
        const detailRes = await apiContext.get(
          `/form/api/v2/form-entity-data/lead-management/lead-management-form/${latest.id}`,
          { headers: { "Authorization": `Bearer ${authToken}` } }
        );
        const detail = await detailRes.json();
        console.log(`📦 线索完整详情:\n${JSON.stringify(detail, null, 2)}`);
        leadId = latest.id;
        console.log(`✅ 线索ID记录: ${leadId}`);
      }
    } else {
      const err = await leadRes.text();
      console.log("线索列表查询失败:", err);
    }
  });

  // ────────────────── 步骤 4：创建客户 ──────────────────
  test("4. 创建客户档案", async () => {
    if (RUN_UP_TO_STEP < 4) { test.skip(true); return; }
    const response = await apiContext.post("/form/api/v2/form-entity-data/customer-management/customer-management-form/default", {
      headers: { "Authorization": `Bearer ${authToken}` },
      data: {
        customerName: TEST_DATA.customer.customerName,
        region: TEST_DATA.customer.region,
        customerOwner: [{ value: TEST_DATA.myUserId, label: "Sales Representative A", uid: TEST_DATA.myUserId }],
        creator: TEST_DATA.myUserId,
        myUserId: TEST_DATA.myUserId,
        myOrgId: TEST_DATA.myOrgId
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    customerId = body.id;
    console.log(`✅ 客户创建成功`);
    console.log(`📦 API 完整返回:\n${JSON.stringify(body, null, 2)}`);
  });

  // ────────────────── 步骤 5：线索转商机 ──────────────────
  test("5. 线索转化为商机", async () => {
    if (RUN_UP_TO_STEP < 5) { test.skip(true); return; }

    console.log(`💡 线索转商机，leadId=${leadId}, customerId=${customerId}`);

    const response = await apiContext.put(
      "/flow/api/v2/flow-definition/lead-management/opportunity-conversion-process-flow/lead-management-form/convert/update-form",
      {
        headers: { "Authorization": `Bearer ${authToken}` },
        data: {
          // ── 基础转化标志 ──
          convertToOpportunity: "true",    // 注意是字符串"true"（HAR录制值）
          myOrgId: TEST_DATA.myOrgId,
          myUserId: TEST_DATA.myUserId,

          // ── 商机核心字段 ──
          opportunityName: `[自动化]博迈历程-信息化转型_${TEST_DATA.runId}`,
          expectedAmount: "1200",
          winRate: 56,
          expectedDealTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            .toISOString().split("T")[0],

          // ── 客户关联 ──
          companyName: [{
            pbcToken: "customer-management",
            formEntityToken: "customer-management-form",
            label: TEST_DATA.customer.customerName,
            value: String(customerId)
          }],

          // ── 商机所有人 ──
          opportunityOwner: [{
            pbcToken: "user-management-new",
            uid: TEST_DATA.myUserId,
            formEntityToken: "system-user-form",
            label: "Sales Representative A",
            value: TEST_DATA.myUserId
          }],

          // ── 线索原始字段透传 ──
          id: leadId,
          leadName: `[自动化]博迈历程-信息化转型_${TEST_DATA.runId}`,
          leadOwner: [{
            pbcToken: "user-management-new",
            uid: TEST_DATA.myUserId,
            formEntityToken: "system-user-form",
            label: "Sales Representative A",
            value: "xuanyu.lu@bizops.com.cn"
          }],
          leadScoringBudget: "25",
          leadScoringNeed: "25",
          leadScoringAuthority: "25",
          leadScoringTimeline: "10",
          leadScoring: "85",
          spinCorrectionDetails: { longText: "", value: "" },
          nReason: null,
          bReason: null,
          aReason: null,
          tReason: null,
          flowInstanceId: null,
          threadId: null
        }
      }
    );

    console.log("线索转商机接口状态:", response.status());
    const rawBody = await response.text();
    console.log("线索转商机接口返回:", rawBody);
    expect(response.status()).toBe(200);

    // 用商机名称（带runId）精确过滤，确保拿到本次创建的商机
    console.log("⏳ 查询刚创建的商机...");
    await new Promise(r => setTimeout(r, 2000));

    const listRes = await apiContext.post(
      "/form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list",
      {
        headers: { "Authorization": `Bearer ${authToken}` },
        data: {
          startRow: 0,
          endRow: 5,
          selectColId: ["id", "myOrgId", "myUserId", "createdTime"],
          filterModel: [{ colId: "opportunityName", filterType: "text", type: "equals", filter: `[自动化]博迈历程-信息化转型_${TEST_DATA.runId}` }],
          sortModel: [{ colId: "createdTime", sort: "desc" }]
        }
      }
    );
    console.log("商机列表状态:", listRes.status());

    if (listRes.status() === 200) {
      const listBody = await listRes.json();
      console.log(`📋 filterModel 查到 ${listBody.results?.length || 0} 条商机`);

      let latest = listBody.results && listBody.results[0];

      // 精确匹配没找到，兜底取最新一条
      if (!latest) {
        console.log("⚠️ 精确匹配无结果，改用最新记录兜底");
        const fallbackRes = await apiContext.post(
          "/form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list",
          {
            headers: { "Authorization": `Bearer ${authToken}` },
            data: { startRow: 0, endRow: 3, selectColId: ["id", "myOrgId", "myUserId", "createdTime"], sortModel: [{ colId: "createdTime", sort: "desc" }] }
          }
        );
        if (fallbackRes.status() === 200) {
          const fb = await fallbackRes.json();
          latest = fb.results?.[0];
          if (latest) console.log(`📋 兜底取最新商机 ID: ${latest.id}`);
        }
      }

      if (latest) {
        opportunityId = latest.id;
        // 查完整详情
        const detailRes = await apiContext.get(
          `/form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/${opportunityId}`,
          { headers: { "Authorization": `Bearer ${authToken}` } }
        );
        const detail = await detailRes.json();
        // 只打关键字段
        const keys = ['id','opportunityName','opportunityOwner','customerName','clueName','winRate','aiWinRatePrediction','expectedAmount','opportunityStage','myOrgId','myUserId'];
        const filtered = {};
        keys.forEach(k => { if (detail[k] !== undefined) filtered[k] = detail[k]; });
        console.log(`📦 商机关键字段:\n${JSON.stringify(filtered, null, 2)}`);
        console.log(`✅ 商机ID: ${opportunityId}`);
      }
    } else {
      const err = await listRes.text();
      console.log("商机列表查询失败:", err);
    }
  });

  // ────────────────── 步骤 6：创建报价 ──────────────────
  test("6. 创建销售报价", async () => {
    if (RUN_UP_TO_STEP < 6) { test.skip(true); return; }

    console.log(`💰 创建报价，opportunityId=${opportunityId}, customerId=${customerId}`);

    const opportunityName = `[自动化]博迈历程-信息化转型_${TEST_DATA.runId}`;
    const customerNameLabel = TEST_DATA.customer.customerName;
    const today = new Date().toISOString().split("T")[0];
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const response = await apiContext.put(
      "/flow/api/v2/flow-definition/quotation-management/new-quote-approval-flow/quotation-form/new/update-form",
      {
        headers: { "Authorization": `Bearer ${authToken}` },
        data: {
          quoteStatus: [{ id: 14413, handle: "quoteStatus-draft", code: "draft", label: "草稿", value: 14413 }],
          quoteNumber: `QM-${TEST_DATA.runId}`,  // 自动化生成唯一编号
          discountOffer: 0,
          taxRate: null,
          totalPriceNoTax: 3576,
          totalPriceWithTax: 3576,
          language: "zh-CN",
          quoteDate: today,
          validUntil: validUntil,
          myOrgId: TEST_DATA.myOrgId,
          myUserId: TEST_DATA.myUserId,

          // ── 关联商机（字段名是 businessOpportunity）──
          businessOpportunity: [{
            id: opportunityId,
            value: String(opportunityId),
            label: opportunityName,
            customerName: [{
              pbcToken: "customer-management",
              formEntityToken: "customer-management-form",
              label: customerNameLabel,
              value: String(customerId)
            }],
            settlementCurrency: []
          }],
          parentDataId: String(opportunityId),

          // ── 关联客户 ──
          customerName: [{
            pbcToken: "customer-management",
            formEntityToken: "customer-management-form",
            label: customerNameLabel,
            value: String(customerId)
          }],

          // ── 销售人员 ──
          salesPerson: [{
            id: 51,
            value: "xuanyu.lu@bizops.com.cn",
            label: "Sales Representative A",
            uid: TEST_DATA.myUserId
          }],

          // ── 产品明细 ──
          productSubtable: {
            inserted: [{
              productName: [{ value: "CetaCRM", label: "CetaCRM" }],
              standardPrice: 1788,
              currency: [{ value: "CNY", label: "人民币" }],
              billingCycle: [{ value: "yearly", label: "按年" }],
              minimumOrderQuantity: 2,
              taxRate: null,
              discountOffer: 0,
              totalPrice: 3576
            }],
            updated: [],
            deleted: []
          }
        }
      }
    );

    console.log("创建报价接口状态:", response.status());
    const rawBody = await response.text();
    console.log("创建报价接口返回:", rawBody);
    expect(response.status()).toBe(200);

    const body = JSON.parse(rawBody);
    quotationId = body.formEntityDataId;

    // 查询报价详情确认关联
    await new Promise(r => setTimeout(r, 1000));
    const detailRes = await apiContext.get(
      `/form/api/v2/form-entity-data/quotation-management/quotation-form/${quotationId}`,
      { headers: { "Authorization": `Bearer ${authToken}` } }
    );
    if (detailRes.status() === 200) {
      const detail = await detailRes.json();
      const keys = ['id','quoteNumber','quoteStatus','businessOpportunity','customerName','salesPerson','totalPriceNoTax','totalPriceWithTax','validUntil','myOrgId'];
      const filtered = {};
      keys.forEach(k => { if (detail[k] !== undefined) filtered[k] = detail[k]; });
      console.log(`📦 报价关键字段:\n${JSON.stringify(filtered, null, 2)}`);
      console.log(`✅ 报价ID: ${quotationId}`);
      // 记录 flowInstanceId 供审批用
      quotationFlowInstanceId = detail.flowInstanceId || detail.threadId;
      console.log(`📋 报价 flowInstanceId: ${quotationFlowInstanceId}`);
    } else {
      const err = await detailRes.text();
      console.log("报价详情查询失败:", err);
    }
  });

  // ────────────────── 步骤 6b：报价审批（Sales Manager A）──────────────────
  test("6b. 报价审批（Sales Manager A 审批通过）", async () => {
    if (RUN_UP_TO_STEP < 7) { test.skip(true); return; }

    // 若报价详情里没有 flowInstanceId，轮询等待最多 30 秒
    if (!quotationFlowInstanceId) {
      console.log("⏳ 等待报价审批流程创建...");
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const detailRes = await apiContext.get(
          `/form/api/v2/form-entity-data/quotation-management/quotation-form/${quotationId}`,
          { headers: { "Authorization": `Bearer ${authToken}` } }
        );
        if (detailRes.status() === 200) {
          const detail = await detailRes.json();
          quotationFlowInstanceId = detail.flowInstanceId || detail.threadId;
          console.log(`🔄 第${i+1}次查询，flowInstanceId: ${quotationFlowInstanceId}`);
          if (quotationFlowInstanceId) break;
        }
      }
    }

    expect(quotationFlowInstanceId).toBeTruthy();
    console.log(`✍️ Sales Manager A 审批报价，flowInstanceId: ${quotationFlowInstanceId}`);

    // 1. 轮询等待审批节点 ready（"Current node is not a Form or Approval Node" 说明节点还没就绪）
    let formData = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const getFormRes = await apiContext.get(
        `/flow/api/flow-instance/${quotationFlowInstanceId}/get-form`,
        { headers: { "Authorization": `Bearer ${approverToken}` } }
      );
      console.log(`🔄 第${i+1}次 get-form，状态: ${getFormRes.status()}`);
      if (getFormRes.status() === 200) {
        formData = await getFormRes.json();
        console.log("✅ 获取到审批表单");
        break;
      } else {
        const err = await getFormRes.text();
        console.log(`   错误: ${err.substring(0, 150)}`);
      }
    }
    expect(formData).toBeTruthy();
    console.log("✅ 获取到审批表单");

    // 2. PUT approval 提交审批（approvalComment 用录制里的 "agree"）
    const approvalRes = await apiContext.put(
      `/flow/api/flow-instance/${quotationFlowInstanceId}/approval?formPbcToken=quotation-management`,
      {
        headers: { "Authorization": `Bearer ${approverToken}` },
        data: {
          formData: formData.data || formData,
          approvalResult: "APPROVAL",
          approvalComment: "agree"
        }
      }
    );
    console.log("审批接口状态:", approvalRes.status());
    const approvalBody = await approvalRes.text();
    console.log("审批接口返回:", approvalBody);
    expect(approvalRes.status()).toBe(200);

    // 3. 确认报价状态变为 accepted
    await new Promise(r => setTimeout(r, 2000));
    const confirmRes = await apiContext.get(
      `/form/api/v2/form-entity-data/quotation-management/quotation-form/${quotationId}`,
      { headers: { "Authorization": `Bearer ${authToken}` } }
    );
    if (confirmRes.status() === 200) {
      const detail = await confirmRes.json();
      const status = detail.quoteStatus?.[0]?.code;
      console.log(`📋 审批后报价状态: ${status}`);
      expect(status).toBe("accepted");
      console.log("✅ 报价审批通过，状态变为 accepted");
    }
  });

  // ────────────────── 步骤 7：商机推进到赢单 ──────────────────
  test("7. 商机推进到赢单", async () => {
    if (RUN_UP_TO_STEP < 8) { test.skip(true); return; }

    console.log(`🎯 推进商机到赢单，opportunityId=${opportunityId}`);

    const response = await apiContext.post(
      "/flow/api/flow-rest/opportunity-stage-transition-process-flow",
      {
        headers: { "Authorization": `Bearer ${authToken}` },
        data: {
          id: opportunityId,
          opportunityStage: [{
            pbcToken: "basic-system-setting",
            code: "Winning Orders",
            label_i18n_zh_CN: "赢单",
            formEntityToken: "data-dictionary",
            label_i18n_en_US: "Closed Won",
            handle: "opportunityStage-Winning Orders",
            remark: null,
            label_i18n_ja_JP: "受注",
            label: "受注",
            id: 17211,
            value: "17211"
          }]
        }
      }
    );

    console.log("赢单推进状态:", response.status());
    const rawBody = await response.text();
    console.log("赢单推进返回:", rawBody || "(空响应)");
    expect(response.status()).toBe(200);

    // 查商机详情拿 flowInstanceId（threadId 字段）
    console.log("⏳ 等待赢单审批流程创建...");
    await new Promise(r => setTimeout(r, 2000));
    const detailRes = await apiContext.get(
      `/form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/${opportunityId}`,
      { headers: { "Authorization": `Bearer ${authToken}` } }
    );
    if (detailRes.status() === 200) {
      const detail = await detailRes.json();
      opportunityFlowInstanceId = detail.threadId || detail.flowInstanceId;
      const stage = detail.opportunityStage?.[0]?.code;
      console.log(`📋 商机阶段: ${stage}, flowInstanceId: ${opportunityFlowInstanceId}, nodeId: ${detail.nodeId}`);
    }
    console.log("✅ 商机已推进到赢单");
  });

  // ────────────────── 步骤 7b：赢单审批（Sales Manager A）──────────────────
  test("7b. 赢单审批（Sales Manager A 审批通过）", async () => {
    if (RUN_UP_TO_STEP < 8) { test.skip(true); return; }

    // 轮询等待 flowInstanceId 和审批节点 ready
    console.log("⏳ 等待赢单审批节点 ready...");
    let formData = null;
    let flowId = opportunityFlowInstanceId;

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 5000));

      // 如果还没有 flowInstanceId，先查商机详情
      if (!flowId) {
        const detailRes = await apiContext.get(
          `/form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/${opportunityId}`,
          { headers: { "Authorization": `Bearer ${authToken}` } }
        );
        if (detailRes.status() === 200) {
          const detail = await detailRes.json();
          flowId = detail.threadId || detail.flowInstanceId;
        }
      }

      if (!flowId) {
        console.log(`🔄 第${i+1}次查询，flowInstanceId 还未生成`);
        continue;
      }

      // 尝试 get-form
      const getFormRes = await apiContext.get(
        `/flow/api/flow-instance/${flowId}/get-form`,
        { headers: { "Authorization": `Bearer ${approverToken}` } }
      );
      console.log(`🔄 第${i+1}次 get-form (flowId=${flowId})，状态: ${getFormRes.status()}`);

      if (getFormRes.status() === 200) {
        formData = await getFormRes.json();
        opportunityFlowInstanceId = flowId;
        console.log("✅ 获取到赢单审批表单");
        console.log("formData.data 关键字段:", JSON.stringify({
          opportunityStage: formData.data?.opportunityStage,
          flowInstanceId: formData.data?.flowInstanceId,
          threadId: formData.data?.threadId,
          id: formData.data?.id
        }, null, 2));
        break;
      } else {
        const err = await getFormRes.text();
        console.log(`   错误: ${err.substring(0, 120)}`);
      }
    }

    expect(formData).toBeTruthy();
    console.log(`✍️ Sales Manager A 审批赢单，flowInstanceId: ${opportunityFlowInstanceId}`);

    const approvalRes = await apiContext.put(
      `/flow/api/flow-instance/${opportunityFlowInstanceId}/approval?formPbcToken=opportunity-management`,
      {
        headers: { "Authorization": `Bearer ${approverToken}` },
        data: {
          formData: {
            ...(formData.data || formData),
            // 确保审批时带上赢单阶段（HAR录制里有这个字段）
            opportunityStage: [{
              pbcToken: "basic-system-setting",
              code: "Winning Orders",
              label_i18n_zh_CN: "赢单",
              formEntityToken: "data-dictionary",
              label_i18n_en_US: "Closed Won",
              handle: "opportunityStage-Winning Orders",
              label_i18n_ja_JP: "受注",
              label: "受注",
              id: 17211,
              value: "17211"
            }],
            flowInstanceId: Number(opportunityFlowInstanceId),
            threadId: String(opportunityFlowInstanceId)
          },
          approvalResult: "APPROVAL",
          approvalComment: "同意"
        }
      }
    );
    console.log("赢单审批状态:", approvalRes.status());
    const approvalBody = await approvalRes.text();
    console.log("赢单审批返回:", approvalBody);
    expect(approvalRes.status()).toBe(200);

    // 确认商机阶段变为 Winning Orders（异步，等3秒）
    await new Promise(r => setTimeout(r, 3000));
    const confirmRes = await apiContext.get(
      `/form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/${opportunityId}`,
      { headers: { "Authorization": `Bearer ${authToken}` } }
    );
    if (confirmRes.status() === 200) {
      const detail = await confirmRes.json();
      const stage = detail.opportunityStage?.[0]?.code;
      console.log(`📋 审批后商机阶段: ${stage}`);
      expect(stage).toBe("Winning Orders");
      console.log("✅ 赢单审批通过，商机阶段变为 Winning Orders");
    }
  });

  // ────────────────── 步骤 8：生成销售合同 ──────────────────
  test("8. 生成销售合同", async () => {
    if (RUN_UP_TO_STEP < 9) { test.skip(true); return; }

    console.log(`📄 生成合同，opportunityId=${opportunityId}, flowInstanceId=${opportunityFlowInstanceId}`);

    // 先查商机完整数据（合同生成需要传整个商机对象）
    const oppRes = await apiContext.get(
      `/form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/${opportunityId}`,
      { headers: { "Authorization": `Bearer ${authToken}` } }
    );
    expect(oppRes.status()).toBe(200);
    const opp = await oppRes.json();
    console.log("✅ 获取到商机完整数据");

    // 合同编号前端生成，用 runId 保持唯一
    const contractNumber = `[自动化]CN-${TEST_DATA.runId}`;

    const response = await apiContext.post(
      "/flow/api/flow-rest/convert-to-sales-contract-flow",
      {
        headers: { "Authorization": `Bearer ${authToken}` },
        data: {
          // 传整个商机对象（和 HAR 一致）
          ...opp,
          // 覆盖关键字段
          myOrgId: TEST_DATA.myOrgId,
          myUserId: TEST_DATA.myUserId,
          creationTime: new Date().toISOString().replace("T", " ").substring(0, 19),
          flowInstanceId: opportunityFlowInstanceId,
          threadId: String(opportunityFlowInstanceId),
          contractNumber: contractNumber,
          Status: "winning-order-approved"
        }
      }
    );

    console.log("合同生成接口状态:", response.status());
    const rawBody = await response.text();
    console.log("合同生成接口返回:", rawBody || "(空响应)");
    expect(response.status()).toBe(200);

    // 等待合同异步生成
    console.log("⏳ 等待合同生成...");
    await new Promise(r => setTimeout(r, 5000));

    // 查合同列表找最新合同
    const listRes = await apiContext.post(
      "/form/api/v3/form-entity-data/contract-management/contract-management-form/list",
      {
        headers: { "Authorization": `Bearer ${authToken}` },
        data: {
          startRow: 0,
          endRow: 5,
          selectColId: ["id", "contractCode", "contractName", "contractStatus", "relatedOpportunity", "myOrgId", "createdTime", "partyAName", "customer"],
          filterModel: [{ colId: "contractCode", filterType: "text", type: "equals", filter: contractNumber }]
        }
      }
    );

    if (listRes.status() === 200) {
      const listBody = await listRes.json();
      console.log(`📋 按合同编号查到 ${listBody.results?.length || 0} 条`);

      let latest = listBody.results?.[0];

      // 精确匹配没找到，兜底取最新
      if (!latest) {
        console.log("⚠️ 精确匹配无结果，兜底取最新合同");
        const fbRes = await apiContext.post(
          "/form/api/v3/form-entity-data/contract-management/contract-management-form/list",
          {
            headers: { "Authorization": `Bearer ${authToken}` },
            data: {
              startRow: 0,
              endRow: 5,
              selectColId: ["id", "contractCode", "contractName", "contractStatus", "relatedOpportunity", "myOrgId", "createdTime"],
              sortModel: [{ colId: "createdTime", sort: "desc" }]
            }
          }
        );
        if (fbRes.status() === 200) {
          const fb = await fbRes.json();
          latest = fb.results?.[0];
        }
      }

      if (latest) {
        contractId = latest.id;
        console.log(`📦 合同关键字段:\n${JSON.stringify(latest, null, 2)}`);
        console.log(`✅ 合同ID: ${contractId}`);
      } else {
        console.log("❌ 未找到合同记录");
      }
    } else {
      const err = await listRes.text();
      console.log("合同列表查询失败:", err);
    }

    expect(contractId).toBeTruthy();
  });

  // ────────────────── 步骤 9：完善合同信息 ──────────────────
  test("9. 完善合同信息", async () => {
    if (RUN_UP_TO_STEP < 10) { test.skip(true); return; }

    console.log(`✏️ 完善合同信息，contractId=${contractId}`);

    // 先查合同完整数据（和 HAR 一致：PUT 时传整个合同对象）
    const contractRes = await apiContext.get(
      `/form/api/v2/form-entity-data/contract-management/contract-management-form/${contractId}`,
      { headers: { "Authorization": `Bearer ${authToken}` } }
    );
    expect(contractRes.status()).toBe(200);
    const contract = await contractRes.json();
    console.log("✅ 获取到合同完整数据");

    const response = await apiContext.put(
      `/form/api/v2/form-entity-data/${contractId}/contract-management/contract-management-form/edit`,
      {
        headers: { "Authorization": `Bearer ${authToken}` },
        data: {
          // 传整个合同对象，覆盖需要补充的字段
          ...contract,
          // ── 补充完善字段 ──
          partyBName: `[自动化]博迈历程乙方_${TEST_DATA.runId}`,
          contractLevel: [{
            id: 14380, value: 14380, label: "重要合同",
            "label_i18n_zh-CN": "重要合同",
            "label_i18n_en-US": "Important Contract"
          }],
          signingDate: new Date().toISOString().split("T")[0],
          totalAmountWithTax: 3576,
          collectionAmount: 3576,
          receivedAmount: 0,
          paymentProgress: "0%",
          approvalDocument: { resources: { tempResources: [], unmodifiedResources: [], copyOf: [], orders: [] } },
          contractDocument: { resources: { tempResources: [], unmodifiedResources: [], copyOf: [], orders: [] } },
          receivablePlan: { inserted: [], updated: [], deleted: [] }
        }
      }
    );

    console.log("合同完善接口状态:", response.status());
    const rawBody = await response.text();
    console.log("合同完善接口返回:", rawBody.substring(0, 300));
    expect(response.status()).toBe(200);
    console.log("✅ 合同信息完善成功");
  });

  // ────────────────── 步骤 10：合同生效 ──────────────────
  test("10. 合同生效", async () => {
    if (RUN_UP_TO_STEP < 11) { test.skip(true); return; }

    console.log(`✅ 合同生效，contractId=${contractId}`);

    const response = await apiContext.post(
      "/flow/api/flow-rest/contract-effective-flow",
      {
        headers: { "Authorization": `Bearer ${authToken}` },
        data: { id: contractId }
      }
    );

    console.log("合同生效接口状态:", response.status());
    const rawBody = await response.text();
    console.log("合同生效接口返回:", rawBody || "(空响应)");
    expect(response.status()).toBe(200);

    // 确认合同状态变为生效
    await new Promise(r => setTimeout(r, 2000));
    const confirmRes = await apiContext.get(
      `/form/api/v2/form-entity-data/contract-management/contract-management-form/${contractId}`,
      { headers: { "Authorization": `Bearer ${authToken}` } }
    );
    if (confirmRes.status() === 200) {
      const detail = await confirmRes.json();
      const status = detail.contractStatus?.[0]?.code;
      console.log(`📋 合同生效后状态: ${status}`);
    }
    console.log("🎉 整个CRM销售流程完成！线索 → 客户 → 商机 → 报价 → 赢单 → 合同生效");
  });
});
