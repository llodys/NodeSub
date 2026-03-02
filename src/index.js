import { HTML } from './views/template.js';
import { handleSub } from './handlers/subHandler.js';
import { handleApi } from './handlers/apiHandler.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 前置环境检查
    if (!env.SUB_STORE || !env.ADMIN_PASSWORD) {
      return new Response('Config Error: Missing SUB_STORE KV or ADMIN_PASSWORD', { status: 500 });
    }

    // 1. 渲染前端页面
    if (path === '/' || path === '/index.html') {
      return new Response(HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // 2. 客户端订阅路由分发
    if (path.startsWith('/sub/')) {
      return await handleSub(request, env, url, path);
    }

    // 3. 管理端 API 路由分发
    if (path.startsWith('/api/')) {
      return await handleApi(request, env, url, path);
    }

    // 404 处理
    return new Response('Not Found', { status: 404 });
  }
};