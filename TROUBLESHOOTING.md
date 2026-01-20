# 使用指南和调试步骤

## 如何确认脚本是否正常运行

### 1. 检查脚本是否已安装并启用

- 打开 Tampermonkey 扩展图标
- 查看是否有"得到专栏导出PDF"脚本
- 确认脚本前面的开关是**绿色**（启用状态）

### 2. 检查脚本是否在页面上运行

1. 访问得到专栏文章页面（例如：https://www.dedao.cn/course/article?id=xxx）
2. 按F12打开浏览器开发者工具
3. 切换到"Console"（控制台）标签页
4. 查找以下日志信息：
   - `得到专栏导出PDF脚本已加载`
   - `开始初始化导出按钮`
   - `正在创建导出按钮`
   - `导出按钮已添加到页面`

### 3. 查找导出按钮

如果看到上述日志，导出按钮应该出现在：
- **位置**：页面右上角
- **样式**：紫色渐变背景按钮
- **文字**：📄 导出PDF
- **距离顶部**：约100px
- **距离右边**：约30px

### 4. 导出按钮截图示例

按钮应该看起来像这样：
```
┌─────────────────┐
│  📄 导出PDF     │  ← 紫色渐变背景，白色文字
└─────────────────┘
```

## 常见问题排查

### 问题1：看不到按钮

**解决方案**：

1. **刷新页面** - 按Ctrl+Shift+R（Windows）或Cmd+Shift+R（Mac）强制刷新
2. **检查控制台** - 查看是否有红色错误信息
3. **等待几秒** - 脚本会在页面加载后3秒创建按钮
4. **检查页面滚动位置** - 按钮固定在右上角，滚动页面不影响
5. **检查浏览器缩放** - 如果浏览器缩放过小，按钮可能在视图外

### 问题2：控制台显示"未找到工具栏容器"（旧版本）

新版本已移除此限制，按钮会直接添加到页面body。

### 问题3：点击按钮没有反应

**检查步骤**：

1. 打开控制台（F12）
2. 点击导出按钮
3. 查看是否显示：`点击导出PDF按钮`
4. 查看是否显示：`开始提取文章内容`
5. 如果有错误信息，记录下来

### 问题4：html2pdf.js加载失败

**解决方案**：

1. 检查网络连接
2. 尝试访问：https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
3. 如果CDN无法访问，需要修改脚本使用其他CDN

## 手动调试步骤

如果按钮仍然看不到，可以手动执行以下代码来创建按钮：

1. 打开控制台（F12）
2. 切换到Console标签
3. 粘贴以下代码并回车：

```javascript
const btn = document.createElement('button');
btn.innerHTML = '📄 测试按钮';
btn.style.cssText = 'position:fixed;top:100px;right:30px;z-index:99999;padding:12px 24px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;';
document.body.appendChild(btn);
console.log('测试按钮已创建');
```

如果测试按钮能显示，说明问题在于脚本执行时机或页面匹配规则。

## 获取帮助

如果以上步骤都无法解决问题，请提供以下信息：

1. 浏览器类型和版本（例如：Chrome 120）
2. Tampermonkey版本
3. 控制台的所有日志信息（截图）
4. 文章页面URL
5. 是否有其他油猴脚本在运行

可以在 GitHub Issues 提交问题：
https://github.com/kadaliao/dedao-export-plugin/issues

## 版本更新

当前版本：**v1.1.0**

更新内容：
- ✅ 移除对特定DOM结构的依赖
- ✅ 按钮直接添加到body，更可靠
- ✅ 增加详细的console日志用于调试
- ✅ 改进按钮样式，更加醒目
- ✅ 优化内容提取逻辑
