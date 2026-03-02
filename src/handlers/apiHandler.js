import { parseSurgeLike } from '../utils/converters.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 提取的 processImport 工具函数，需要传入 env 以操作 KV
const processImport = async (env, targetUrl, subName) => {
    const resp = await fetch(targetUrl, { headers: { 'User-Agent': 'v2rayN/6.33' } });
    if (!resp.ok) throw new Error('Fetch failed');
    
    let rawText = await resp.text();
    let newNodes = [];
    const regex = /^(vmess|vless|ss|trojan|hysteria2?):\/\//;
    let candidates = rawText.split(/\s+/).filter(n => n && n.match(regex));
    if (candidates.length > 0) newNodes = candidates;
    if (newNodes.length === 0) {
        try {
            const decoded = atob(rawText);
            candidates = decoded.split(/\s+/).filter(n => n && n.match(regex));
            if (candidates.length > 0) newNodes = candidates;
            else newNodes = parseSurgeLike(decoded);
        } catch(e) {
            newNodes = parseSurgeLike(rawText);
        }
    }
    if (newNodes.length === 0) return 0;
    
    let currentNodes = await env.SUB_STORE.get(`NODES_${subName}`, { type: 'json' }) || [];
    const merged = [...currentNodes, ...newNodes];
    const uniqueNodes = [...new Set(merged)];
    await env.SUB_STORE.put(`NODES_${subName}`, JSON.stringify(uniqueNodes));
    return newNodes.length;
};

export async function handleApi(request, env, url, path) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    
    // 登录
    if (path === '/api/login' && request.method === 'POST') {
        try {
            const body = await request.json();
            if (body.password === env.ADMIN_PASSWORD) {
                return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: corsHeaders });
            }
        } catch (e) {}
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // 鉴权
    const auth = request.headers.get('Authorization');
    if (auth !== env.ADMIN_PASSWORD) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    const commonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

    if (path === '/api/subs' && request.method === 'GET') {
        const names = await env.SUB_STORE.get('SUBS', { type: 'json' }) || [];
        const configs = await env.SUB_STORE.get('SUB_CONFIGS', { type: 'json' }) || {};
        const result = names.map(name => ({ 
            name, enabled: configs[name]?.enabled ?? true, url: configs[name]?.url || '' 
        }));
        return new Response(JSON.stringify(result), { headers: commonHeaders });
    }

    if (path === '/api/status' && request.method === 'POST') {
        const body = await request.json();
        const { name, enabled } = body;
        const configs = await env.SUB_STORE.get('SUB_CONFIGS', { type: 'json' }) || {};
        configs[name] = { ...configs[name], enabled };
        await env.SUB_STORE.put('SUB_CONFIGS', JSON.stringify(configs));
        return new Response('Updated', { status: 200, headers: commonHeaders });
    }

    if (path === '/api/nodes') {
        if (request.method === 'GET') {
            const subName = url.searchParams.get('sub');
            if (!subName) return new Response('[]', { headers: commonHeaders });
            const nodes = await env.SUB_STORE.get(`NODES_${subName}`, { type: 'json' }) || [];
            return new Response(JSON.stringify(nodes), { headers: commonHeaders });
        }
        if (request.method === 'POST') {
            const body = await request.json();
            if (body.sub) {
                const uniqueNodes = [...new Set(body.nodes)].filter(n => n && n.length > 5);
                await env.SUB_STORE.put(`NODES_${body.sub}`, JSON.stringify(uniqueNodes));
                return new Response(JSON.stringify({ count: uniqueNodes.length }), { status: 200, headers: commonHeaders });
            }
            return new Response('Missing sub', { status: 400, headers: commonHeaders });
        }
    }

    if (path === '/api/import' && request.method === 'POST') {
        try {
            const body = await request.json();
            if (!body.sub) return new Response('Missing sub', { status: 400, headers: commonHeaders });
            
            let count = 0;
            if (body.url) {
                count = await processImport(env, body.url, body.sub);
            }
            
            const configs = await env.SUB_STORE.get('SUB_CONFIGS', { type: 'json' }) || {};
            configs[body.sub] = { ...configs[body.sub], url: body.url || '' };
            await env.SUB_STORE.put('SUB_CONFIGS', JSON.stringify(configs));
            
            return new Response(JSON.stringify({ count }), { status: 200, headers: commonHeaders });
        } catch (e) { 
            return new Response('Error: ' + e.message, { status: 500, headers: commonHeaders });
        }
    }

    if (path === '/api/refresh_sub' && request.method === 'POST') {
        try {
            const body = await request.json();
            const configs = await env.SUB_STORE.get('SUB_CONFIGS', { type: 'json' }) || {};
            const remoteUrl = configs[body.sub]?.url;
            if(!remoteUrl) return new Response('No URL bound', { status: 400, headers: commonHeaders });
            await processImport(env, remoteUrl, body.sub);
            const nodes = await env.SUB_STORE.get(`NODES_${body.sub}`, { type: 'json' }) || [];
            return new Response(JSON.stringify({ count: nodes.length }), { status: 200, headers: commonHeaders });
        } catch (e) { return new Response('Error', { status: 500, headers: commonHeaders }); }
    }

    if (path === '/api/reorder_subs' && request.method === 'POST') {
        try {
            const body = await request.json();
            if (Array.isArray(body.subs)) {
                await env.SUB_STORE.put('SUBS', JSON.stringify(body.subs));
                return new Response('Order Saved', { status: 200, headers: commonHeaders });
            }
            return new Response('Invalid Data', { status: 400, headers: commonHeaders });
        } catch (e) { return new Response('Error', { status: 500, headers: commonHeaders }); }
    }

    if (path === '/api/clear_all_subs' && request.method === 'POST') {
        try {
            const list = await env.SUB_STORE.list({ prefix: 'NODES_' });
            const deletions = list.keys.map(k => env.SUB_STORE.delete(k.name));
            await Promise.all([
                ...deletions,
                env.SUB_STORE.put('SUBS', '[]'),
                env.SUB_STORE.put('SUB_CONFIGS', '{}')
            ]);
            return new Response('Cleared', { status: 200, headers: commonHeaders });
        } catch (e) { return new Response('Error', { status: 500, headers: commonHeaders }); }
    }

    if (path === '/api/clear_nodes' && request.method === 'POST') {
        try {
            const body = await request.json();
            if (!body.sub) return new Response('Missing sub', { status: 400, headers: commonHeaders });
            await env.SUB_STORE.put(`NODES_${body.sub}`, '[]');
            return new Response('Cleared', { status: 200, headers: commonHeaders });
        } catch (e) { return new Response('Error', { status: 500, headers: commonHeaders }); }
    }

    if (path === '/api/subs') {
        if (request.method === 'POST') {
            const body = await request.json();
            if(!body.name) return new Response('Name required', { status: 400, headers: corsHeaders });
            let subs = await env.SUB_STORE.get('SUBS', { type: 'json' }) || [];
            if (!subs.includes(body.name)) {
                subs.push(body.name);
                await env.SUB_STORE.put('SUBS', JSON.stringify(subs));
            }
            return new Response('Created', { status: 200, headers: commonHeaders });
        }
        if (request.method === 'PUT') {
            const body = await request.json();
            const { oldName, newName } = body;
            let subs = await env.SUB_STORE.get('SUBS', { type: 'json' }) || [];
            if(subs.includes(newName)) return new Response('Exists', { status: 409, headers: commonHeaders });
            const idx = subs.indexOf(oldName);
            if(idx === -1) return new Response('Not found', { status: 404, headers: commonHeaders });
            subs[idx] = newName;
            
            const nodes = await env.SUB_STORE.get(`NODES_${oldName}`, { type: 'json' }) || [];
            const configs = await env.SUB_STORE.get('SUB_CONFIGS', { type: 'json' }) || {};
            if (configs[oldName]) { 
                configs[newName] = configs[oldName]; 
                delete configs[oldName];
            }
            await Promise.all([
                env.SUB_STORE.put('SUBS', JSON.stringify(subs)),
                env.SUB_STORE.put(`NODES_${newName}`, JSON.stringify(nodes)),
                env.SUB_STORE.put('SUB_CONFIGS', JSON.stringify(configs)),
                env.SUB_STORE.delete(`NODES_${oldName}`)
            ]);
            return new Response('Renamed', { status: 200, headers: commonHeaders });
        }
        if (request.method === 'DELETE') {
            const name = url.searchParams.get('name');
            let subs = await env.SUB_STORE.get('SUBS', { type: 'json' }) || [];
            const newSubs = subs.filter(s => s !== name);
            const configs = await env.SUB_STORE.get('SUB_CONFIGS', { type: 'json' }) || {};
            delete configs[name];
            await Promise.all([
                env.SUB_STORE.put('SUBS', JSON.stringify(newSubs)),
                env.SUB_STORE.put('SUB_CONFIGS', JSON.stringify(configs)),
                env.SUB_STORE.delete(`NODES_${name}`)
            ]);
            return new Response('Deleted', { status: 200, headers: commonHeaders });
        }
    }

    return new Response('API Endpoint Not Found', { status: 404, headers: corsHeaders });
}