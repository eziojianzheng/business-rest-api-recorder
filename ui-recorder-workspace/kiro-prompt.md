# UI Recorder - Kiro AI Context

**Session**: session-auto-1782285132893
**URL**: https://bot.ceta.crm.duxing.cn/ui/login/
**Current Step**: record

## Files
- UI Script: `C:\Users\ADMIN\Desktop\ceta-skills-windows-amd64-2.0.27\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\ui-script.js`
- HAR Network: `C:\Users\ADMIN\Desktop\ceta-skills-windows-amd64-2.0.27\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\network.har`
- Semantic: `C:\Users\ADMIN\Desktop\ceta-skills-windows-amd64-2.0.27\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\semantic-script.md`
- API Script: `C:\Users\ADMIN\Desktop\ceta-skills-windows-amd64-2.0.27\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\api-script.spec.js`

## Summary
- UI Steps: 2
- Total APIs: 41
- Business APIs: 19

## Business API List
- GET /ui/login/
- GET /ui/bot-config.js
- GET /ui/js/main.a88ee666-33f2-4bd7-af60-8bd72c85da4a.bundle.js
- GET /ui/css/main.a88ee666-33f2-4bd7-af60-8bd72c85da4a.bundle.css
- GET /ui/packages/ag-grid@33.3.2/ag-grid.a88ee666-33f2-4bd7-af60-8bd72c85da4a.bundle.js
- GET /ui/js/aiAgentV2.a88ee666-33f2-4bd7-af60-8bd72c85da4a.chunk.js
- GET /ui/js/aiAgent.a88ee666-33f2-4bd7-af60-8bd72c85da4a.chunk.js
- GET /ui/packages/reactflow@11.8.3/reactflow.a88ee666-33f2-4bd7-af60-8bd72c85da4a.bundle.js
- GET /ui/packages/@wangeditor@5.0.1/@wangeditor.a88ee666-33f2-4bd7-af60-8bd72c85da4a.bundle.js
- GET /ui/js/markdown.a88ee666-33f2-4bd7-af60-8bd72c85da4a.chunk.js

## Current UI Script
```javascript
import { test, expect } from '@playwright/test';

test.use({
  serviceWorkers: 'block'
});

test('test', async ({ page }) => {
  await page.routeFromHAR('C:\\Users\\ADMIN\\Desktop\\ceta-skills-windows-amd64-2.0.27\\ceta-skills-windows-amd64-2.0.27\\ceta-ai-skills-windows-amd64\\ceta-ai-skills\\ui-recorder-workspace\\network.har');
  await page.goto('https://bot.ceta.crm.duxing.cn/ui/login/basic?auth=basic');
});
```