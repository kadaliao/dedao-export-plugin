// ==UserScript==
// @name         得到专栏导出PDF (打印版)
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  在得到专栏文章页面添加导出PDF按钮,使用浏览器打印功能导出
// @author       Claude
// @match        https://www.dedao.cn/course/article*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('得到专栏导出PDF脚本已加载 (打印版)');

    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log('开始初始化导出按钮');
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
        exportBtn.innerHTML = '🖨️ 打印导出PDF';
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        exportBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
            this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        });

        exportBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        });

        exportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('点击打印导出按钮');
            printToPDF();
        });

        document.body.appendChild(exportBtn);
        console.log('导出按钮已添加到页面');
    }

    /**
     * 获取文章内容
     */
    function getArticleContent() {
        console.log('开始提取文章内容');

        let title = document.title.replace(' - 得到APP', '').trim();
        console.log('文章标题:', title);

        let courseName = '';
        const courseSelectors = ['.courseName', '[class*="courseName"]'];
        for (const selector of courseSelectors) {
            const courseEl = document.querySelector(selector);
            if (courseEl && courseEl.textContent.trim()) {
                courseName = courseEl.textContent.trim();
                break;
            }
        }
        console.log('课程名称:', courseName);

        let date = '';
        const dateSelectors = ['.date', '[class*="date"]'];
        for (const selector of dateSelectors) {
            const dateEl = document.querySelector(selector);
            if (dateEl && dateEl.textContent.includes('202')) {
                date = dateEl.textContent.trim();
                break;
            }
        }
        console.log('日期:', date);

        // 获取文章正文
        const article = document.querySelector('article');
        let content = '';

        if (article) {
            console.log('找到article元素');
            const clone = article.cloneNode(true);

            // 移除不需要的元素
            const unwanted = clone.querySelectorAll(
                '[class*="comment"], [class*="留言"], [class*="audioPlayer"], ' +
                'button, script, style, [class*="share"]'
            );
            unwanted.forEach(el => el.remove());

            content = clone.innerHTML;
            console.log('内容长度:', content.length);
        } else {
            console.error('未找到article元素');
        }

        return { title, courseName, date, content };
    }

    /**
     * 使用打印功能导出PDF
     */
    function printToPDF() {
        console.log('=== 开始打印导出 ===');

        try {
            const articleData = getArticleContent();

            if (!articleData.content || articleData.content.length < 50) {
                alert('内容提取失败，请刷新页面后重试');
                return;
            }

            // 创建打印内容
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${articleData.title}</title>
                    <style>
                        @media print {
                            @page {
                                size: A4;
                                margin: 2cm;
                            }
                            body {
                                font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', Arial, sans-serif;
                                font-size: 14px;
                                line-height: 1.8;
                                color: #333;
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 30px;
                                padding-bottom: 20px;
                                border-bottom: 2px solid #667eea;
                            }
                            .header h1 {
                                font-size: 24px;
                                color: #667eea;
                                margin: 0 0 10px 0;
                            }
                            .header .meta {
                                font-size: 12px;
                                color: #666;
                                margin: 5px 0;
                            }
                            .content {
                                font-size: 14px;
                                line-height: 1.8;
                            }
                            .content p {
                                margin: 12px 0;
                                text-align: justify;
                            }
                            .content h2, .content h3 {
                                margin-top: 20px;
                                margin-bottom: 10px;
                                color: #333;
                            }
                            .content img {
                                max-width: 100%;
                                height: auto;
                                display: block;
                                margin: 15px auto;
                            }
                            .footer {
                                margin-top: 40px;
                                padding-top: 15px;
                                border-top: 1px solid #ddd;
                                text-align: center;
                                font-size: 10px;
                                color: #999;
                            }
                        }
                        @media screen {
                            body {
                                max-width: 800px;
                                margin: 0 auto;
                                padding: 40px;
                                font-family: 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
                                background: #f5f5f5;
                            }
                            .container {
                                background: white;
                                padding: 40px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 30px;
                                padding-bottom: 20px;
                                border-bottom: 2px solid #667eea;
                            }
                            .header h1 {
                                font-size: 28px;
                                color: #667eea;
                                margin: 0 0 10px 0;
                            }
                            .header .meta {
                                font-size: 14px;
                                color: #666;
                                margin: 5px 0;
                            }
                            .content {
                                font-size: 16px;
                                line-height: 1.8;
                                color: #333;
                            }
                            .content p {
                                margin: 15px 0;
                            }
                            .content img {
                                max-width: 100%;
                                height: auto;
                            }
                            .footer {
                                margin-top: 40px;
                                padding-top: 15px;
                                border-top: 1px solid #ddd;
                                text-align: center;
                                font-size: 12px;
                                color: #999;
                            }
                            .print-hint {
                                position: fixed;
                                top: 20px;
                                left: 50%;
                                transform: translateX(-50%);
                                background: #667eea;
                                color: white;
                                padding: 15px 30px;
                                border-radius: 8px;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                z-index: 9999;
                                font-size: 14px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-hint" id="printHint">
                        预览窗口已打开，请按 Ctrl+P (Windows) 或 Cmd+P (Mac) 打印保存为PDF
                    </div>
                    <div class="container">
                        <div class="header">
                            <h1>${articleData.title}</h1>
                            ${articleData.courseName ? `<div class="meta">${articleData.courseName}</div>` : ''}
                            ${articleData.date ? `<div class="meta">${articleData.date}</div>` : ''}
                        </div>
                        <div class="content">
                            ${articleData.content}
                        </div>
                        <div class="footer">
                            <p>导出自: 得到APP</p>
                            <p>导出时间: ${new Date().toLocaleString('zh-CN')}</p>
                        </div>
                    </div>
                    <script>
                        // 3秒后自动隐藏提示
                        setTimeout(function() {
                            var hint = document.getElementById('printHint');
                            if (hint) hint.style.display = 'none';
                        }, 5000);
                    </script>
                </body>
                </html>
            `;

            // 打开新窗口
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();

            // 等待内容加载完成后自动打开打印对话框
            printWindow.onload = function() {
                console.log('打印窗口加载完成');
                setTimeout(function() {
                    printWindow.print();
                }, 500);
            };

            console.log('打印窗口已打开');

        } catch (error) {
            console.error('导出错误:', error);
            alert('导出失败: ' + error.message);
        }
    }

})();
