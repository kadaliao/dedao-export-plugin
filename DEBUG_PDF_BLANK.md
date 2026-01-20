# PDF导出空白问题调试指南

## 问题现象
点击"📄 导出PDF"按钮后，PDF文件已生成并下载，但打开后发现是空白的，没有任何内容。

## 调试步骤

### 第1步：打开浏览器控制台

1. 按 F12 键打开开发者工具
2. 切换到 **Console（控制台）** 标签页
3. 刷新页面

### 第2步：点击导出按钮并查看日志

点击"📄 导出PDF"按钮，查看控制台输出的日志信息。

#### 正常情况下应该看到：

```
=== 开始导出PDF ===
开始提取文章内容
文章标题: 001｜2026年，你的资产配置该如何规划？
课程名称: 何刚·投资参考（年度日更）
日期: 2026年1月5日
找到内容容器: article
内容长度: 12345
提取的数据: {title: "...", courseName: "...", date: "...", contentLength: 12345}
PDF内容长度: 15678
临时容器已添加，开始生成PDF
PDF配置: {...}
PDF生成成功
```

#### 如果出现以下情况，说明有问题：

**情况1：内容长度为0或很小**
```
内容长度: 0
内容提取失败或内容过短
```
**原因**：article标签找到了，但内容被过滤掉了或者页面还未完全加载

**情况2：未找到内容容器**
```
未找到文章内容容器
内容长度: 41  （只有错误提示文字）
```
**原因**：article选择器没有找到内容

**情况3：html2pdf未加载**
```
html2pdf库未加载
```
**原因**：CDN被墙或网络问题

### 第3步：手动检查页面元素

在控制台执行以下代码，检查页面结构：

```javascript
// 检查article标签
const article = document.querySelector('article');
console.log('找到article:', !!article);
if (article) {
    console.log('article类名:', article.className);
    console.log('article文本长度:', article.textContent.length);
    console.log('article HTML长度:', article.innerHTML.length);
    console.log('article前100字符:', article.textContent.substring(0, 100));
}

// 检查段落数量
const paragraphs = document.querySelectorAll('article p');
console.log('段落数量:', paragraphs.length);

// 检查html2pdf
console.log('html2pdf可用:', typeof html2pdf !== 'undefined');
```

### 第4步：测试内容提取

在控制台执行以下代码，手动测试内容提取：

```javascript
// 提取内容
const article = document.querySelector('article');
if (article) {
    const clone = article.cloneNode(true);

    // 移除不需要的元素
    const unwanted = clone.querySelectorAll('[class*="comment"], [class*="留言"], button, script, style');
    unwanted.forEach(el => el.remove());

    console.log('清理后的HTML长度:', clone.innerHTML.length);
    console.log('清理后的文本长度:', clone.textContent.length);
    console.log('前200字符:', clone.textContent.substring(0, 200));

    // 查看清理后的HTML结构
    console.log('清理后的HTML:', clone.innerHTML.substring(0, 500));
}
```

## 常见原因和解决方案

### 原因1：页面未完全加载

**现象**：contentLength为0或很小

**解决方案**：
1. 等待页面完全加载（向下滚动查看全文）
2. 等待5秒后再点击导出按钮
3. 尝试刷新页面

### 原因2：内容被过度过滤

**现象**：找到了article但内容长度为0

**解决方案**：
检查是否所有段落都被当作"不需要的元素"移除了。在控制台执行：

```javascript
const article = document.querySelector('article');
const buttons = article.querySelectorAll('button');
console.log('按钮数量:', buttons.length);

const comments = article.querySelectorAll('[class*="comment"], [class*="留言"]');
console.log('评论元素:', comments.length);
```

### 原因3：html2pdf库未加载

**现象**：提示"html2pdf库未加载"

**解决方案**：
1. 检查网络连接
2. 尝试访问 https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
3. 如果无法访问，需要使用VPN或更换CDN源

### 原因4：临时容器位置不对

**现象**：PDF生成了但是空白

**解决方案**：
检查临时容器是否正确创建。在点击导出后立即在控制台执行：

```javascript
// 查找临时容器（在PDF生成过程中）
const temps = document.querySelectorAll('div');
const temp = Array.from(temps).find(div =>
    div.style.position === 'absolute' &&
    div.style.left === '-9999px'
);

if (temp) {
    console.log('找到临时容器');
    console.log('内容长度:', temp.textContent.length);
    console.log('HTML长度:', temp.innerHTML.length);

    // 临时显示容器看看内容
    temp.style.left = '0px';
    temp.style.top = '0px';
    temp.style.zIndex = '99999';
    temp.style.background = 'white';
}
```

## 高级调试：查看生成的PDF内容

如果以上都正常，但PDF仍然空白，在导出前修改代码：

在控制台粘贴并执行这段测试代码：

```javascript
// 模拟导出过程
const article = document.querySelector('article');
if (!article) {
    console.error('未找到article');
} else {
    const clone = article.cloneNode(true);

    // 清理
    clone.querySelectorAll('[class*="comment"], [class*="留言"], button').forEach(el => el.remove());

    // 创建完整的PDF内容
    const pdfContent = `
        <div style="padding: 40px; font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto; background: white;">
            <h1 style="color: #667eea;">测试标题</h1>
            <div style="font-size: 14px;">
                ${clone.innerHTML}
            </div>
        </div>
    `;

    // 创建临时容器并显示
    const test = document.createElement('div');
    test.innerHTML = pdfContent;
    test.style.cssText = 'position: fixed; left: 0; top: 0; z-index: 99999; background: white; width: 100%; height: 100%; overflow: auto;';
    document.body.appendChild(test);

    console.log('已显示PDF预览内容，检查是否正常');
    console.log('点击页面任意处关闭预览');

    test.addEventListener('click', () => {
        document.body.removeChild(test);
    });
}
```

这会在页面上显示即将导出的内容，可以直观看到内容是否正确。

## 需要提供的信息

如果以上方法都无法解决，请在GitHub Issues中提供：

1. 完整的控制台日志（截图）
2. 上述测试代码的输出结果
3. 浏览器类型和版本
4. 文章页面URL（如果可以公开）
5. 导出的空白PDF文件（如果可以共享）

GitHub Issues: https://github.com/kadaliao/dedao-export-plugin/issues
