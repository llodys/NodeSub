import { toClash, toSurge } from '../utils/converters.js';

export async function handleSub(request, env, url, path) {
    const subName = path.split('/')[2];
    const configs = await env.SUB_STORE.get('SUB_CONFIGS', { type: 'json' }) || {};
    const config = configs[subName] || { enabled: true };
    
    if (config.enabled === false) return new Response('Subscription Disabled', { status: 403 });
    
    const subs = await env.SUB_STORE.get('SUBS', { type: 'json' }) || [];
    if (!subs.includes(subName)) return new Response('Not found', { status: 404 });
    
    let nodes = await env.SUB_STORE.get(`NODES_${subName}`, { type: 'json' }) || [];
    const formatParam = url.searchParams.get('format');
    const typeParam = url.searchParams.get('type');

    if (typeParam) {
        const target = typeParam.toLowerCase();
        nodes = nodes.filter(link => {
            const l = link.trim();
            let type = '';
            if (l.startsWith('vmess://')) type = 'vmess';
            else if (l.startsWith('ss://')) type = 'ss';
            else if (l.startsWith('ssr://')) type = 'ssr';
            else if (l.startsWith('trojan://')) type = 'trojan';
            else if (l.startsWith('vless://')) type = 'vless';
            else if (l.startsWith('hy2://') || l.startsWith('hysteria2://')) type = 'hysteria2';
            else { 
                try { 
                    const u = new URL(l); 
                    type = u.protocol.replace(':', '').toLowerCase(); 
                } catch(e) {} 
            }
            if (target === 'hysteria2' && type === 'hy2') return true;
            return type === target;
        });
    }

    if (formatParam === 'surge') {
        const surgeNodes = nodes.map(n => toSurge(n)).filter(line => !line.startsWith('# Unsupported'));
        return new Response(surgeNodes.join('\n'), { headers: { 'Content-Type': 'text/plain;charset=UTF-8' } });
    }

    if (formatParam === 'clash') {
        const proxies = nodes.map(n => toClash(n)).filter(n => n !== null);
        const names = proxies.map(p => p.match(/name: (.*)/)[1]);
        let yaml = `port: 7890\nsocks-port: 7891\nallow-lan: true\nmode: Rule\nlog-level: info\nexternal-controller: :9090\nproxies:\n${proxies.join('\n')}\nproxy-groups:\n`;
        yaml += `  - name: 🚀 Proxy\n    type: select\n    proxies:\n      - ♻️ Automatic\n${names.map(n => `      - ${n}`).join('\n')}\n`;
        yaml += `  - name: ♻️ Automatic\n    type: url-test\n    url: http://www.gstatic.com/generate_204\n    interval: 300\n    proxies:\n${names.map(n => `      - ${n}`).join('\n')}\n`;
        yaml += `rules:\n  - MATCH,🚀 Proxy`;
        return new Response(yaml, { headers: { 'Content-Type': 'text/yaml;charset=UTF-8' } });
    }
    
    return new Response(btoa(unescape(encodeURIComponent(nodes.join('\n')))), { headers: { 'Content-Type': 'text/plain;charset=UTF-8' } });
}