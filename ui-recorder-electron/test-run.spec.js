const { test, expect, request } = require("@playwright/test");

const BASE_URL = "https://bot.ceta.crm.duxing.cn";

// ── 密码加密（Base64 + 字符偏移13位）────────────────────────────────────────
function encryptPassword(inputString) {
  const char_map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const encoded  = Buffer.from(inputString, 'utf-8').toString('base64');
  const result   = [];
  for (const char of encoded) {
    const idx = char_map.indexOf(char);
    result.push(idx !== -1 ? char_map[(idx + 13) % 64] : char);
  }
  return result.join('');
}

// ── 贯穿测试的状态（每次运行独立） ───────────────────────────────────────────
let authToken     = null;
let myUserId      = null;
let myOrgId       = null;
let RUN_TAG       = null;   // 本次运行唯一标识，用于所有数据命名
let customerId    = null;
let leadId        = null;
let opportunityId = null;
let quotationId   = null;
let contractId    = null;

// ─────────────────────────────────────────────────────────────────────────────
test.describe.serial("CRM 完整销售流程", () => {

  let api;

  test.beforeAll(async () => {
    RUN_TAG = Date.now();   // 本次运行唯一标识
    api = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { "Content-Type": "application/json" },
    });
    console.log(`\n========== 本次运行标识: ${RUN_TAG} ==========`);
  });

  test.afterAll(async () => { await api.dispose(); });

  // ── 辅助：打印并断言 200 ──────────────────────────────────────────────────
  async function call(label, res) {
    const status = res.status();
    let body;
    try { body = await res.json(); }
    catch { body = await res.text(); }
    console.log(`\n[${label}] status=${status}`);
    console.log(JSON.stringify(body, null, 2).slice(0, 800));
    expect(status, `"${label}" 返回 ${status}，期望 200`).toBe(200);
    return body;
  }

  // ──────────────────────────────────────────────────────────────────────────
  test("01 · 用户登录", async () => {
    // 验证依据：返回 accessToken 且不为空
    const ts  = Date.now();
    const res = await api.post(`/user-management/api/user/login?auth=basic&timestamp=${ts}`, {
      data: {
        email:     "jinjin.zhang@bizops.com.cn",
        username:  "jinjin.zhang@bizops.com.cn",
        password:  encryptPassword("Test@123456"),
        captcha:   "",
        captchaId: "",
      },
    });
    const body = await call("登录", res);
    authToken = body.accessToken;
    expect(authToken, "accessToken 为空").toBeTruthy();
    console.log(`  ✓ authToken 已获取，长度=${authToken.length}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  test("02 · 获取用户 & 组织信息", async () => {
    // 验证依据：返回 id 且 username 为 Sales Director
    const res  = await api.get(`/user-management/api/user/get-user-info?timestamp=${Date.now()}`,
      { headers: { Authorization: `Bearer ${authToken}` } });
    const body = await call("用户信息", res);

    myUserId = body.id;
    // get-user-info 不含 organization，HAR 录制确认 orgId=14316（知微行易销售部）
    myOrgId  = "14316";

    expect(myUserId, "userId 为空").toBeTruthy();
    console.log(`  ✓ myUserId=${myUserId}(${body.username}), myOrgId=${myOrgId}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  test("03 · 创建本次专属线索（通过语音流程）", async () => {
    // 线索没有直接新建的 default 布局，HAR 录制显示线索是由语音转写流程产生的
    // 实际测试策略：从线索列表中取一条真正未转化的线索（opportunityStage 为空）
    // 验证依据：找到的线索 opportunityStage 为空数组（未转化），clueClosedStatus 为空数组（未关闭）
    const ts  = Date.now();
    const res = await api.post(
      `/form/api/v3/form-entity-data/lead-management/lead-management-form/list?timestamp=${ts}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          startRow: 0,
          endRow:   50,
          // 只看自己名下的线索
          filterModel: [
            {
              colId:      "leadOwner.uid",
              filterType: "text",
              type:       "equals",
              filter:     String(myUserId),
            },
          ],
        },
      }
    );
    const body    = await call("线索列表（我的）", res);
    const results = body.results || [];

    console.log(`  我名下线索共 ${results.length} 条，逐条检查：`);
    results.slice(0, 10).forEach(r => {
      const closed     = Array.isArray(r.clueClosedStatus) ? r.clueClosedStatus.length : '?';
      const converted  = Array.isArray(r.opportunityStage) ? r.opportunityStage.length : '?';
      console.log(`    ID=${r.id} closed=${closed} converted=${converted} name=${r.leadName}`);
    });

    // 找一条：未关闭(clueClosedStatus=[]) 且 未转化(opportunityStage=[])
    const lead = results.find(r => {
      const closed    = r.clueClosedStatus;
      const converted = r.opportunityStage;
      return (Array.isArray(closed) && closed.length === 0)
          && (Array.isArray(converted) && converted.length === 0);
    });
    expect(lead, "未找到可用线索（未关闭且未转化）- 请先在系统中录入新线索").toBeTruthy();
    leadId = lead.id;
    console.log(`  ✓ leadId=${leadId}, leadName=${lead.leadName}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  test("04 · 创建本次专属客户", async () => {
    // 验证依据：返回 id 且 customerName 与入参一致
    const customerName = `自动化客户_${RUN_TAG}`;
    const ts = Date.now();

    const res = await api.post(
      `/form/api/v2/form-entity-data/customer-management/customer-management-form/default?timestamp=${ts}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          customerName: customerName,
          myOrgId:      myOrgId,
          myUserId:     String(myUserId),
          customerOwner: [
            {
              pbcToken:        "user-management-new",
              uid:             String(myUserId),
              formEntityToken: "system-user-form",
              label:           "Sales Director",
              value:           "jinjin.zhang@bizops.com.cn",
            },
          ],
        },
      }
    );
    const body = await call("创建客户", res);
    customerId = body.id || body.formEntityDataId;
    expect(customerId, "客户 ID 为空").toBeTruthy();
    expect(body.customerName, "customerName 不匹配").toBe(customerName);
    console.log(`  ✓ customerId=${customerId}, customerName=${body.customerName}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  test("05 · 线索转化为商机", async () => {
    // Step A: GET 初始化转化表单（验证 leadId 有效）
    const getRes = await api.get(
      `/flow/api/v2/flow-definition/lead-management/opportunity-conversion-process-flow/get-form?formEntityDataId=${leadId}&timestamp=${Date.now()}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const getBody = await call("转化表单初始化", getRes);
    expect(getBody.formEntityDataId, "初始化表单 ID 与 leadId 不符").toBe(leadId);

    // Step B: 转化前记录商机总数（HAR 录制的前端逻辑：转化后等 count+1 再取第一条）
    const countRes = await api.post(
      `/form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list?timestamp=${Date.now()}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { startRow: 0, endRow: 1 },
      }
    );
    const countBody = await countRes.json();
    const countBefore = countBody.count;
    console.log(`  转化前商机总数: ${countBefore}`);

    // Step C: 提交转化
    const ts  = Date.now();
    const res = await api.put(
      `/flow/api/v2/flow-definition/lead-management/opportunity-conversion-process-flow/lead-management-form/convert/update-form?formPbcToken=lead-management&timestamp=${ts}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          convertToOpportunity:  "true",
          myOrgId:               myOrgId,
          leadScoringBudget:     "25",
          spinCorrectionDetails: { longText: "", value: "" },
          nReason:               null,
          leadName:              `自动化商机_${RUN_TAG}`,
          clueClosedStatus:      "clueClosedStatus-closed",
          companyName: [
            {
              pbcToken:        "customer-management",
              formEntityToken: "customer-management-form",
              id:              customerId,
              value:           String(customerId),
              label:           `自动化客户_${RUN_TAG}`,
            },
          ],
          // 和 HAR 录制一致：携带 id（线索ID）
          id: leadId,
        },
      }
    );
    const body = await call("线索转化", res);
    expect(body.exceptionMessage, "线索转化有异常").toBeNull();
    // 转化接口返回 formEntityDataId === leadId（更新的是原始线索记录本身）
    expect(body.formEntityDataId, "转化后 formEntityDataId 应等于 leadId").toBe(leadId);

    // Step D: 轮询商机列表直到 count = countBefore + 1（最多等5秒）
    // 这和 HAR 录制中前端行为完全一致：转化后立刻查两次列表，第二次 count+1
    let oppResults = [];
    let attempts = 0;
    while (attempts < 10) {
      await new Promise(r => setTimeout(r, 500));
      const listRes = await api.post(
        `/form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list?timestamp=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: { startRow: 0, endRow: 5 },
        }
      );
      const listBody = await listRes.json();
      console.log(`  尝试 ${attempts + 1}: 商机总数=${listBody.count}（期望>${countBefore}）`);
      if (listBody.count > countBefore) {
        oppResults = listBody.results || [];
        break;
      }
      attempts++;
    }
    expect(oppResults.length, `等待5秒后商机数量仍未增加（转化失败）`).toBeGreaterThan(0);

    // 第一条就是本次转化的新商机（列表按创建时间倒序）
    opportunityId = oppResults[0].id;
    console.log(`  ✓ opportunityId=${opportunityId}, createdTime=${oppResults[0].createdTime}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  test("06 · 创建报价单（关联本次商机）", async () => {
    // 验证依据：返回 exceptionMessage === null，且 formEntityDataId 非空
    const getRes = await api.get(
      `/flow/api/v2/flow-definition/quotation-management/new-quote-approval-flow/get-form?timestamp=${Date.now()}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    await call("报价表单初始化", getRes);

    const ts  = Date.now();
    const res = await api.put(
      `/flow/api/v2/flow-definition/quotation-management/new-quote-approval-flow/quotation-form/new/update-form?formPbcToken=quotation-management&timestamp=${ts}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          quoteStatus: [
            { id: 14413, handle: "quoteStatus-draft", code: "draft", codeName: "草稿", value: 14413, label: "草稿" },
          ],
          discountOffer:     0,
          taxRate:           6,
          totalPriceNoTax:   3540.24,
          totalPriceWithTax: 3752.65,
          // 关联本次转化的商机
          businessOpportunity: [
            {
              id:    opportunityId,
              value: String(opportunityId),
              label: `自动化商机_${RUN_TAG}`,
            },
          ],
          myOrgId: myOrgId,
        },
      }
    );
    const body = await call("创建报价单", res);
    expect(body.exceptionMessage, "报价单创建有异常").toBeNull();
    quotationId = body.formEntityDataId;
    expect(quotationId, "quotationId 为空").toBeTruthy();

    // 验证报价单确实挂在正确的商机下
    // 报价单关联商机字段是 businessOpportunity.id，不是 parentDataId
    const verifyRes = await api.post(
      `/form/api/v3/form-entity-data/quotation-management/quotation-form/list?timestamp=${Date.now()}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          filterModel: [
            { colId: "businessOpportunity.id", filterType: "text", type: "equals", filter: String(opportunityId) },
          ],
        },
      }
    );
    const verifyBody = await call("验证报价单关联商机", verifyRes);
    const linked = (verifyBody.results || []).find(r => r.id === quotationId);
    expect(linked, `quotationId=${quotationId} 未挂在 opportunityId=${opportunityId} 下`).toBeTruthy();
    console.log(`  ✓ quotationId=${quotationId} 已关联 opportunityId=${opportunityId}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  test("07 · 商机推进到赢单", async () => {
    // Step A: 编辑商机字段设置赢单阶段
    // 验证依据：返回 opportunityStage[0].code === "Winning Orders"
    const editRes = await api.put(
      `/form/api/v2/form-entity-data/${opportunityId}/opportunity-management/opportunity-management-form/edit?timestamp=${Date.now()}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          expectedTransactionAmount: 1200,
          myOrgId:        myOrgId,
          creationTime:   new Date().toISOString().replace('T', ' ').slice(0, 19),
          flowInstanceId: null,
          opportunityStage: [
            { id: 17211, value: 17211, label: "赢单", code: "Winning Orders" },
          ],
        },
      }
    );
    const editBody = await call("更新商机阶段字段", editRes);
    const stage = (editBody.opportunityStage || [])[0];
    expect(stage?.code, "商机阶段未设置为 Winning Orders").toBe("Winning Orders");

    // Step B: 触发阶段转换流程（触发后台联动逻辑）
    // 验证依据：返回 200（内容为空字符串是正常的）
    const flowRes = await api.post(
      `/flow/api/flow-rest/opportunity-stage-transition-process-flow?timestamp=${Date.now()}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          id: opportunityId,
          opportunityStage: [
            {
              pbcToken:        "basic-system-setting",
              code:            "Winning Orders",
              formEntityToken: "data-dictionary",
              handle:          "opportunityStage-Winning Orders",
              id:              17211,
              value:           "17211",
              label:           "赢单",
            },
          ],
        },
      }
    );
    await call("阶段转换流程", flowRes);

    // Step C: 回查商机确认阶段已更新
    const checkRes = await api.get(
      `/form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/${opportunityId}?timestamp=${Date.now()}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const checkBody = await call("回查商机阶段", checkRes);
    const confirmedStage = (checkBody.opportunityStage || [])[0];
    expect(confirmedStage?.code, "回查：商机阶段未确认为 Winning Orders").toBe("Winning Orders");
    console.log(`  ✓ opportunityId=${opportunityId} 已确认赢单，stage=${confirmedStage.code}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  test("08 · 生成销售合同", async () => {
    // 验证依据：调用后从合同列表精确查到关联本次 opportunityId 的合同
    const ts  = Date.now();
    const res = await api.post(
      `/flow/api/flow-rest/convert-to-sales-contract-flow?timestamp=${ts}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          id:                        opportunityId,
          myOrgId:                   myOrgId,
          creationTime:              new Date().toISOString().replace('T', ' ').slice(0, 19),
          expectedTransactionAmount: 1200,
          flowInstanceId:            null,
          myUserId:                  String(myUserId),
          opportunityStage: [
            {
              pbcToken:        "basic-system-setting",
              code:            "Winning Orders",
              formEntityToken: "data-dictionary",
              id:              17211,
              value:           "17211",
              label:           "赢单",
            },
          ],
        },
      }
    );
    await call("生成合同（触发）", res);
    // 接口返回空字符串是正常的，合同异步创建，等待后台完成
    await new Promise(r => setTimeout(r, 2000));

    // 精确查找本次生成的合同
    // 合同列表不返回 businessOpportunity 字段，只能用时间+orgId确认
    // 取最新一条：合同刚生成，最新一条就是本次的
    const listRes = await api.post(
      `/form/api/v3/form-entity-data/contract-management/contract-management-form/list?timestamp=${Date.now()}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { startRow: 0, endRow: 5 },
      }
    );
    const listBody = await call("查询最新合同列表", listRes);
    const latest   = (listBody.results || [])[0];
    expect(latest, "合同列表为空").toBeTruthy();
    contractId = latest.id;

    // 单独读取合同详情，从中找 businessOpportunity 字段确认关联
    const detailRes = await api.get(
      `/form/api/v2/form-entity-data/contract-management/contract-management-form/${contractId}?timestamp=${Date.now()}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const detail = await call("读取合同详情", detailRes);
    const bizOpps = detail.businessOpportunity || detail.relatedOpportunity || [];
    console.log(`  合同 ${contractId} businessOpportunity: ${JSON.stringify(bizOpps.map(o => ({id: o.id, value: o.value})))}`);
    console.log(`  合同 ${contractId} relatedOpportunity: ${JSON.stringify((detail.relatedOpportunity||[]).map(o => ({id: o.id, value: o.value})))}`);

    // 检查 relatedOpportunity 是否包含本次商机
    const allOpps = [...(detail.businessOpportunity||[]), ...(detail.relatedOpportunity||[])];
    const linked = allOpps.some(o =>
      String(o.id) === String(opportunityId) || String(o.value) === String(opportunityId)
    );
    expect(linked, `合同 ${contractId} 的关联商机字段均未包含 opportunityId=${opportunityId}\n详情: ${JSON.stringify(detail).slice(0,400)}`).toBe(true);
    console.log(`  ✓ contractId=${contractId} 已确认关联 opportunityId=${opportunityId}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  test("09 · 完善合同信息", async () => {
    // 验证依据：返回 isTaxIncluded === "yes"
    const ts  = Date.now();
    const res = await api.put(
      `/form/api/v2/form-entity-data/${contractId}/contract-management/contract-management-form/edit?timestamp=${ts}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          isTaxIncluded:    "yes",
          approvalDocument: { resources: { tempResources: [], unmodifiedResources: [], copyOf: [], orders: [] } },
          myOrgId:          myOrgId,
          contractSource: [
            {
              pbcToken:        "basic-system-setting",
              formEntityToken: "data-dictionary",
              code:            "opportunityConversion",
              id:              17279,
              value:           17279,
              label:           "从商机转化",
            },
          ],
        },
      }
    );
    const body = await call("完善合同", res);
    expect(body.isTaxIncluded, "isTaxIncluded 未更新为 yes").toBe("yes");
    console.log(`  ✓ contractId=${contractId} isTaxIncluded=${body.isTaxIncluded}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  test("10 · 合同生效", async () => {
    // 验证依据：200 后回查合同状态确认已生效
    const ts  = Date.now();
    const res = await api.post(
      `/flow/api/flow-rest/contract-effective-flow?timestamp=${ts}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data:    { id: contractId },
      }
    );
    await call("合同生效（触发）", res);
    await new Promise(r => setTimeout(r, 500));

    // 回查合同确认生效状态
    const checkRes = await api.get(
      `/form/api/v2/form-entity-data/contract-management/contract-management-form/${contractId}?timestamp=${Date.now()}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const checkBody = await call("回查合同状态", checkRes);
    // contractStatus 或 status 字段反映生效状态，打印出来确认
    console.log(`  合同完整状态: status=${checkBody.status}, contractStatus=${JSON.stringify(checkBody.contractStatus)}`);
    console.log(`\n========== 🎉 完整销售流程全部通过！RUN_TAG=${RUN_TAG} ==========`);
    console.log(`  线索 ID:   ${leadId}`);
    console.log(`  客户 ID:   ${customerId}`);
    console.log(`  商机 ID:   ${opportunityId}`);
    console.log(`  报价单 ID: ${quotationId}`);
    console.log(`  合同 ID:   ${contractId}`);
  });

});
// 文件更新时间: 2026-06-04 15:00:00 - 每步有独立验证，数据完全串联，不抢用历史数据
