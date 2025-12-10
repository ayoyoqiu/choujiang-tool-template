# 部署指南 - GitHub Pages

本指南将帮助您将抽奖工具部署到GitHub Pages，让任何人都可以通过网页访问。

## 部署步骤

### 1. 创建GitHub仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `lottery-tool` (或您喜欢的名称)
   - **Description**: `抽奖工具 - 离线网页版`
   - **Visibility**: 选择 Public（GitHub Pages免费版需要公开仓库）
   - **不要**勾选 "Initialize this repository with a README"
4. 点击 "Create repository"

### 2. 上传项目文件

#### 方法一：使用Git命令行（推荐）

```bash
# 1. 进入项目目录
cd 抽奖工具2.0

# 2. 初始化Git仓库
git init

# 3. 添加所有文件
git add .

# 4. 提交文件
git commit -m "Initial commit: 抽奖工具2.0"

# 5. 添加远程仓库（替换为您的仓库地址）
git remote add origin https://github.com/您的用户名/仓库名.git

# 6. 推送到GitHub
git branch -M main
git push -u origin main
```

#### 方法二：使用GitHub网页上传

1. 在GitHub仓库页面，点击 "uploading an existing file"
2. 将以下文件拖拽到页面：
   - `index.html`
   - `main.js`
   - `style.css`
   - `readme.md`
3. 点击 "Commit changes"

### 3. 启用GitHub Pages

1. 在GitHub仓库页面，点击 "Settings"（设置）
2. 在左侧菜单中找到 "Pages"
3. 在 "Source" 部分：
   - 选择 "Deploy from a branch"
   - Branch 选择 "main"（或 "master"）
   - Folder 选择 "/ (root)"
4. 点击 "Save"
5. 等待几分钟，GitHub会生成您的网站地址

### 4. 访问您的网站

部署完成后，您的网站地址将是：
```
https://您的用户名.github.io/仓库名/
```

例如：`https://username.github.io/lottery-tool/`

## 更新网站

如果您修改了代码，需要更新网站：

```bash
# 1. 修改文件后，提交更改
git add .
git commit -m "更新说明"

# 2. 推送到GitHub
git push origin main
```

GitHub Pages会自动更新，通常需要1-2分钟。

## 注意事项

1. **公开仓库**：GitHub Pages免费版需要仓库是公开的
2. **文件路径**：确保所有文件都在仓库根目录
3. **HTTPS**：GitHub Pages自动提供HTTPS加密
4. **自定义域名**：可以在Settings -> Pages中设置自定义域名

## 故障排除

### 网站无法访问

1. 检查仓库是否为Public
2. 确认GitHub Pages已启用
3. 等待几分钟让GitHub完成部署
4. 检查文件路径是否正确

### 功能不正常

1. 清除浏览器缓存
2. 检查浏览器控制台是否有错误
3. 确认所有文件都已上传

## 技术支持

如有问题，请查看：
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- 项目 README.md 文件

