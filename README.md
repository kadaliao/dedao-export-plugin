# 得到专栏导出PDF工具

一个用于将得到APP专栏文章导出为PDF的油猴脚本。

## 功能特性

- 一键导出得到专栏文章为PDF格式
- 保留文章标题、课程名称、日期、作者等元信息
- 自动格式化文章内容,生成美观的PDF文档
- 支持图片导出
- 添加导出时间戳

## 安装步骤

### 1. 安装油猴扩展

首先需要在浏览器中安装Tampermonkey(油猴)扩展:

- **Chrome/Edge**: 访问 [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: 访问 [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Safari**: 访问 [App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### 2. 安装脚本

有两种安装方式:

#### 方式一: 直接安装
1. 点击 [dedao-export.user.js](dedao-export.user.js) 文件
2. 点击 "Raw" 按钮
3. Tampermonkey会自动识别并弹出安装提示
4. 点击"安装"按钮

#### 方式二: 手动安装
1. 打开Tampermonkey管理面板
2. 点击"添加新脚本"标签
3. 复制 `dedao-export.user.js` 文件的全部内容
4. 粘贴到编辑器中
5. 点击"文件" -> "保存"

## 使用方法

1. 登录得到APP网页版: https://www.dedao.cn
2. 打开任意专栏文章页面(URL格式: `https://www.dedao.cn/course/article?id=xxx`)
3. 页面右上角会自动出现"📄 导出PDF"按钮
4. 点击按钮,等待PDF生成
5. PDF会自动下载到浏览器默认下载目录

## 注意事项

- 脚本需要在文章页面完全加载后才会显示导出按钮
- 导出PDF时请保持页面打开,不要切换或关闭标签页
- 文章内容较多时,生成PDF可能需要几秒钟时间
- PDF文件名自动使用文章标题命名

## 功能说明

### 导出内容包括

- 文章标题
- 课程名称
- 发布日期
- 作者信息
- 文章正文内容
- 文章中的图片
- 导出时间戳

### 自动过滤内容

脚本会自动过滤以下内容,使PDF更简洁:

- 留言评论区
- 音频播放器
- 页面按钮
- 广告元素

## 技术说明

- 使用 [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) 库生成PDF
- 支持中文字体渲染
- A4纸张大小,纵向排版
- 高质量图片导出(98%质量)

## 常见问题

### 1. 按钮没有出现?
- 确保已安装Tampermonkey扩展
- 确保脚本已启用
- 刷新页面重试
- 检查URL是否为文章页面

### 2. PDF导出失败?
- 检查网络连接
- 确保页面完全加载
- 尝试刷新页面后重新导出
- 查看浏览器控制台是否有错误信息

### 3. PDF内容不完整?
- 等待页面完全加载后再导出
- 检查文章是否需要向下滚动才能看到全部内容
- 尝试刷新页面后重新导出

## 更新日志

### v1.0.0 (2026-01-20)
- 首次发布
- 实现基本的PDF导出功能
- 支持文章标题、正文、图片导出
- 添加导出进度提示

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request!

## 免责声明

本工具仅供个人学习和研究使用,请勿用于商业用途。导出的内容版权归得到APP及原作者所有。
