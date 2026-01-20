// ==UserScript==
// @name         得到专栏导出PDF
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  在得到专栏文章页面添加导出PDF按钮,将文章内容导出为PDF格式
// @author       Claude
// @match        https://www.dedao.cn/course/article*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
// ==/UserScript==

(function() {
    'use strict';

    // 等待页面加载完成
    window.addEventListener('load', function() {
        // 延迟初始化,确保内容加载完成
        setTimeout(init, 2000);
    });

    function init() {
        // 创建导出按钮
        createExportButton();
    }

    /**
     * 创建导出按钮
     */
    function createExportButton() {
        // 查找设置按钮的父容器
        const toolbarContainer = document.querySelector('div[class*="ToolBar"]');
        if (!toolbarContainer) {
            console.log('未找到工具栏容器');
            return;
        }

        // 创建导出按钮
        const exportBtn = document.createElement('button');
        exportBtn.textContent = '📄 导出PDF';
        exportBtn.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            padding: 10px 20px;
            background: #1890ff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.3s;
        `;

        // 鼠标悬停效果
        exportBtn.addEventListener('mouseenter', function() {
            this.style.background = '#40a9ff';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        });

        exportBtn.addEventListener('mouseleave', function() {
            this.style.background = '#1890ff';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        });

        // 点击导出
        exportBtn.addEventListener('click', exportToPDF);

        // 添加按钮到页面
        document.body.appendChild(exportBtn);
    }

    /**
     * 获取文章内容
     */
    function getArticleContent() {
        // 获取文章标题
        const titleElement = document.querySelector('div[class*="ToolBar"] div[class*="articleTitle"]');
        const title = titleElement ? titleElement.textContent.trim() : '未命名文章';

        // 获取课程名称
        const courseElement = document.querySelector('div[class*="ToolBar"] div[class*="courseName"]');
        const courseName = courseElement ? courseElement.textContent.trim() : '';

        // 获取日期
        const dateElement = document.querySelector('div[class*="ToolBar"] div[class*="date"]');
        const date = dateElement ? dateElement.textContent.trim() : '';

        // 获取作者信息
        const authorElement = document.querySelector('div[class*="audioPlayer"] div:nth-child(2)');
        const author = authorElement ? authorElement.textContent.trim() : '';

        // 获取文章正文内容
        const contentContainer = document.querySelector('article') || document.querySelector('div[class*="ArticleContent"]');
        let content = '';

        if (contentContainer) {
            // 克隆内容以避免修改原页面
            const clonedContent = contentContainer.cloneNode(true);

            // 移除不需要的元素(如广告、留言区等)
            const unwantedSelectors = [
                'div[class*="留言"]',
                'div[class*="comment"]',
                'div[class*="audioPlayer"]',
                'button',
                'script',
                'style'
            ];

            unwantedSelectors.forEach(selector => {
                const elements = clonedContent.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });

            content = clonedContent.innerHTML;
        }

        return {
            title,
            courseName,
            date,
            author,
            content
        };
    }

    /**
     * 导出为PDF
     */
    function exportToPDF() {
        // 显示加载提示
        const loadingDiv = showLoading();

        try {
            const articleData = getArticleContent();

            // 创建PDF内容HTML
            const pdfContent = `
                <div style="padding: 40px; font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.8; color: #333;">
                    <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1890ff; padding-bottom: 20px;">
                        <h1 style="font-size: 28px; margin: 0 0 10px 0; color: #1890ff;">${articleData.title}</h1>
                        ${articleData.courseName ? `<p style="font-size: 16px; color: #666; margin: 5px 0;">${articleData.courseName}</p>` : ''}
                        ${articleData.date ? `<p style="font-size: 14px; color: #999; margin: 5px 0;">${articleData.date}</p>` : ''}
                        ${articleData.author ? `<p style="font-size: 14px; color: #999; margin: 5px 0;">${articleData.author}</p>` : ''}
                    </div>
                    <div style="font-size: 16px;">
                        ${articleData.content}
                    </div>
                    <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e8e8e8; text-align: center; color: #999; font-size: 12px;">
                        <p>导出自: 得到APP</p>
                        <p>导出时间: ${new Date().toLocaleString('zh-CN')}</p>
                    </div>
                </div>
            `;

            // 创建临时容器
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = pdfContent;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);

            // PDF配置选项
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `${articleData.title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    letterRendering: true
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait'
                }
            };

            // 生成PDF
            html2pdf().set(opt).from(tempDiv).save().then(() => {
                // 清理临时元素
                document.body.removeChild(tempDiv);
                hideLoading(loadingDiv);
                showMessage('PDF导出成功!', 'success');
            }).catch(err => {
                console.error('PDF生成失败:', err);
                document.body.removeChild(tempDiv);
                hideLoading(loadingDiv);
                showMessage('PDF导出失败,请重试', 'error');
            });

        } catch (error) {
            console.error('导出错误:', error);
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
