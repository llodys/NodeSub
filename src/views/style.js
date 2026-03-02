// src/views/style.js
export const CSS = `
    :root {
        --primary: #7050e8;
        --primary-hover: #5f41c9;
        --primary-light: #f3f1ff;
        --text-main: #1f2937;
        --text-sub: #6b7280;
        --bg-body: #f8fafc;
        --card-bg: #ffffff;
        --card-border: rgba(0,0,0,0.03);
        --card-shadow: rgba(0,0,0,0.02);
        --input-bg: #f9fafb;
        --input-border: #f3f4f6;
        --nav-bg: rgba(255,255,255,0.9);
        --btn-card-bg: #ffffff;
        --btn-card-border: #e5e7eb;
        --modal-bg: #ffffff;
        --card-radius: 20px;
    }

    @media (prefers-color-scheme: dark) {
        :root {
            --primary: #818cf8;
            --primary-hover: #6366f1;
            --primary-light: rgba(99, 102, 241, 0.2);
            --text-main: #f9fafb;
            --text-sub: #9ca3af;
            --bg-body: #000000;
            --card-bg: #121212;
            --card-border: #27272a;
            --card-shadow: rgba(0,0,0,0.5);
            --input-bg: #18181b;
            --input-border: #27272a;
            --nav-bg: rgba(0, 0, 0, 0.8);
            --btn-card-bg: #18181b;
            --btn-card-border: #27272a;
            --modal-bg: #121212;
        }
    }

    body { 
        background-color: var(--bg-body);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
        color: var(--text-main);
        -webkit-font-smoothing: antialiased;
        transition: background-color 0.3s;
    }

    .toast-container { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 10000; pointer-events: none; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .toast-msg { background-color: rgba(31, 41, 55, 0.95); color: white; padding: 8px 24px; border-radius: 50px; font-size: 0.9rem; font-weight: 500; box-shadow: 0 4px 20px rgba(0,0,0,0.15); backdrop-filter: blur(4px); animation: slideDown 0.3s ease-out forwards; display: flex; align-items: center; gap: 8px; }
    @media (prefers-color-scheme: dark) { .toast-msg { background-color: #27272a; color: white; border: 1px solid #3f3f46; } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeOutUp { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); z-index: 9990; display: flex; justify-content: center; align-items: center; opacity: 0; visibility: hidden; transition: all 0.2s ease; }
    .modal-overlay.show { opacity: 1; visibility: visible; }
    .custom-modal { background: var(--modal-bg); width: 92%; max-width: 480px; border-radius: 24px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); border: 1px solid var(--card-border); transform: scale(0.95) translateY(10px); transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .modal-overlay.show .custom-modal { transform: scale(1) translateY(0); }
    .modal-header-custom { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .modal-header-left { display: flex; align-items: center; gap: 12px; }
    .modal-icon-bg { width: 42px; height: 42px; background: var(--primary-light); color: var(--primary); border-radius: 12px; display: grid; place-items: center; font-size: 20px; }
    .modal-icon-bg.danger { background: #fee2e2; color: #ef4444; } 
    @media (prefers-color-scheme: dark) { .modal-icon-bg.danger { background: rgba(239, 68, 68, 0.2); color: #f87171; } }
    .modal-title-text { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin: 0; }
    .modal-desc-text { color: var(--text-sub); font-size: 0.95rem; margin-top: 8px; line-height: 1.5; }

    .input-group-custom { background: var(--input-bg); border-radius: 14px; padding: 6px 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 12px; border: 1px solid var(--input-border); transition: all 0.2s; }
    .input-group-custom:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-light); }
    .input-icon { color: var(--text-sub); opacity: 0.6; font-size: 1.1rem; }
    .custom-input { border: none; background: transparent; flex-grow: 1; outline: none; color: var(--text-main); font-size: 0.95rem; width: 100%; padding: 10px 0; font-weight: 500; }
    .custom-input::placeholder { color: var(--text-sub); opacity: 0.5; }
    .input-group-textarea { align-items: flex-start; padding-top: 14px; padding-bottom: 14px; }
    .input-icon-top { margin-top: 4px; }
    .custom-textarea { border: none; background: transparent; flex-grow: 1; outline: none; color: var(--text-sub); font-size: 0.85rem; width: 100%; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; resize: none; line-height: 1.6; word-break: break-all; white-space: pre-wrap; height: 120px; }
    .custom-textarea::-webkit-scrollbar { display: none; }

    .modal-footer-custom { display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px; }
    .btn-modal-cancel { background: var(--input-bg); color: var(--text-main); border: 1px solid var(--input-border); padding: 10px 24px; border-radius: 10px; font-weight: 600; font-size: 0.9rem; transition: background 0.2s; }
    .btn-modal-cancel:hover { opacity: 0.8; }
    .btn-modal-confirm { background: var(--primary); color: white; border: none; padding: 10px 28px; border-radius: 10px; font-weight: 600; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(112, 80, 232, 0.3); transition: all 0.2s; }
    .btn-modal-confirm:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn-modal-confirm:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-modal-delete { background: #ef4444; color: white; border: none; padding: 10px 28px; border-radius: 10px; font-weight: 600; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); transition: all 0.2s; }
    .btn-modal-delete:hover { background: #dc2626; transform: translateY(-1px); }

    .navbar { background: var(--nav-bg); backdrop-filter: blur(12px); border-bottom: 1px solid var(--card-border); height: 60px; }
    .brand-logo { width: 30px; height: 30px; background: var(--primary); color: white; border-radius: 8px; display: grid; place-items: center; font-size: 16px; }

    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-title-group { display: flex; flex-direction: column; gap: 4px; }
    .header-title { font-size: 1.5rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em; }
    .btn-new { background: var(--primary); color: white; border: none; padding: 7px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(112, 80, 232, 0.2); transition: all 0.2s; }
    .btn-new:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn-icon { width: 36px; height: 36px; display: grid; place-items: center; padding: 0; border-radius: 8px; transition: all 0.2s; background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text-main); }
    .btn-icon:hover { background-color: var(--primary-light); color: var(--primary); }
    .btn-icon.dropdown-toggle::after { display: none; }

    .stats-overview { background: transparent; box-shadow: none; border: none; padding: 0; margin-bottom: 32px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .stat-item { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px; box-shadow: 0 4px 20px var(--card-shadow); padding: 24px; display: flex; align-items: center; gap: 16px; transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .stat-item:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); border-color: var(--primary-light); }
    .stat-icon-box { width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; font-size: 1.5rem; flex-shrink: 0; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.6rem; font-weight: 800; color: var(--text-main); line-height: 1.1; }
    .stat-label { font-size: 0.85rem; color: var(--text-sub); font-weight: 500; }
    .icon-purple { background: #f3f1ff; color: #7050e8; }
    .icon-green { background: #ecfdf5; color: #10b981; }
    .icon-blue { background: #eff6ff; color: #3b82f6; }
    @media (prefers-color-scheme: dark) { .icon-purple { background: rgba(129, 140, 248, 0.15); color: #a5b4fc; } .icon-green { background: rgba(52, 211, 153, 0.15); color: #6ee7b7; } .icon-blue { background: rgba(96, 165, 250, 0.15); color: #93c5fd; } }
    @media (max-width: 768px) { .stats-overview { grid-template-columns: 1fr; gap: 16px; } .stat-item { width: 100%; } }

    .misub-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--card-radius); padding: 20px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 2px 0 var(--card-shadow); position: relative; height: 100%; display: flex; flex-direction: column; min-height: 160px; overflow: visible !important; z-index: 1; cursor: default; }
    .misub-card.disabled { opacity: 0.6; background: var(--input-bg); }
    .misub-card:hover { transform: translateY(-2px); box-shadow: 0 12px 25px -5px var(--card-shadow); border-color: rgba(112, 80, 232, 0.2); z-index: 50 !important; }
    .misub-card:has(.show) { transform: none !important; box-shadow: 0 12px 25px -5px var(--card-shadow); border-color: rgba(112, 80, 232, 0.2); z-index: 100 !important; }

    .sub-name { font-size: 1.25rem; font-weight: 800; color: var(--text-main); line-height: 1.2; margin-bottom: 4px; cursor: pointer; transition: color 0.2s; }
    .sub-name:hover { color: var(--primary); }
    .card-actions { opacity: 0; visibility: hidden; display: flex; gap: 2px; transition: all 0.2s; margin-left: 8px; }
    .misub-card:hover .card-actions { opacity: 1; visibility: visible; }
    .icon-btn { color: var(--text-sub); cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s; font-size: 0.9rem; opacity: 0.6; }
    .icon-btn:hover { color: var(--primary); background: var(--primary-light); opacity: 1; }
    .icon-btn.delete:hover { color: #ef4444; background: #fee2e2; }

    .top-right-group { display: flex; align-items: center; gap: 10px; }
    .btn-update-top { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 8px; color: var(--primary); background: var(--primary-light); cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
    .btn-update-top:hover { background: var(--primary); color: white; transform: rotate(180deg); }

    .form-switch .form-check-input { width: 36px; height: 20px; border: none; background-color: #cbd5e1; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e"); cursor: pointer; transition: background-color 0.2s; margin: 0; }
    @media (prefers-color-scheme: dark) { .form-switch .form-check-input { background-color: #3f3f46; } }
    .form-switch .form-check-input:checked { background-color: var(--primary); }
    .form-switch { padding: 0; margin: 0; min-height: auto; }

    .info-row { font-size: 0.85rem; color: var(--text-sub); display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }

    .action-buttons { display: flex; gap: 10px; margin-top: auto; padding-top: 12px; border-top: 1px solid transparent; }
    .btn-card-action { background: var(--btn-card-bg); border: 1px solid var(--btn-card-border); color: var(--text-main); padding: 0 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; cursor: pointer; height: 32px; flex: 1; }
    .btn-card-action:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
    .btn-card-action i { font-size: 0.9rem; color: var(--text-sub); }
    .btn-card-action:hover i { color: var(--primary); }

    #link-filter-area { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; min-height: 28px; }
    .filter-chip { font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 50px; background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text-sub); cursor: pointer; transition: all 0.2s; user-select: none; }
    .filter-chip:hover { border-color: var(--primary); color: var(--primary); }
    .filter-chip.active { background: var(--primary); color: white; border-color: var(--primary); }

    .node-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; position: relative; transition: all 0.2s ease; cursor: pointer; }
    .node-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -4px var(--card-shadow); border-color: rgba(112, 80, 232, 0.3); z-index: 1; }
    .protocol-badge { font-size: 0.65rem; font-weight: 700; padding: 4px 8px; border-radius: 8px; color: white; margin-right: 14px; flex-shrink: 0; text-transform: uppercase; min-width: 50px; text-align: center; letter-spacing: 0.5px; }
    .node-info-group { display: flex; align-items: center; flex-grow: 1; overflow: hidden; }
    .node-name-text { font-weight: 600; font-size: 0.9rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .node-actions-group { display: flex; gap: 6px; opacity: 0; visibility: hidden; transform: translateX(10px); transition: all 0.2s ease; margin-left: 10px; }
    .node-card:hover .node-actions-group { opacity: 1; visibility: visible; transform: translateX(0); }
    .btn-node-action { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; background: var(--input-bg); color: var(--text-sub); border: 1px solid var(--input-border); transition: all 0.15s; }
    .btn-node-action:hover { background: var(--primary-light); color: var(--primary); border-color: var(--primary-light); }
    .btn-node-action.delete:hover { background: #fee2e2; color: #ef4444; border-color: #fee2e2; }
    
    .drag-handle { cursor: grab; color: var(--text-sub); opacity: 0.5; transition: all 0.2s; padding: 4px 8px 4px 0; display: flex; align-items: center; }
    .drag-handle:hover { opacity: 1; color: var(--primary); }
    .drag-handle:active { cursor: grabbing; }
    .sortable-ghost { opacity: 0.4; background-color: var(--primary-light); border-style: dashed !important; }
    .misub-card .drag-handle { margin-right: 0; }
    
    .dropdown-menu { border: 1px solid var(--card-border); box-shadow: 0 10px 30px -5px var(--card-shadow); border-radius: 12px; background-color: var(--card-bg); padding: 6px; }
    .dropdown-item { color: var(--text-main); font-size: 0.9rem; font-weight: 500; border-radius: 8px; padding: 8px 12px; transition: all 0.15s; }
    .dropdown-item:hover { background-color: var(--input-bg); color: var(--text-main); }
    .dropdown-item.text-danger:hover { background-color: #fee2e2; color: #ef4444; }
    @media (prefers-color-scheme: dark) { .dropdown-item.text-danger:hover { background-color: rgba(239, 68, 68, 0.2); } }

    .search-bar-inline { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 50px; display: flex; align-items: center; width: 100%; max-width: 320px; height: 36px; box-shadow: 0 4px 20px var(--card-shadow); animation: expandWidth 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; overflow: hidden; }
    @keyframes expandWidth { from { width: 40px; opacity: 0; } to { width: 100%; opacity: 1; } }
    @media (prefers-color-scheme: dark) { .btn-node-action.delete:hover { background: rgba(239, 68, 68, 0.2); } }

    .bg-vmess { background: #8b5cf6; } 
    .bg-vless { background: #3b82f6; } 
    .bg-ss { background: #10b981; } 
    .bg-other { background: #6b7280; }

    .nav-pills .nav-link { color: var(--text-sub); font-weight: 600; font-size: 0.9rem; border-radius: 8px; padding: 8px 16px; transition: all 0.2s; }
    .nav-pills .nav-link.active { background-color: var(--primary-light); color: var(--primary); font-weight: 700; }
    .tab-pane { padding-top: 16px; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .hide { display: none !important; }
    .login-box { border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.05); background: var(--card-bg); border: 1px solid var(--card-border); }
    .spinner-refresh { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .form-control::placeholder { color: var(--text-sub); opacity: 0.5; }
    .form-control { color: var(--text-main); }
`;