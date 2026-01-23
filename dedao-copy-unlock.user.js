// ==UserScript==
// @name         Dedao Copy Unlock - 得到解除复制限制
// @namespace    https://www.dedao.cn/
// @version      1.1.0
// @description  解除得到网站的复制、选择、右键限制，让你自由复制文章内容
// @match        https://www.dedao.cn/*
// @match        https://*.dedao.cn/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    console.log('[Dedao Copy Unlock] 脚本开始运行 v1.1.0');

    // ========== 核心：劫持事件方法，防止网站阻止事件 ==========
    const allowedEvents = ['contextmenu', 'copy', 'cut', 'selectstart', 'select', 'mousedown', 'mouseup', 'keydown', 'keyup'];

    // 1. 劫持 Event.prototype.preventDefault
    const _preventDefault = Event.prototype.preventDefault;
    Event.prototype.preventDefault = function() {
        if (allowedEvents.includes(this.type)) {
            console.log(`[Dedao Copy Unlock] ✅ 允许事件: ${this.type}`);
            return; // 不执行 preventDefault
        }
        return _preventDefault.apply(this, arguments);
    };

    // 2. 劫持 Event.prototype.stopPropagation
    const _stopPropagation = Event.prototype.stopPropagation;
    Event.prototype.stopPropagation = function() {
        if (allowedEvents.includes(this.type)) {
            console.log(`[Dedao Copy Unlock] ✅ 允许传播: ${this.type}`);
            return;
        }
        return _stopPropagation.apply(this, arguments);
    };

    // 3. 劫持 Event.prototype.stopImmediatePropagation
    const _stopImmediatePropagation = Event.prototype.stopImmediatePropagation;
    Event.prototype.stopImmediatePropagation = function() {
        if (allowedEvents.includes(this.type)) {
            console.log(`[Dedao Copy Unlock] ✅ 允许立即传播: ${this.type}`);
            return;
        }
        return _stopImmediatePropagation.apply(this, arguments);
    };

    // 4. 劫持 addEventListener，替换网站的限制性监听器
    const _addEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (allowedEvents.includes(type)) {
            console.log(`[Dedao Copy Unlock] ⚠️ 拦截添加监听器: ${type}`);
            // 不添加真正的监听器
            return;
        }
        return _addEventListener.apply(this, arguments);
    };

    // 5. 劫持 removeEventListener，防止移除我们的监听器
    const _removeEventListener = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
        if (allowedEvents.includes(type)) {
            console.log(`[Dedao Copy Unlock] ⚠️ 阻止移除监听器: ${type}`);
            return;
        }
        return _removeEventListener.apply(this, arguments);
    };

    // 5. 劫持 Object.defineProperty，防止设置 oncontextmenu 等属性
    const _defineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
        if (typeof prop === 'string' && prop.startsWith('on') &&
            allowedEvents.some(e => prop === 'on' + e)) {
            console.log(`[Dedao Copy Unlock] ⚠️ 拦截设置属性: ${prop}`);
            return obj;
        }
        return _defineProperty.apply(this, arguments);
    };

    // ========== CSS 样式：强制允许选择 ==========
    const addStyles = () => {
        GM_addStyle(`
            *, *::before, *::after {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }

            img, video, canvas {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                user-select: none !important;
            }

            * {
                pointer-events: auto !important;
            }

            /* 移除可能的遮罩层 */
            [style*="user-select: none"],
            [style*="-webkit-user-select: none"] {
                user-select: text !important;
                -webkit-user-select: text !important;
            }
        `);
        console.log('[Dedao Copy Unlock] ✅ CSS 样式已注入');
    };

    // ========== 强制启用右键菜单 ==========
    const forceEnableContextMenu = () => {
        // 使用原生方法添加监听器，在捕获阶段最早执行
        _addEventListener.call(document, 'contextmenu', function(e) {
            // 阻止其他监听器执行
            _stopImmediatePropagation.call(e);
            // 让浏览器显示右键菜单（不调用 preventDefault）
            console.log('[Dedao Copy Unlock] ✅ 右键菜单已触发');
            return true;
        }, true); // true = 捕获阶段

        _addEventListener.call(document, 'copy', function(e) {
            _stopImmediatePropagation.call(e);
            console.log('[Dedao Copy Unlock] ✅ 复制事件已触��');
            return true;
        }, true);

        _addEventListener.call(document, 'selectstart', function(e) {
            _stopImmediatePropagation.call(e);
            console.log('[Dedao Copy Unlock] ✅ 选择开始事件已触发');
            return true;
        }, true);

        console.log('[Dedao Copy Unlock] ✅ 强制右键菜单已启用');
    };

    // ========== 清除已存在的事件处理器和样式 ==========
    const clearRestrictions = () => {
        // 清除 document 和 body 上的事件处理器
        [document, document.body, document.documentElement].forEach(el => {
            if (el) {
                allowedEvents.forEach(event => {
                    el['on' + event] = null;
                });
            }
        });

        // 清除所有元素上的 user-select: none
        try {
            document.querySelectorAll('*').forEach(el => {
                const computed = window.getComputedStyle(el);
                if (computed.userSelect === 'none' || computed.webkitUserSelect === 'none') {
                    el.style.userSelect = 'text';
                    el.style.webkitUserSelect = 'text';
                    el.style.MozUserSelect = 'text';
                    el.style.msUserSelect = 'text';
                }
            });
        } catch (e) {
            // 忽略错误
        }
    };

    // ========== 监控 DOM 变化 ==========
    const observeDOM = () => {
        const observer = new MutationObserver(() => {
            clearRestrictions();
        });

        const observe = () => {
            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'oncontextmenu', 'oncopy', 'onselectstart']
                });
                console.log('[Dedao Copy Unlock] ✅ DOM 监控已启动');
            } else {
                setTimeout(observe, 100);
            }
        };

        observe();
    };

    // ========== 定期清理 ==========
    const startPeriodicClean = () => {
        setInterval(clearRestrictions, 2000);
        console.log('[Dedao Copy Unlock] ✅ 定期清理已启动');
    };

    // ========== 初始化 ==========
    const init = () => {
        addStyles();
        forceEnableContextMenu();  // 先启用右键菜单
        clearRestrictions();
        observeDOM();
        startPeriodicClean();

        console.log(`
╔════════════════════════════════════════════════╗
║   ✅ Dedao Copy Unlock 已启用 v1.1.0         ║
║                                                ║
║   🖱️  右键菜单：已解锁                        ║
║   📝  文字选择：已解锁                        ║
║   📋  复制粘贴：已解锁                        ║
║                                                ║
║   现在可以自由复制文章内容了！                ║
╚════════════════════════════════════════════════╝
        `);
    };

    // 最早执行 - 在任何其他脚本之前
    forceEnableContextMenu();

    // 立即执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 页面完全加载后再次执行
    window.addEventListener('load', () => {
        clearRestrictions();
        console.log('[Dedao Copy Unlock] ✅ 页面加载完成，再次清理');
    });

    // 定时再次确认
    setTimeout(() => {
        clearRestrictions();
        console.log('[Dedao Copy Unlock] ✅ 延迟清理完成');
    }, 3000);

})();
