export function parseSurgeLike(text) {
    const lines = text.split('\n');
    const nodes = [];
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#') || line.startsWith('//')) continue;
        
        const match = line.match(/^(?:Node\s*=\s*|Proxy\s*=\s*)?(.+?)\s*=\s*(ss|vmess|trojan|vless)\s*,\s*([^,]+)\s*,\s*([^,]+)(.*)/);
        if (!match) continue;
        const [_, name, type, server, port, paramsRaw] = match;
        const params = {};
        paramsRaw.split(',').forEach(p => {
            const [k, v] = p.split('=').map(s => s.trim());
            if (k && v) params[k] = v;
        });
        if (type === 'ss') {
            if (params['encrypt-method'] && params['password']) {
                const userinfo = btoa(`${params['encrypt-method']}:${params['password']}`);
                nodes.push(`ss://${userinfo}@${server}:${port}#${encodeURIComponent(name)}`);
            }
        } else if (type === 'vmess') {
            if (params['username']) {
                const vmessJson = {
                    v: "2", ps: name, add: server, port: port, id: params['username'],
                    aid: "0", scy: "auto", net: "tcp", type: "none", host: "", path: "", tls: ""
                };
                if (params['tls'] === 'true') vmessJson.tls = 'tls';
                if (params['sni']) vmessJson.sni = params['sni'];
                if (params['ws'] === 'true') {
                    vmessJson.net = 'ws';
                    if (params['ws-path']) vmessJson.path = params['ws-path'];
                    if (params['ws-headers']) {
                        const hostMatch = params['ws-headers'].match(/Host:([^|]+)/);
                        if (hostMatch) vmessJson.host = hostMatch[1];
                    }
                }
                nodes.push('vmess://' + btoa(JSON.stringify(vmessJson)));
            }
        } else if (type === 'trojan') {
            if (params['password']) {
                let link = `trojan://${params['password']}@${server}:${port}?security=tls`;
                if(params['sni']) link += `&sni=${params['sni']}`;
                if(params['skip-cert-verify'] === 'true') link += `&allowInsecure=1`;
                if(params['ws'] === 'true') {
                    link += `&type=ws`;
                    if(params['ws-path']) link += `&path=${encodeURIComponent(params['ws-path'])}`;
                    if(params['ws-headers']) {
                        const hostMatch = params['ws-headers'].match(/Host:"([^"]+)"/);
                        if(hostMatch) link += `&host=${hostMatch[1]}`;
                    }
                }
                link += `#${encodeURIComponent(name)}`;
                nodes.push(link);
            }
        } else if (type === 'vless') {
             if (params['username']) {
                let link = `vless://${params['username']}@${server}:${port}?encryption=none`;
                if(params['tls'] === 'true') link += `&security=tls`;
                if(params['sni']) link += `&sni=${params['sni']}`;
                if(params['skip-cert-verify'] === 'true') link += `&allowInsecure=1`;
                if(params['network'] === 'ws' || params['ws'] === 'true') {
                    link += `&type=ws`;
                    if(params['ws-path']) link += `&path=${encodeURIComponent(params['ws-path'])}`;
                    if(params['ws-headers']) {
                         const hostMatch = params['ws-headers'].match(/Host:"([^"]+)"/);
                        if (hostMatch) link += `&host=${hostMatch[1]}`;
                    }
                }
                link += `#${encodeURIComponent(name)}`;
                nodes.push(link);
             }
        }
    }
    return nodes;
}

export function toClash(link) {
    try {
        if (link.startsWith('vmess://')) {
            const b = link.replace('vmess://', '');
            const c = JSON.parse(decodeURIComponent(escape(atob(b))));
            let str = `  - name: ${c.ps}\n    type: vmess\n    server: ${c.add}\n    port: ${c.port}\n    uuid: ${c.id}\n    alterId: ${c.aid||0}\n    cipher: auto`;
            if (c.tls === 'tls') { str += `\n    tls: true\n    servername: ${c.sni || c.host || c.add}\n    skip-cert-verify: true`; }
            if (c.net === 'ws') { str += `\n    network: ws\n    ws-opts:\n      path: ${c.path}\n      headers:\n        Host: ${c.host}`; }
            return str;
        }
        if (link.startsWith('ss://')) {
            let name = 'SS-Node';
            if(link.includes('#')) { name = decodeURIComponent(link.split('#')[1]); link = link.split('#')[0]; }
            let body = link.replace('ss://', '');
            if(!body.includes('@')) { try { body = atob(body); } catch(e){} }
            if (body.includes('@') && body.includes(':')) {
                const [creds, endpoint] = body.split('@');
                const [method, pass] = creds.split(':');
                const [server, port] = endpoint.split(':');
                return `  - name: ${name}\n    type: ss\n    server: ${server}\n    port: ${port}\n    cipher: ${method}\n    password: ${pass}`;
            }
        }
        if (link.startsWith('trojan://')) {
            const u = new URL(link);
            const name = u.hash ? decodeURIComponent(u.hash.substring(1)) : 'Trojan-Node';
            let str = `  - name: ${name}\n    type: trojan\n    server: ${u.hostname}\n    port: ${u.port}\n    password: ${u.username}`;
            if(u.searchParams.get('sni')) str += `\n    sni: ${u.searchParams.get('sni')}`;
            if(u.searchParams.get('allowInsecure') === '1') str += `\n    skip-cert-verify: true`;
            return str;
        }
    } catch(e) {}
    return null;
}

export function toSurge(link) {
    try {
        let name = 'Unamed';
        if (link.startsWith('vmess://')) {
            const b = link.replace('vmess://', '');
            const c = JSON.parse(decodeURIComponent(escape(atob(b))));
            name = c.ps || 'VMess';
            let str = `${name} = vmess, ${c.add}, ${c.port}, username=${c.id}`;
            str += ', vmess-aead=true';
            
            if (c.tls === 'tls') { 
                str += ', tls=true';
                if(c.sni) str += `, sni=${c.sni}`; 
            }
            if (c.net === 'ws') { 
                str += ', ws=true';
                if(c.path) str += `, ws-path=${c.path}`; 
                if(c.host) str += `, ws-headers=Host:"${c.host}"`;
            }
            return str;
        }
        if (link.startsWith('ss://')) {
            if(link.includes('#')) { name = decodeURIComponent(link.split('#')[1]); link = link.split('#')[0]; }
            let body = link.replace('ss://', '');
            if(!body.includes('@')) { try { body = atob(body); } catch(e){} }
            if (body.includes('@') && body.includes(':')) {
                const [creds, endpoint] = body.split('@');
                const [method, pass] = creds.split(':');
                const [server, port] = endpoint.split(':');
                return `${name} = ss, ${server}, ${port}, encrypt-method=${method}, password=${pass}`;
            }
        }
        if (link.startsWith('trojan://')) {
            const u = new URL(link);
            name = u.hash ? decodeURIComponent(u.hash.substring(1)) : 'Trojan';
            let str = `${name} = trojan, ${u.hostname}, ${u.port}, password=${u.username}`;
            if(u.searchParams.get('sni')) str += `, sni=${u.searchParams.get('sni')}`;
            if(u.searchParams.get('allowInsecure') === '1') str += `, skip-cert-verify=true`;
            if(u.searchParams.get('type') === 'ws') {
                str += ', ws=true';
                if(u.searchParams.get('path')) str += `, ws-path=${u.searchParams.get('path')}`;
                if(u.searchParams.get('host')) str += `, ws-headers=Host:"${u.searchParams.get('host')}"`;
            }
            return str;
        }
    } catch(e) {}
    return '# Unsupported Node';
}