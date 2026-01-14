# 本地开发快速指南

## 🚀 启动本地开发

```bash
npm run dev
```

应用会在 `http://localhost:3000` 启动

---

## ☁️ 本地开发与云同步

### 本地开发模式

当你在 `localhost` 访问应用时:

- ✅ 所有数据保存在浏览器 LocalStorage
- ✅ KV 同步 API 不可用（需要 Cloudflare 环境）
- ✅ 右下角同步指示器显示"同步失败"是正常的

### 使用 Wrangler 测试完整同步

```bash
npm run build
wrangler pages dev dist --kv CLOUDNAV_KV
```

这将在 `http://localhost:8788` 启动带有完整 KV 同步功能的服务。

---

## 📦 测试新功能:图标上传

1. **添加或编辑链接**
   - 点击 "添加新链接" 或编辑现有链接

2. **上传本地图标**
   ```
   图标
   ┌──────────────────────────────────────┐
   │ [📷] [输入框: https://...或Base64]  │
   ├──────────────────────────────────────┤
   │  🪄 获取图标    📤 上传图标         │
   └──────────────────────────────────────┘
   ```

   - **方式1**: 点击 "获取图标" - 从URL自动获取
   - **方式2**: 点击 "上传图标" - 上传本地文件
   - **方式3**: 直接粘贴图标URL或Base64

3. **支持的格式**
   - ✅ SVG (推荐,矢量图)
   - ✅ PNG (支持透明)
   - ✅ JPG/JPEG
   - ✅ ICO (浏览器原生格式)
   - 文件大小限制: 2MB

4. **保存测试**
   - 保存链接后刷新页面
   - 验证图标是否正确显示
   - 数据存储在 LocalStorage,即使关闭浏览器也会保留

---

## 🌐 生产环境部署

### 部署到 Cloudflare Pages

1. **创建 Cloudflare Pages 项目**
   - 连接你的 Git 仓库
   - 构建命令: `npm run build`
   - 输出目录: `dist`

2. **创建 KV 命名空间**
   ```bash
   npx wrangler kv:namespace create "CLOUDNAV_KV"
   ```

3. **绑定 KV 命名空间**
   - 进入 Cloudflare Pages 控制台 -> Settings -> Functions
   - 绑定 KV 命名空间:
     - 变量名: `CLOUDNAV_KV`
     - 命名空间: 选择刚创建的 KV

4. **部署**
   - 推送代码到 Git
   - Cloudflare Pages 自动构建和部署
   - 访问你的 Pages URL

---

## 📁 本地存储说明

### LocalStorage 键名

| 键名 | 用途 |
|------|------|
| `cloudnav_data_cache_v2` | 链接和分类数据（版本2） |
| `cloudnav_ai_config` | AI 配置（API Key、模型等） |
| `cloudnav_search_config` | 搜索引擎配置 |
| `cloudnav_site_settings` | 网站配置（标题、主题色等） |
| `cloudnav_favicon_cache` | 图标缓存（Base64 格式） |
| `cloudnav_device_id` | 设备唯一标识（用于同步冲突检测） |
| `cloudnav_sync_meta` | 同步元数据（版本号、最后同步时间） |
| `cloudnav_last_sync` | 最后同步时间戳 |
| `theme` | 主题模式（light/dark/system） |

### 清除本地数据

如果需要重置:

```javascript
// 打开浏览器控制台执行:
localStorage.clear();
location.reload();
```

---

## 🐛 常见问题

---

### Q: 本地数据会丢失吗?

**A**: LocalStorage 数据会永久保存在浏览器中,除非:
- 手动清除浏览器数据
- 卸载浏览器
- 使用隐私/无痕模式

---

### Q: 如何测试完整的 KV 同步功能?

**A**: 有两种方式：

#### 方式1: 使用 Wrangler 本地模拟 (推荐)

```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare 账号
wrangler login

# 本地启动 Pages 函数 (需要已有 KV 命名空间)
wrangler pages dev dist --kv CLOUDNAV_KV
```

#### 方式2: 部署到 Cloudflare Pages

部署后访问线上地址即可测试完整的 KV 同步功能。

---

### Q: 本地开发时同步状态显示"同步失败"正常吗?

**A**: 是的，这完全正常！本地开发时 `/api/sync` 端点不可用（需要 Cloudflare Pages Functions 环境）。

- 右下角的同步状态指示器会显示红色的"同步失败"
- 这不影响本地开发和测试其他功能
- 部署到 Cloudflare Pages 后会正常工作

---

### Q: KV 同步的工作流程是什么?

**A**:

1. **页面加载时**: 自动从云端拉取数据，与本地版本对比
2. **检测到云端更新**: 弹出冲突解决对话框，用户选择保留哪个版本
3. **本地数据变更时**: 3秒 debounce 后自动推送到云端
4. **冲突检测**: 使用版本号 (version) 进行乐观锁校验

### Q: 上传的图标存储在哪里?

**A**:
- **本地开发**: 图标转换为 Base64 存储在 LocalStorage
- **生产环境**: Base64 存储在 Cloudflare KV

---

## 💡 开发技巧

### 1. 测试不同图标格式

推荐测试网站:
- SVG: https://www.svgrepo.com
- PNG: https://www.flaticon.com
- ICO: 从浏览器地址栏拖拽 favicon

### 2. 查看 LocalStorage 数据

Chrome DevTools:
```
F12 → Application → Storage → Local Storage → http://localhost:3000
```

### 3. 模拟生产环境

```bash
npm run build
npm run preview
```

访问 `http://localhost:4173` 查看构建后的效果

---

## 📞 获取帮助

- 查看 [CLAUDE.md](./CLAUDE.md) 了解项目架构
- 查看 [README.md](./README.md) 了解功能说明
- 检查浏览器控制台的错误日志

---

**快乐开发! 🎉**
