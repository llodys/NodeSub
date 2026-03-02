// src/views/script.js
export const SCRIPT = `
    let token = localStorage.getItem('sub_token') || '';
    const apiBase = '/api';
    let currentSubName = '';
    let currentNodes = [];
    let editingNodeIndex = -1;
    let subModalMode = 'create';
    let targetSubName = ''; 
    let deleteTargetType = '';
    let deleteTargetPayload = null;
    let allSubsCache = [];
    let isAdvancedEditMode = false;

    if(token) checkAuth();
    function showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i> ' + message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOutUp 0.3s ease-in forwards';
            setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 300);
        }, 2000);
    }

    function closeModal(modalId) { document.getElementById(modalId).classList.remove('show'); }
    
    function openSubModal(mode, oldName = '') {
        subModalMode = mode;
        targetSubName = oldName;
        const titleEl = document.getElementById('sub-modal-title');
        const inputEl = document.getElementById('sub-input-name');
        if(mode === 'create') {
            titleEl.innerText = '新增订阅';
            inputEl.value = '';
            inputEl.placeholder = '请输入订阅名称 (仅限字母数字)';
        } else {
            titleEl.innerText = '重命名订阅';
            inputEl.value = oldName;
            inputEl.placeholder = '请输入新的名称';
        }
        document.getElementById('sub-modal').classList.add('show');
        setTimeout(()=>inputEl.focus(), 100);
    }

    async function openLinkModal(subName, type) {
        const host = window.location.origin;
        let baseUrl = host + '/sub/' + subName;
        let currentSuffix = '';
        
        let title = '';
        if (type === 'surge') {
            currentSuffix = '?format=surge';
            title = 'Surge 订阅';
        } else if (type === 'clash') {
            currentSuffix = '?format=clash';
            title = 'Clash 订阅';
        } else {
            title = '通用订阅';
        }
        
        document.getElementById('link-modal-title').innerText = title;
        const input = document.getElementById('link-modal-input');
        input.value = baseUrl + currentSuffix;
        
        const copyBtn = document.getElementById('btn-copy-link');
        const newBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newBtn, copyBtn);
        newBtn.onclick = () => {
            input.select();
            navigator.clipboard.writeText(input.value).then(() => showToast('复制成功'));
            closeModal('link-modal');
        };
        
        document.getElementById('link-modal').classList.add('show');

        const filterArea = document.getElementById('link-filter-area');
        filterArea.innerHTML = '<span class="spinner-border spinner-border-sm text-secondary"></span> <span class="text-muted small">识别协议中...</span>';
        
        try {
            const res = await fetch(apiBase + '/nodes?sub=' + subName, { headers: { 'Authorization': token } });
            const nodes = await res.json();
            const types = new Set();
            nodes.forEach(n => {
                const info = parseNode(n);
                if(info.type && info.type !== 'OTHER') types.add(info.type);
            });
            const updateLink = (filterType, element) => {
                document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('active'));
                element.classList.add('active');
                
                let newUrl = baseUrl;
                const params = [];
                if(type === 'surge') params.push('format=surge');
                if(type === 'clash') params.push('format=clash');
                if(filterType !== 'all') params.push('type=' + filterType.toLowerCase());
                
                if(params.length > 0) newUrl += '?' + params.join('&');
                input.value = newUrl;
            };

            filterArea.innerHTML = '';
            if(types.size > 0) {
                const allChip = document.createElement('div');
                allChip.className = 'filter-chip active';
                allChip.innerText = '全部';
                allChip.onclick = () => updateLink('all', allChip);
                filterArea.appendChild(allChip);
                const sortOrder = ['VMESS', 'VLESS', 'TROJAN', 'SS', 'SSR'];
                Array.from(types).sort((a, b) => {
                    let idxA = sortOrder.indexOf(a);
                    let idxB = sortOrder.indexOf(b);
                    if (idxA === -1) idxA = 999;
                    if (idxB === -1) idxB = 999;
                    return idxA - idxB || a.localeCompare(b);
                }).forEach(t => {
                    const chip = document.createElement('div');
                    chip.className = 'filter-chip';
                    chip.innerText = t;
                    chip.onclick = () => updateLink(t, chip);
                    filterArea.appendChild(chip);
                });
            } else {
                filterArea.innerHTML = '<span class="text-muted small">无可用协议过滤</span>';
            }

        } catch (e) {
            filterArea.innerHTML = '<span class="text-danger small">加载失败</span>';
        }
    }

    async function saveSub() {
        const name = document.getElementById('sub-input-name').value.trim();
        if(!name) return showToast('名称不能为空');
        if(!/^[a-zA-Z0-9-_]+$/.test(name)) return showToast('名称包含非法字符');
        if(subModalMode === 'create') {
            await fetch(apiBase + '/subs', { method: 'POST', headers: { 'Authorization': token }, body: JSON.stringify({ name }) });
            showToast('创建成功');
        } else {
            if(name === targetSubName) { closeModal('sub-modal'); return; }
            const res = await fetch(apiBase + '/subs', { method: 'PUT', headers: { 'Authorization': token }, body: JSON.stringify({ oldName: targetSubName, newName: name }) });
            if(res.ok) showToast('重命名成功'); else showToast('重命名失败');
        }
        closeModal('sub-modal');
        loadSubs();
    }

    function openDeleteModal(type, payload) {
        deleteTargetType = type;
        deleteTargetPayload = payload;
        const titleEl = document.getElementById('delete-modal-title');
        const descEl = document.getElementById('delete-modal-desc');
        if(type === 'sub') {
            titleEl.innerText = '删除订阅?';
            descEl.innerText = '此操作无法撤销，该订阅组下的所有节点都将被清除。';
        } else if (type === 'node') {
            titleEl.innerText = '删除节点?';
            descEl.innerText = '确定要移除此节点吗？此操作将立即生效。';
        } else if (type === 'all_subs') {
            titleEl.innerText = '⚠️ 危险操作';
            descEl.innerText = '这将清空所有订阅分组和节点数据，且无法恢复！确认继续？';
        } else if (type === 'all_nodes') {
            titleEl.innerText = '清空节点?';
            descEl.innerText = '这将删除当前分组下的所有节点。';
        }
        document.getElementById('delete-confirm-modal').classList.add('show');
    }

    async function performDelete() {
        if(deleteTargetType === 'sub') {
            await fetch(apiBase + '/subs?name=' + deleteTargetPayload, { method: 'DELETE', headers: { 'Authorization': token } });
            showToast('订阅已删除');
            loadSubs();
        } else if (deleteTargetType === 'node') {
            const idx = deleteTargetPayload;
            currentNodes.splice(idx, 1);
            const searchInput = document.getElementById('node-search-input');
            if(searchInput && searchInput.value) {
                await fetch(apiBase + '/nodes', { method: 'POST', headers: {'Authorization': token}, body: JSON.stringify({sub: currentSubName, nodes: currentNodes}) });
                refreshCurrentNodes(); 
                searchInput.value = ''; 
                showToast('节点已删除');
            } else {
                saveNodesToServer();
            }
        } else if (deleteTargetType === 'all_subs') {
            await fetch(apiBase + '/clear_all_subs', { method: 'POST', headers: { 'Authorization': token } });
            showToast('所有数据已清空');
            loadSubs();
        } else if (deleteTargetType === 'all_nodes') {
            await fetch(apiBase + '/clear_nodes', { method: 'POST', headers: { 'Authorization': token }, body: JSON.stringify({ sub: currentSubName }) });
            refreshCurrentNodes();
            showToast('节点已清空');
        }
        closeModal('delete-confirm-modal');
    }

    function switchImportTab(e, tab) {
        e.preventDefault();
        document.querySelectorAll('.nav-pills .nav-link').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
        if(tab === 'paste') {
            document.getElementById('import-tab-paste').classList.remove('hide');
            document.getElementById('import-tab-url').classList.add('hide');
            document.getElementById('node-input').focus();
        } else {
            document.getElementById('import-tab-paste').classList.add('hide');
            document.getElementById('import-tab-url').classList.remove('hide');
            document.getElementById('import-url-input').focus();
        }
    }

    function decodeBase64Input() {
        const el = document.getElementById('node-input');
        const val = el.value.trim();
        if (!val) return showToast('输入为空，无法解码');
        try {
            let decoded = '';
            try {
                decoded = decodeURIComponent(escape(window.atob(val)));
            } catch(e) {
                decoded = window.atob(val);
            }
            if (decoded) {
                el.value = decoded;
                showToast('Base64 解码成功');
            }
        } catch (e) {
            showToast('解码失败：该文本不是有效的 Base64 格式');
        }
    }

    async function importFromUrl() {
        const url = document.getElementById('import-url-input').value.trim();
        const btn = document.getElementById('btn-import-url');
        const btnText = document.getElementById('btn-import-text');
        const spinner = document.getElementById('btn-import-spinner');
        btn.disabled = true;
        btnText.innerText = '处理中...';
        spinner.classList.remove('hide');
        try {
            const res = await fetch(apiBase + '/import', { method: 'POST', headers: { 'Authorization': token }, body: JSON.stringify({ sub: currentSubName, url: url }) });
            if(res.ok) {
                const data = await res.json();
                if (url) { showToast('成功导入 ' + data.count + ' 个节点'); } else { showToast('已取消远程绑定并保存'); }
                refreshCurrentNodes();
                toggleAddNode();
                document.getElementById('import-url-input').value = ''; 
            } else { 
                showToast('操作失败，请检查链接');
            }
        } catch(e) { 
            showToast('网络错误');
        } finally {
            btn.disabled = false;
            btnText.innerText = '绑定并导入'; 
            spinner.classList.add('hide');
        }
    }

    async function refreshSubFromUrl(subName, e) {
        e.stopPropagation();
        const icon = document.getElementById('icon-refresh-' + subName);
        icon.classList.add('spinner-refresh'); 
        try {
            const res = await fetch(apiBase + '/refresh_sub', { method: 'POST', headers: { 'Authorization': token }, body: JSON.stringify({ sub: subName }) });
            if(res.ok) {
                const data = await res.json();
                showToast('已更新，当前共 ' + data.count + ' 个节点');
                loadSubs(); 
            } else { showToast('更新失败'); }
        } catch(e) { showToast('更新出错'); } finally { icon.classList.remove('spinner-refresh'); }
    }

    async function toggleStatus(name, isEnabled) {
        const card = document.getElementById('card-' + name);
        if(isEnabled) { card.classList.remove('disabled'); } else { card.classList.add('disabled'); }
        const activeCountEl = document.getElementById('stat-active-subs');
        let text = activeCountEl.innerText;
        let [active, total] = text.split('/').map(s => parseInt(s.trim()));
        active = isEnabled ? active + 1 : active - 1;
        activeCountEl.innerText = active + " / " + total;
        try {
            await fetch(apiBase + '/status', { method: 'POST', headers: { 'Authorization': token }, body: JSON.stringify({ name: name, enabled: isEnabled }) });
            showToast(isEnabled ? '订阅已启用' : '订阅已停用');
        } catch (e) { loadSubs(); }
    }

    function parseNode(link) {
        let type = 'OTHER', name = '未命名节点', badgeClass = 'bg-other';
        try {
            if (link.startsWith('vmess://')) {
                type = 'VMESS';
                badgeClass = 'bg-vmess';
                const c = JSON.parse(decodeURIComponent(escape(window.atob(link.replace('vmess://', '')))));
                if (c.ps) name = c.ps;
            } else {
                const u = new URL(link);
                type = u.protocol.replace(':', '').toUpperCase();
                if (type.includes('VLESS')) badgeClass = 'bg-vless';
                else if (type.includes('SS')) badgeClass = 'bg-ss';
                else if (type.includes('TROJAN')) badgeClass = 'bg-other';
                if (u.hash) name = decodeURIComponent(u.hash.substring(1)); else name = u.hostname;
            }
        } catch (e) { name = link.substring(0, 15) + '...'; }
        return { type, name, badgeClass, original: link };
    }
    
    function rebuildNodeLink(link, newName) {
        try {
            if (link.startsWith('vmess://')) {
                const b = link.replace('vmess://', '');
                const c = JSON.parse(decodeURIComponent(escape(window.atob(b))));
                c.ps = newName;
                return 'vmess://' + window.btoa(unescape(encodeURIComponent(JSON.stringify(c))));
            } else {
                const u = new URL(link);
                u.hash = '#' + encodeURIComponent(newName);
                return u.toString();
            }
        } catch (e) { return link; }
    }

    async function checkAuth() {
        const res = await fetch(apiBase + '/subs', { headers: { 'Authorization': token } });
        if(res.ok) { 
            document.getElementById('login-view').classList.add('hide');
            document.getElementById('main-content').classList.remove('hide');
            switchPage('subs'); 
        } else { logout(); }
    }
    
    async function login() {
        const pwd = document.getElementById('password').value;
        if(!pwd) return showToast('请输入密码');
        const res = await fetch(apiBase + '/login', { method: 'POST', body: JSON.stringify({ password: pwd }) });
        if(res.ok) { token = pwd; localStorage.setItem('sub_token', token); checkAuth(); } else { showToast('密码错误'); }
    }
    
    function logout() { 
        token = '';
        localStorage.removeItem('sub_token'); 
        document.getElementById('login-view').classList.remove('hide'); 
        document.getElementById('main-content').classList.add('hide'); 
    }

    function switchPage(pageId) {
        ['subs', 'nodes'].forEach(p => document.getElementById('page-' + p).classList.add('hide'));
        document.getElementById('page-' + pageId).classList.remove('hide');
        if(pageId === 'subs') loadSubs();
    }

    async function loadSubs() {
        const res = await fetch(apiBase + '/subs', { headers: { 'Authorization': token } });
        const subs = await res.json();
        allSubsCache = subs; 
        const grid = document.getElementById('sub-grid');
        grid.innerHTML = '';
        
        let totalNodesCount = 0;
        const totalSubs = subs.length;
        const activeSubs = subs.filter(s => s.enabled).length;
        
        document.getElementById('stat-total-subs').innerText = totalSubs;
        document.getElementById('stat-active-subs').innerText = activeSubs + " / " + totalSubs;
        document.getElementById('stat-total-nodes').innerText = "-";
        if(subs.length === 0) { 
            document.getElementById('empty-sub-tip').classList.remove('hide');
            document.getElementById('stat-total-nodes').innerText = 0;
            return; 
        }
        document.getElementById('empty-sub-tip').classList.add('hide');
        const host = window.location.origin;
        
        for(const sub of subs) {
            const name = sub.name;
            const enabled = sub.enabled !== false; 
            const hasUrl = !!sub.url; 
            const url = host + '/sub/' + name;
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            
            let html = '<div id="card-' + name + '" class="misub-card ' + (enabled ? '' : 'disabled') + '">';
            html += '<div class="d-flex justify-content-between align-items-start mb-2">';
                html += '<div class="d-flex align-items-center" style="overflow:hidden; margin-right:8px; flex-grow:1;">';
                    html += '<div class="drag-handle sub-drag-handle"><i class="bi bi-grip-vertical"></i></div>';
                    html += '<div class="sub-name text-truncate" title="'+name+'" onclick="manageNodes(\\'' + name + '\\')">' + name + '</div>';
                    html += '<div class="card-actions" onclick="event.stopPropagation()">';
                    html += '<div class="icon-btn" onclick="openSubModal(\\'' + 'rename' + '\\', \\'' + name + '\\')" title="重命名"><i class="bi bi-pencil-square"></i></div>';
                    html += '<div class="icon-btn delete" onclick="openDeleteModal(\\'' + 'sub' + '\\', \\'' + name + '\\')" title="删除"><i class="bi bi-trash3"></i></div>';
                    html += '</div>';
                html += '</div>';

                html += '<div class="top-right-group">';
                if(hasUrl) {
                    html += '<div class="btn-update-top" onclick="refreshSubFromUrl(\\'' + name + '\\', event)" title="立即更新">';
                    html += '<i id="icon-refresh-' + name + '" class="bi bi-arrow-repeat" style="font-size:1.1rem;"></i>';
                    html += '</div>';
                }
                html += '<div class="form-check form-switch" onclick="event.stopPropagation()">';
                html += '<input class="form-check-input" type="checkbox" ' + (enabled ? 'checked' : '') + ' onchange="toggleStatus(\\'' + name + '\\', this.checked)">';
                html += '</div>';
                html += '</div>';

            html += '</div>'; 
            
            html += '<div class="info-row"><i class="bi bi-hdd-stack"></i> <span id="count-' + name + '">...</span> Nodes</div>';
            html += '<div class="action-buttons">';
            html += '<button class="btn-card-action" onclick="openLinkModal(\\'' + name + '\\', \\'v2ray\\')">通用订阅</button>';
            html += '<button class="btn-card-action" onclick="openLinkModal(\\'' + name + '\\', \\'surge\\')">Surge</button>';
            html += '<button class="btn-card-action" onclick="openLinkModal(\\'' + name + '\\', \\'clash\\')">Clash</button>';
            html += '</div></div>';
            
            col.innerHTML = html;
            grid.appendChild(col);
            
            fetch(apiBase + '/nodes?sub=' + name, { headers: { 'Authorization': token } })
                .then(r => r.json())
                .then(nodes => { 
                    const countEl = document.getElementById('count-' + name);
                    if(countEl) countEl.innerText = nodes.length;
                    if(nodes.length > 0) {
                        totalNodesCount += nodes.length;
                        document.getElementById('stat-total-nodes').innerText = totalNodesCount;
                    } else {
                        if(document.getElementById('stat-total-nodes').innerText === "-") document.getElementById('stat-total-nodes').innerText = totalNodesCount;
                    }
                });
        }
        setTimeout(() => {
            if(document.getElementById('stat-total-nodes').innerText === "-") document.getElementById('stat-total-nodes').innerText = 0;
        }, 500);

        const subGrid = document.getElementById('sub-grid');
        if (subGrid) {
            new Sortable(subGrid, {
                handle: '.sub-drag-handle',
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: async function (evt) {
                    const item = allSubsCache.splice(evt.oldIndex, 1)[0];
                    allSubsCache.splice(evt.newIndex, 0, item);
                    const newOrderNames = allSubsCache.map(s => s.name);
                    try {
                        await fetch(apiBase + '/reorder_subs', {
                            method: 'POST', headers: { 'Authorization': token },
                            body: JSON.stringify({ subs: newOrderNames })
                        });
                        showToast('排序已保存');
                    } catch(e) { showToast('排序保存失败'); }
                }
            });
        }
    }

    function manageNodes(name) {
        currentSubName = name;
        document.getElementById('current-sub-title').innerText = name;
        document.getElementById('node-search-input').value = '';
        toggleSearchMode(false);
        
        const currentSub = allSubsCache.find(s => s.name === name);
        if(currentSub && currentSub.url) {
            document.getElementById('import-url-input').value = currentSub.url;
        } else { document.getElementById('import-url-input').value = ''; }
        switchPage('nodes');
        refreshCurrentNodes();
    }

    async function refreshCurrentNodes() {
        const res = await fetch(apiBase + '/nodes?sub=' + currentSubName, { headers: { 'Authorization': token } });
        const data = await res.json();
        currentNodes = data;
        renderNodeGrid(currentNodes);
    }

    function renderNodeGrid(sourceNodes, isFiltered = false) {
        const grid = document.getElementById('node-grid');
        grid.innerHTML = '';
        let nodesToRender = isFiltered ? sourceNodes : sourceNodes.map((link, index) => ({ link, index }));
        if(nodesToRender.length === 0) { 
            document.getElementById('empty-node-tip').classList.remove('hide');
            document.getElementById('empty-node-tip').innerText = isFiltered ? "无搜索结果" : "暂无节点";
            return; 
        }
        document.getElementById('empty-node-tip').classList.add('hide');
        nodesToRender.forEach(item => {
            const info = parseNode(item.link);
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            
            let nHtml = '<div class="node-card" onclick="openEditModal(' + item.index + ')">';
            nHtml += '<div class="node-info-group">';
            if (!isFiltered) {
                nHtml += '<div class="drag-handle node-drag-handle"><i class="bi bi-grip-vertical"></i></div>';
            }
            nHtml += '<span class="protocol-badge ' + info.badgeClass + '">' + info.type + '</span>';
            nHtml += '<div class="node-name-text">' + info.name + '</div>';
            nHtml += '</div>';
            
            nHtml += '<div class="node-actions-group">';
            nHtml += '<button class="btn-node-action" onclick="copyLink(\\'' + item.link + '\\'); event.stopPropagation();" title="复制链接"><i class="bi bi-clipboard"></i></button>';
            nHtml += '<button class="btn-node-action delete" onclick="openDeleteModal(\\'' + 'node' + '\\', ' + item.index + '); event.stopPropagation();" title="删除"><i class="bi bi-trash3"></i></button>';
            nHtml += '</div></div>';
            
            col.innerHTML = nHtml;
            grid.appendChild(col);
        });

        if (!isFiltered) {
            const nodeGrid = document.getElementById('node-grid');
            if (nodeGrid) {
                new Sortable(nodeGrid, {
                    handle: '.node-drag-handle',
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    onEnd: function (evt) {
                        const item = currentNodes.splice(evt.oldIndex, 1)[0];
                        currentNodes.splice(evt.newIndex, 0, item);
                        saveNodesToServer(); 
                    }
                });
            }
        }
    }

    function filterNodes(keyword) {
        const lowerKey = keyword.toLowerCase().trim();
        if (!lowerKey) { renderNodeGrid(currentNodes, false); return; }
        const filtered = currentNodes.map((link, index) => ({ link, index }))
            .filter(item => {
                const info = parseNode(item.link);
                return info.name.toLowerCase().includes(lowerKey) || info.type.toLowerCase().includes(lowerKey);
            });
        renderNodeGrid(filtered, true);
    }

    function toggleSearchMode(show) {
        const group = document.getElementById('node-actions-group');
        const bar = document.getElementById('node-search-bar');
        const input = document.getElementById('node-search-input');
        
        if (show) {
            group.classList.add('hide'); bar.classList.remove('hide'); input.focus();
        } else {
            group.classList.remove('hide'); bar.classList.add('hide'); input.value = ''; filterNodes('');
        }
    }
    
    function linkToJson(link) {
        if (link.startsWith('vmess://')) {
            const b = link.replace('vmess://', '');
            return JSON.parse(decodeURIComponent(escape(window.atob(b))));
        }
        try {
            const u = new URL(link);
            const obj = {
                protocol: u.protocol.replace(':', ''),
                username: u.username,
                hostname: u.hostname,
                port: u.port,
                params: Object.fromEntries(u.searchParams),
                hash: decodeURIComponent(u.hash.slice(1))
            };
            if (obj.protocol === 'ss') {
                if (!u.password && u.username) {
                    try {
                        const decoded = window.atob(u.username);
                        if (decoded.includes(':')) { obj.decoded_ss_auth = decoded; }
                    } catch(e) {}
                }
            }
            return obj;
        } catch(e) {
            return { error: "Parse Failed", raw: link };
        }
    }

    function jsonToLink(obj) {
        if (!obj.protocol && obj.v) {
            const jsonStr = JSON.stringify(obj);
            return 'vmess://' + window.btoa(unescape(encodeURIComponent(jsonStr)));
        }
        try {
            let auth = '';
            if (obj.protocol === 'ss' && obj.decoded_ss_auth) {
                auth = window.btoa(obj.decoded_ss_auth);
            } else {
                if (obj.username) auth += obj.username;
                if (obj.password) auth += ':' + obj.password;
            }
            const url = new URL(obj.protocol + '://' + obj.hostname + ':' + obj.port);
            if (auth) {
                if(auth.includes(':') && !obj.decoded_ss_auth) {
                    const parts = auth.split(':');
                    url.username = parts[0]; url.password = parts[1];
                } else {
                    url.username = auth;
                }
            }
            if (obj.params) {
                Object.entries(obj.params).forEach(([k, v]) => url.searchParams.set(k, v));
            }
            url.hash = '#' + encodeURIComponent(obj.hash || '');
            return url.toString();
        } catch(e) { throw new Error('Build Failed'); }
    }

    function openEditModal(index) {
        editingNodeIndex = index;
        isAdvancedEditMode = false;
        
        const link = currentNodes[index];
        const info = parseNode(link);
        document.getElementById('edit-node-name').value = info.name;
        document.getElementById('edit-node-link').value = info.original; 
        
        document.getElementById('simple-editor-area').classList.remove('hide');
        document.getElementById('advanced-editor-area').classList.add('hide');
        
        const advBtn = document.getElementById('btn-toggle-advanced');
        advBtn.innerHTML = '<i class="bi bi-gear"></i> 高级编辑';
        
        document.getElementById('edit-node-modal').classList.add('show');
    }

    function toggleAdvancedMode() {
        const linkArea = document.getElementById('edit-node-link');
        const simpleArea = document.getElementById('simple-editor-area');
        const advArea = document.getElementById('advanced-editor-area');
        const jsonEditor = document.getElementById('json-editor');
        const btn = document.getElementById('btn-toggle-advanced');
        
        if (!isAdvancedEditMode) {
            try {
                const rawLink = linkArea.value.trim();
                const jsonObj = linkToJson(rawLink);
                if (jsonObj.error) return showToast('链接格式错误，无法解析');
                jsonEditor.value = JSON.stringify(jsonObj, null, 4); 
                simpleArea.classList.add('hide'); advArea.classList.remove('hide');
                btn.innerHTML = '<i class="bi bi-arrow-return-left"></i> 返回普通';
                isAdvancedEditMode = true;
            } catch(e) { showToast('解析失败'); }
        } else {
            try {
                const jsonObj = JSON.parse(jsonEditor.value);
                const newLink = jsonToLink(jsonObj);
                linkArea.value = newLink;
                advArea.classList.add('hide'); simpleArea.classList.remove('hide');
                btn.innerHTML = '<i class="bi bi-gear"></i> 高级编辑';
                isAdvancedEditMode = false;
            } catch(e) { showToast('JSON 格式错误: ' + e.message); }
        }
    }

    function closeEditModal(modalId) { document.getElementById(modalId).classList.remove('show'); }

    async function saveNodeEdits() {
        const newName = document.getElementById('edit-node-name').value.trim();
        let newLink = '';
        if (isAdvancedEditMode) {
            try {
                const jsonEditor = document.getElementById('json-editor');
                const jsonObj = JSON.parse(jsonEditor.value);
                if (jsonObj.ps) jsonObj.ps = newName; 
                if (jsonObj.hash) jsonObj.hash = newName; 
                newLink = jsonToLink(jsonObj);
            } catch(e) { return showToast('保存失败：JSON 格式错误'); }
        } else {
            newLink = document.getElementById('edit-node-link').value.trim();
        }

        if(!newName || !newLink) return showToast('内容不能为空');
        const finalLink = rebuildNodeLink(newLink, newName);
        currentNodes[editingNodeIndex] = finalLink;
        await saveNodesToServer();
        closeEditModal('edit-node-modal');
    }

    async function saveNodesToServer() {
        await fetch(apiBase + '/nodes', { method: 'POST', headers: {'Authorization': token}, body: JSON.stringify({sub: currentSubName, nodes: currentNodes}) });
        refreshCurrentNodes();
        showToast('已保存');
    }
    
    async function saveNodes() {
        let txt = document.getElementById('node-input').value.trim();
        if (txt && !txt.includes('://') && !txt.includes('\\n')) {
            try {
                let decoded = '';
                try { decoded = decodeURIComponent(escape(window.atob(txt))); }
                catch(e) { decoded = window.atob(txt); }
                if (decoded && decoded.includes('://')) { txt = decoded; }
            } catch(e) {}
        }
        const newN = txt.split('\\n').map(x=>x.trim()).filter(x=>x);
        currentNodes = [...currentNodes, ...newN];
        saveNodesToServer();
        toggleAddNode();
        document.getElementById('node-input').value = ''; 
    }
    
    function toggleAddNode() { 
        const p = document.getElementById('add-node-modal');
        p.classList.toggle('show'); 
        if(p.classList.contains('show')) document.getElementById('node-input').focus();
    }
    function copyLink(t, e) { navigator.clipboard.writeText(t).then(()=>showToast('复制成功')); }
`;