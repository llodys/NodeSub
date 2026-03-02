// src/views/template.js
import { CSS } from './style.js';
import { SCRIPT } from './script.js';

export const HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NodeSub 订阅管理</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
    
    <script>
        const updateTheme = () => {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
        }
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
        updateTheme();
    </script>

    <style>
        ${CSS}
    </style>
</head>
<body>
    <div id="toast-container" class="toast-container"></div>

    <div id="link-modal" class="modal-overlay">
        <div class="custom-modal">
            <div class="modal-header-custom">
                <div class="modal-header-left">
                    <div class="modal-icon-bg"><i class="bi bi-link-45deg"></i></div>
                    <h5 class="modal-title-text" id="link-modal-title">订阅链接</h5>
                </div>
            </div>
            
            <div id="link-filter-area"></div>

            <div class="input-group-custom">
                <i class="bi bi-globe input-icon"></i>
                <input type="text" id="link-modal-input" class="custom-input" readonly>
            </div>
            
            <div class="modal-footer-custom">
                <button onclick="closeModal('link-modal')" class="btn-modal-cancel">关闭</button>
                <button id="btn-copy-link" class="btn-modal-confirm">复制链接</button>
            </div>
        </div>
    </div>

    <div id="sub-modal" class="modal-overlay">
        <div class="custom-modal">
            <div class="modal-header-custom">
                <div class="modal-header-left">
                    <div class="modal-icon-bg"><i class="bi bi-collection"></i></div>
                    <h5 class="modal-title-text" id="sub-modal-title">订阅管理</h5>
                </div>
            </div>
            <div class="input-group-custom">
                <i class="bi bi-input-cursor-text input-icon"></i>
                <input type="text" id="sub-input-name" class="custom-input" placeholder="请输入订阅名称 (仅限字母数字)">
            </div>
             <div class="modal-footer-custom">
               <button onclick="closeModal('sub-modal')" class="btn-modal-cancel">取消</button>
                <button onclick="saveSub()" class="btn-modal-confirm">保存</button>
            </div>
        </div>
    </div>
    
    <div id="add-node-modal" class="modal-overlay">
        <div class="custom-modal">
            <div class="modal-header-custom">
                <div class="modal-header-left">
                    <div class="modal-icon-bg"><i class="bi bi-plus-lg"></i></div>
                    <h5 class="modal-title-text">导入节点</h5>
                </div>
            </div>
            
            <ul class="nav nav-pills mb-3" style="font-size: 0.85rem;">
                <li class="nav-item"><a class="nav-link active" href="#" onclick="switchImportTab(event, 'paste')">📋 粘贴文本</a></li>
                <li class="nav-item"><a class="nav-link" href="#" onclick="switchImportTab(event, 'url')">🌐 远程订阅</a></li>
            </ul>

            <div id="import-tab-paste" class="tab-pane">
                <div class="d-flex justify-content-between mb-2 px-1 align-items-center">
                    <small class="text-muted" style="font-size: 0.75rem;">支持单行链接或 Base64 订阅文本</small>
                    <button onclick="decodeBase64Input()" class="btn btn-sm btn-link text-decoration-none p-0 text-muted" style="font-size: 0.8rem;">
                        <i class="bi bi-unlock"></i> Base64 解码
                    </button>
                </div>
                <div class="input-group-custom input-group-textarea">
                    <textarea id="node-input" class="custom-textarea" placeholder="在此粘贴 vmess://, vless://... 链接" style="height: 150px;"></textarea>
                </div>
                <div class="modal-footer-custom">
                    <button onclick="closeModal('add-node-modal')" class="btn-modal-cancel">取消</button>
                    <button onclick="saveNodes()" class="btn-modal-confirm">保存</button>
                </div>
            </div>

            <div id="import-tab-url" class="tab-pane hide">
                <div class="input-group-custom">
                    <i class="bi bi-link-45deg input-icon"></i>
                    <input type="text" id="import-url-input" class="custom-input" placeholder="请输入订阅链接 (http/https)">
                </div>
                <div class="modal-footer-custom">
                    <button onclick="closeModal('add-node-modal')" class="btn-modal-cancel">取消</button>
                    <button onclick="importFromUrl()" id="btn-import-url" class="btn-modal-confirm">
                        <span id="btn-import-text">绑定并导入</span>
                        <span id="btn-import-spinner" class="spinner-border spinner-border-sm hide" role="status"></span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div id="edit-node-modal" class="modal-overlay">
        <div class="custom-modal">
            <div class="modal-header-custom">
                <div class="modal-header-left">
                    <div class="modal-icon-bg"><i class="bi bi-link-45deg"></i></div>
                    <h5 class="modal-title-text">编辑节点</h5>
                </div>
            </div>
            
            <div class="input-group-custom">
                <i class="bi bi-tag input-icon"></i>
                <input type="text" id="edit-node-name" class="custom-input" placeholder="节点名称">
            </div>
            
            <div id="simple-editor-area" class="input-group-custom input-group-textarea">
                <i class="bi bi-link input-icon input-icon-top"></i>
                <textarea id="edit-node-link" class="custom-textarea" placeholder="节点链接..." style="height:120px"></textarea>
            </div>

            <div id="advanced-editor-area" class="hide">
                <div class="d-flex justify-content-between mb-1">
                    <small class="text-muted">JSON 配置 (支持全协议)</small>
                </div>
                <div class="input-group-custom input-group-textarea">
                    <textarea id="json-editor" class="custom-textarea" style="height:220px; font-size:0.8rem; font-family:monospace;" placeholder="{...}"></textarea>
                </div>
            </div>

            <div class="modal-footer-custom d-flex justify-content-between align-items-center">
                <button id="btn-toggle-advanced" class="btn btn-sm btn-link text-decoration-none text-muted" onclick="toggleAdvancedMode()">
                    <i class="bi bi-gear"></i> 高级编辑
                </button>
                
                <div class="d-flex gap-2">
                    <button onclick="closeModal('edit-node-modal')" class="btn-modal-cancel">取消</button>
                    <button onclick="saveNodeEdits()" class="btn-modal-confirm">确认</button>
                </div>
            </div>
        </div>
    </div>

    <div id="delete-confirm-modal" class="modal-overlay">
        <div class="custom-modal">
            <div class="modal-header-custom">
                <div class="modal-header-left">
                    <div class="modal-icon-bg danger"><i class="bi bi-exclamation-triangle-fill"></i></div>
                    <div>
                        <h5 class="modal-title-text" id="delete-modal-title">确认删除?</h5>
                        <div class="modal-desc-text" id="delete-modal-desc">操作无法撤销。</div>
                    </div>
                </div>
            </div>
            <div class="modal-footer-custom">
                <button onclick="closeModal('delete-confirm-modal')" class="btn-modal-cancel">取消</button>
                <button onclick="performDelete()" class="btn-modal-delete">确认删除</button>
            </div>
        </div>
    </div>

    <nav class="navbar fixed-top">
        <div class="container" style="max-width: 1000px;">
            <a class="navbar-brand d-flex align-items-center gap-2" href="#">
                <div class="brand-logo"><i class="bi bi-diagram-3-fill"></i></div>
                <span class="fw-bold" style="color: var(--text-main); font-size: 1.1rem;">NodeSub</span>
            </a>
            <button onclick="logout()" class="btn btn-icon rounded-circle" title="退出登录">
                <i class="bi bi-box-arrow-right"></i>
            </button>
        </div>
    </nav>

    <div class="container" style="max-width: 1000px; margin-top: 90px; margin-bottom: 60px;">
        <div id="login-view" class="row justify-content-center" style="min-height: 60vh; align-items: center;">
            <div class="col-md-5 col-lg-4">
                <div class="card login-box p-5 border-0">
                    <div class="text-center mb-4">
                        <div class="brand-logo mx-auto mb-3" style="width: 48px; height: 48px; font-size: 24px;"><i class="bi bi-diagram-3-fill"></i></div>
                        <h5 class="fw-bold" style="color: var(--text-main)">管理员登录</h5>
                    </div>
                    <div class="mb-4">
                        <input type="password" id="password" class="form-control form-control-lg border-0" placeholder="请输入密码" style="background: var(--input-bg); font-size: 0.95rem;">
                    </div>
                    <button onclick="login()" class="btn btn-new w-100 justify-content-center py-2">验证身份</button>
                </div>
            </div>
        </div>

        <div id="main-content" class="hide">
            <div id="page-subs">
                <div class="page-header align-items-center">
                    <div class="header-title-group">
                        <div class="header-title">仪表盘</div>
                    </div>
                    <div class="d-flex gap-2">
                        <button onclick="openSubModal('create')" class="btn btn-new">
                            <i class="bi bi-plus-lg" style="font-size: 0.85rem;"></i> 新增订阅
                        </button>
                        <div class="dropdown">
                            <button class="btn btn-icon shadow-sm dropdown-toggle" data-bs-toggle="dropdown" title="更多操作">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li>
                                    <button class="dropdown-item text-danger" onclick="openDeleteModal('all_subs')">
                                        <i class="bi bi-trash3 me-2"></i>清空所有订阅
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="stats-overview">
                    <div class="stat-item">
                        <div class="stat-icon-box icon-purple"><i class="bi bi-hdd-network"></i></div>
                        <div class="stat-info"><span class="stat-value" id="stat-total-nodes">-</span><span class="stat-label">节点总数</span></div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon-box icon-blue"><i class="bi bi-layers-fill"></i></div>
                        <div class="stat-info"><span class="stat-value" id="stat-total-subs">0</span><span class="stat-label">订阅分组</span></div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon-box icon-green"><i class="bi bi-check-circle-fill"></i></div>
                        <div class="stat-info"><span class="stat-value" id="stat-active-subs">0</span><span class="stat-label">运行状态</span></div>
                    </div>
                </div>

                <div id="sub-grid" class="row g-3"></div>
                <div id="empty-sub-tip" class="text-center py-5 hide"><div class="text-muted opacity-25 mb-3"><i class="bi bi-inbox-fill" style="font-size: 3rem;"></i></div><h6 class="text-muted small">暂无订阅数据</h6></div>
            </div>
            
            <div id="page-nodes" class="hide">
                <div class="page-header mb-4">
                    <div class="d-flex align-items-center gap-3">
                        <button onclick="switchPage('subs')" class="btn btn-icon rounded-circle shadow-sm d-flex align-items-center justify-content-center"><i class="bi bi-arrow-left"></i></button>
                        <div><div class="header-title" id="current-sub-title">Title</div></div>
                    </div>
                    <div class="d-flex align-items-center justify-content-end" style="position: relative; min-width: 40px;">
                        <div id="node-actions-group" class="d-flex gap-2">
                            <button onclick="toggleSearchMode(true)" class="btn btn-icon shadow-sm" title="搜索"><i class="bi bi-search"></i></button>
                            <button onclick="toggleAddNode()" class="btn btn-new shadow-sm"><i class="bi bi-plus-lg"></i> 添加节点</button>
                            <div class="dropdown">
                                <button class="btn btn-icon shadow-sm dropdown-toggle" data-bs-toggle="dropdown" title="更多操作">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <button class="dropdown-item text-danger" onclick="openDeleteModal('all_nodes')">
                                            <i class="bi bi-trash3 me-2"></i>清空当前节点
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div id="node-search-bar" class="search-bar-inline hide">
                            <i class="bi bi-search text-muted ps-3"></i>
                            <input type="text" id="node-search-input" class="form-control border-0 bg-transparent shadow-none" placeholder="搜索节点..." oninput="filterNodes(this.value)">
                            <button onclick="toggleSearchMode(false)" class="btn btn-link text-muted text-decoration-none pe-3">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="node-grid" class="row g-3"></div>
                <div id="empty-node-tip" class="text-center py-5 hide text-muted small">暂无节点</div>
            </div>
        </div>

        <div class="text-center mt-5 pt-5 border-top border-light text-muted small opacity-50">&copy; 2026 NodeSub Manager</div>
    </div>

    <script>
        ${SCRIPT}
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;