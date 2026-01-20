// ==UserScript==
// @name         得到专栏导出PDF
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  在得到专栏文章页面添加导出PDF按钮,将文章内容导出为PDF格式
// @author       Claude
// @match        https://www.dedao.cn/course/article*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('得到专栏导出PDF脚本已加载');

    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log('开始初始化导出按钮');
        // 延迟创建按钮,确保页面完全加载
        setTimeout(createExportButton, 3000);
    }

    /**
     * 创建导出按钮
     */
    function createExportButton() {
        console.log('正在创建导出按钮');

        // 创建导出按钮
        const exportBtn = document.createElement('button');
        exportBtn.id = 'dedao-export-pdf-btn';
        exportBtn.innerHTML = '📄 导出PDF';
        exportBtn.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            z-index: 99999;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        `;

        // 鼠标悬停效果
        exportBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
            this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        });

        exportBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        });

        // 点击导出
        exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('点击导出PDF按钮');
            exportToPDF();
        });

        // 添加按钮到页面
        document.body.appendChild(exportBtn);
        console.log('导出按钮已添加到页面');
    }

    /**
     * 获取文章内容
     */
    function getArticleContent() {
        console.log('开始提取文章内容');

        // 获取页面标题作为文章标题
        let title = document.title.replace(' - 得到APP', '').trim();
        console.log('文章标题:', title);

        // 尝试多种方式获取课程名称
        let courseName = '';
        const courseSelectors = [
            '.courseName',
            '[class*="courseName"]',
            '[class*="course-name"]'
        ];

        for (const selector of courseSelectors) {
            const courseEl = document.querySelector(selector);
            if (courseEl && courseEl.textContent.trim()) {
                courseName = courseEl.textContent.trim();
                break;
            }
        }
        console.log('课程名称:', courseName);

        // 获取日期
        let date = '';
        const dateSelectors = [
            '.date',
            '[class*="date"]',
            '[class*="time"]'
        ];

        for (const selector of dateSelectors) {
            const dateEl = document.querySelector(selector);
            if (dateEl && dateEl.textContent.trim() && dateEl.textContent.includes('202')) {
                date = dateEl.textContent.trim();
                break;
            }
        }
        console.log('日期:', date);

        // 获取文章正文 - 使用多种选择器尝试
        let content = '';
        const contentSelectors = [
            'article',
            '[class*="article-content"]',
            '[class*="ArticleContent"]',
            'main article',
            '.content article'
        ];

        let contentContainer = null;
        for (const selector of contentSelectors) {
            contentContainer = document.querySelector(selector);
            if (contentContainer) {
                console.log('找到内容容器:', selector);
                break;
            }
        }

        if (contentContainer) {
            // 克隆内容以避免修改原页面
            const clonedContent = contentContainer.cloneNode(true);

            // 移除不需要的元素
            const unwantedSelectors = [
                '[class*="comment"]',
                '[class*="留言"]',
                '[class*="audioPlayer"]',
                '[class*="audio-player"]',
                'button',
                'script',
                'style',
                '[class*="share"]',
                '[class*="toolbar"]'
            ];

            unwantedSelectors.forEach(selector => {
                const elements = clonedContent.querySelectorAll(selector);
                elements.forEach(el => {
                    console.log('移除元素:', el.className);
                    el.remove();
                });
            });

            content = clonedContent.innerHTML;
            console.log('内容长度:', content.length);
        } else {
            console.error('未找到文章内容容器');
            content = '<p>无法提取文章内容，请尝试刷新页面后重试</p>';
        }

        return {
            title,
            courseName,
            date,
            author: '',
            content
        };
    }

    /**
     * 导出为PDF
     */
    function exportToPDF() {
        console.log('=== 开始导出PDF ===');

        // 显示加载提示
        const loadingDiv = showLoading();

        try {
            const articleData = getArticleContent();
            console.log('提取的数据:', {
                title: articleData.title,
                courseName: articleData.courseName,
                date: articleData.date,
                contentLength: articleData.content.length
            });

            // 检查内容是否为空
            if (!articleData.content || articleData.content.length < 50) {
                console.error('内容提取失败或内容过短');
                hideLoading(loadingDiv);
                showMessage('内容提取失败，请刷新页面后重试', 'error');
                return;
            }

            // 创建PDF内容HTML
            const pdfContent = `
                <div style="padding: 40px; font-family: 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #667eea; padding-bottom: 20px;">
                        <h1 style="font-size: 24px; margin: 0 0 10px 0; color: #667eea; font-weight: bold;">${articleData.title}</h1>
                        ${articleData.courseName ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">${articleData.courseName}</p>` : ''}
                        ${articleData.date ? `<p style="font-size: 12px; color: #999; margin: 5px 0;">${articleData.date}</p>` : ''}
                    </div>
                    <div style="font-size: 14px; line-height: 1.8;">
                        ${articleData.content}
                    </div>
                    <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e8e8e8; text-align: center; color: #999; font-size: 10px;">
                        <p style="margin: 5px 0;">导出自: 得到APP</p>
                        <p style="margin: 5px 0;">导出时间: ${new Date().toLocaleString('zh-CN')}</p>
                    </div>
                </div>
            `;

            console.log('PDF内容长度:', pdfContent.length);

            // 创建临时容器
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = pdfContent;
            tempDiv.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 210mm; background: white;';
            document.body.appendChild(tempDiv);

            console.log('临时容器已添加，开始生成PDF');

            // 检查html2pdf是否可用
            if (typeof html2pdf === 'undefined') {
                console.error('html2pdf库未加载');
                document.body.removeChild(tempDiv);
                hideLoading(loadingDiv);
                showMessage('PDF生成库加载失败，请刷新页面重试', 'error');
                return;
            }

            // PDF配置选项
            const opt = {
                margin: [15, 15, 15, 15],
                filename: `${articleData.title.replace(/[/\\?%*:|"<>]/g, '_').substring(0, 50)}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: true,
                    letterRendering: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff'
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            console.log('PDF配置:', opt);

            // 生成PDF
            html2pdf().set(opt).from(tempDiv).save().then(() => {
                console.log('PDF生成成功');
                // 清理临时元素
                if (tempDiv.parentNode) {
                    document.body.removeChild(tempDiv);
                }
                hideLoading(loadingDiv);
                showMessage('PDF导出成功!', 'success');
            }).catch(err => {
                console.error('PDF生成失败:', err);
                if (tempDiv.parentNode) {
                    document.body.removeChild(tempDiv);
                }
                hideLoading(loadingDiv);
                showMessage('PDF导出失败: ' + err.message, 'error');
            });

        } catch (error) {
            console.error('导出错误:', error);
            console.error('错误堆栈:', error.stack);
            hideLoading(loadingDiv);
            showMessage('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 显示加载提示
     */
    function showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-size: 16px;
        `;
        loadingDiv.textContent = '正在生成PDF,请稍候...';
        document.body.appendChild(loadingDiv);
        return loadingDiv;
    }

    /**
     * 隐藏加载提示
     */
    function hideLoading(loadingDiv) {
        if (loadingDiv && loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
    }

    /**
     * 显示消息提示
     */
    function showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        const bgColor = type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#1890ff';

        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10001;
            background: ${bgColor};
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideDown 0.3s ease;
        `;

        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // 3秒后自动消失
        setTimeout(() => {
            messageDiv.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }

    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
        }
    `;
    document.head.appendChild(style);

})();
