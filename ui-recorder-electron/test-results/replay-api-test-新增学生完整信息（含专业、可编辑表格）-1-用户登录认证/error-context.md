# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: replay-api-test.spec.js >> 新增学生完整信息（含专业、可编辑表格） >> 1. 用户登录认证
- Location: ui-recorder-electron\replay-api-test.spec.js:38:3

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:9220
Call log:
  - → POST http://localhost:9220/user-management/api/user/login
    - user-agent: Playwright/1.60.0 (x64; windows 10.0) node/18.18
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 144

```