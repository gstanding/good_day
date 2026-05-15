# PROJECT.md — Good Day (好日子) Mini Program

> Machine-readable context document. Updated with each significant feature change.
> Last updated: 2026-04-28

---

## 项目概览

**名称:** 好日子 (good_day)  
**核心目的:** 微信小程序工具集，提供公/农历纪念日倒数正数与基于地理位置的声音时间胶囊两大功能，数据全部本地存储，无服务端。  
**AppID:** wx9e1378f0c62cb385  

**技术栈:**
- 语言: JavaScript (ES6+)
- 框架: 微信小程序原生框架 (WXML / WXSS / JS / JSON)
- 基础库版本: 2.19.4
- npm 依赖: `lunar-javascript@^1.7.7`（公农历互转）
- 构建工具: 微信开发者工具（Babel + PostCSS，`es6: true`）

**运行环境:**
- 微信开发者工具 + 真机预览
- 需要 `scope.userLocation` 权限（时间胶囊地图功能）
- 无需后端，无网络请求（除 mock 音频示例 URL）

---

## 架构说明

### 目录结构

```
good_day/
├── app.js                          # 全局入口，初始化 globalData.theme
├── app.json                        # 主包页面 + 分包声明 + 位置权限
├── app.wxss                        # 全局样式（极少）
├── package.json                    # lunar-javascript 依赖
├── assets/
│   ├── logo.png
│   └── tape_marker.png / .svg      # 地图标记图标
├── pages/
│   └── home/                       # 主包唯一页面，应用入口
│       ├── home.js                 # 主题系统 + 统计摘要加载 + 导航
│       ├── home.wxml
│       └── home.wxss
├── subpackages/
│   ├── anniversary/                # 纪念日分包
│   │   ├── pages/
│   │   │   ├── index/              # 纪念日列表
│   │   │   ├── edit/               # 新建/编辑纪念日
│   │   │   └── detail/             # 纪念日详情 + 日历 + 分享
│   │   └── utils/
│   │       ├── storage.js          # wx.Storage CRUD，key=GOOD_DAY_ANNIVERSARIES
│   │       ├── util.js             # 日期计算核心（倒数/正数/进度/下次日期）
│   │       └── lunar.js            # lunar-javascript 的 miniprogram 入口（npm构建产物）
│   └── timecapsule/                # 时间胶囊分包
│       ├── pages/
│       │   ├── map/                # 地图主页，标记所有胶囊，长按触发 Plog
│       │   ├── record/             # 录音 + 封面图 + 保存胶囊
│       │   ├── player/             # 单胶囊播放页
│       │   └── plog/               # 旅行记录：按区域聚合胶囊，连续播放
│       └── utils/
│           ├── capsuleService.js   # 胶囊 CRUD + 地理距离 + mock 数据，key=TIME_CAPSULES
│           ├── storage.js          # ⚠️ 实为 anniversary/utils/storage.js 的拷贝（key 错误，实际未被 capsuleService 使用）
│           ├── util.js             # 同 anniversary/utils/util.js（重复代码）
│           └── lunar.js            # 同上
```

### 核心模块职责

| 模块 | 职责 |
|------|------|
| `pages/home/home.js` | 4 主题系统管理；从 Storage 读取最近纪念日和胶囊数量作为摘要；页面跳转入口 |
| `anniversary/utils/util.js` | 所有日期计算：公历/农历 × 年/月/周周期的"下次发生日"、剩余天数、已过天数、周期进度百分比 |
| `anniversary/utils/storage.js` | 纪念日列表的 getItems / saveItem / deleteItem / getItem |
| `timecapsule/utils/capsuleService.js` | 胶囊 CRUD；Haversine 距离计算；50m 半径发现 + 每日5次限额；首次运行 seed 3 个 mock 胶囊 |

### 数据流向

```
Storage (wx.getStorageSync)
    │
    ├─► anniversary/utils/storage.js ──► index.js / detail.js / edit.js
    │                                        │ util.js（日期计算）
    │                                        ▼
    │                               pages/home/home.js（_loadAnniversary）
    │
    └─► capsuleService.js (直接读写 TIME_CAPSULES)
            │
            ├─► map.js（标记渲染）
            ├─► record.js（保存新胶囊，含 wx.getLocation）
            ├─► player.js（单播）
            └─► plog.js（区域聚合播放）
```

---

## 关键实体

### AnniversaryItem（纪念日条目）

```js
{
  id: string,          // uuid v4
  title: string,       // 用户自定义标题
  date: string,        // "YYYY-MM-DD"，存储原始日期（公历或农历原始值）
  mode: 'countDown' | 'countUp',  // 倒计时 | 正计时
  cycle: 'year' | 'month' | 'week', // 重复周期，仅 countDown 有效
  type: 'solar' | 'lunar',          // 公历 | 农历
  theme: string,       // 主题色 hex，如 '#ff4d4f'
  imagePath?: string,  // 可选，wx.getFileSystemManager().saveFile() 存储的本地路径
}
```

### TimeCapsule（时间胶囊）

```js
{
  id: string,          // uuid v4
  latitude: number,    // gcj02 坐标
  longitude: number,
  filePath: string,    // AAC 音频本地持久路径（saveFile 结果）
  duration: number,    // 秒，录音时长
  createdAt: number,   // Date.now() 毫秒时间戳
  title: string,
  description?: string,
  isMine?: boolean,    // true = 本用户创建
  isMock?: boolean,    // true = 初始化 seed 数据，filePath 为空
  imagePath?: string,  // 可选封面图本地持久路径
}
```

### 主题 Token（4 套，定义于 home.js THEMES 对象）

```
key: 'minimal' | 'cream' | 'tape' | 'midnight'
每套 token 包含:
  pageBg, navBg, navText(black|white), dark(bool)
  card, cardBorder, cardShadow
  text, textMuted, textDim, sectionLabel, divider, chevron
  heroBg, heroText, heroAccent, heroMuted, heroShadow
  comingBg, comingBorderColor
  btnBg, btnBorder
  sheetBg, sheetText, sheetSec, handle, themeCardBg
  iconComingBg, iconComingPlus
```

### Storage Key 清单

| Key | 类型 | 用途 |
|-----|------|------|
| `GOOD_DAY_ANNIVERSARIES` | `AnniversaryItem[]` | 纪念日列表 |
| `TIME_CAPSULES` | `TimeCapsule[]` | 胶囊列表 |
| `SEEDED_CAPSULES` | `boolean` | mock 数据是否已 seed |
| `DAILY_DISCOVERY_${new Date().toDateString()}` | `number` | 当日发现胶囊次数（限5次） |
| `toolkit-theme` | `string` | 当前主题 key |

### 环境变量

无。所有配置内联于代码或 project.config.json。外部 URL 硬编码：
- `https://down.ear0.com:3321/preview?soundid=37418&type=mp3`（mock 胶囊 demo 音频，非生产用）

---

## 业务逻辑要点

### 纪念日日期计算流程

1. 用户存储原始日期（如 `2020-02-14`，type=solar，cycle=year）
2. `getTargetDateObj(dateStr, type, cycle)` → 返回"下次发生"的 Date 对象
   - solar + year: 当年同月日；若已过则 +1 年
   - solar + month: 当月同日；若已过则 +1 月
   - solar + week: 按原日期的星期几，取下一个该星期几
   - lunar + year/month: 通过 `Lunar.fromYmd()` → `getSolar()` 转换后同逻辑
   - lunar + week: 转换为公历后按星期几处理（农历周不真正支持）
3. `getDaysLeft` = `Math.ceil((target - today) / 86400000)`
4. `getDaysPassed` = `Math.floor((today - start) / 86400000)`（countUp 模式）
5. `getCycleProgress` = `(today - prevOccurrence) / (nextOccurrence - prevOccurrence) * 100`
6. 首页 Hero 卡取所有 countDown 中 `days >= 0` 的最小值条目展示

### 时间胶囊录制保存流程

1. 长按录音按钮 → `recorderManager.start({duration:60000, format:'aac'})`
2. 松开 → `recorderManager.stop()` → 得到 tempFilePath
3. 填写标题（必填）+ 可选封面图
4. 保存：`wx.getLocation` → 构建 capsule 对象 → `wx.getFileSystemManager().saveFile(tempFilePath)` → 持久化音频 → 若有图片同样 saveFile → `capsuleService.saveCapsule(capsule)`

### 地图标记 ID 处理

微信地图 `bindmarkertap` 只支持数字 ID。capsuleService 的 UUID 用 djb2 哈希转为正整数，同时在 marker 对象上保留 `_uuid` 字段用于反查原始数据。

### 已知业务规则与约束

- 录音最短 1000ms，最长 60s（超时自动停止）
- 每日发现他人胶囊上限 5 次（`DAILY_DISCOVERY_*` key 按天重置）
- 发现半径 50m；Plog 区域半径用户可调（地图长按后 slider 设置，默认 1000m）
- 农历月份无闰月处理（`currentLunarMonth + 1` 可能跳过闰月）
- 公历月份溢出（如 2 月 30 日）行为依赖 JS Date 自动溢出，未做 clamp

---

## 开发约定

**命名规范:**
- 文件/目录: kebab-case（小程序框架约定）
- JS 变量/函数: camelCase
- Storage key: SCREAMING_SNAKE_CASE
- 主题 token key: camelCase，语义化（`heroBg`, `textMuted`）

**commit 规范:** `type(scope): 描述`，中文描述
- type: feat / fix / refactor / docs
- scope: home / anniversary / timecapsule

**分支策略:**
- `main`：稳定版本，通过 PR 合入
- 功能分支：`claude/...` 前缀为 AI 辅助开发分支

**测试策略:** 无自动化测试，依赖微信开发者工具模拟器 + 真机手动验证。

---

## 当前状态

### 已完成功能

- [x] 主包首页：4 主题系统（极简白/暖意奶油/磁带蓝/深夜黑），主题持久化
- [x] 首页 Hero 卡：展示最近纪念日，有封面图时以图片替换主题色背景，点击直跳详情
- [x] 纪念日：列表 / 新建 / 编辑 / 删除 / 详情
- [x] 纪念日：公历 + 农历，年/月/周周期，倒计时 + 正计时双模式
- [x] 纪念日：周期进度条（countDown 模式详情页）
- [x] 纪念日：添加到系统日历（`wx.addPhoneCalendar`）
- [x] 纪念日：微信内分享
- [x] 纪念日：封面照片（编辑页选取/移除，持久化保存，详情页图片背景+遮罩）
- [x] 时间胶囊：地图主页，基于 GPS 展示所有胶囊标记
- [x] 时间胶囊：录音创建（AAC，max 60s），含 GPS 定位 + 封面图
- [x] 时间胶囊：单胶囊播放页（磁带 UI，封面图背景）
- [x] 时间胶囊：Plog 旅行记录（区域内胶囊聚合，地图 + 顺序连续播放）
- [x] 时间胶囊：首次运行 seed 3 个 mock 胶囊，发现限额机制

### 进行中

- 当前工作分支 `claude/analyze-repository-t8Tfd` 处于活跃开发状态

### 已知问题 / TODO

| 问题 | 位置 | 严重度 |
|------|------|--------|
| `timecapsule/utils/storage.js` key 错误（`GOOD_DAY_ANNIVERSARIES`），与 capsuleService.js 不一致，该文件实际未被任何胶囊模块 require | timecapsule/utils/storage.js | 低（不影响运行，dead code） |
| 农历"每周"周期实为按星期几的公历逻辑，非真正农历周 | anniversary/utils/util.js:35-45 | 低（边缘场景） |
| 公历"每月"日期溢出（如 2 月 30 日）未做 clamp | anniversary/utils/util.js:98-108 | 低 |
| mock 胶囊播放使用硬编码外部音频 URL，可能失效 | player.js:52, plog.js:5 | 低（仅 demo） |
| ~~Plog 搜索以长按坐标为中心，mock 胶囊在 GPS 坐标附近，两者不一致导致无结果~~ | 已修复 | - |
| ~~`seedMockCapsules` 一次性 flag，跨 session GPS 变化后 mock 胶囊坐标过期~~ | 已修复 | - |
| player.js 用松散相等 `c.id == id` 匹配 UUID | player.js:34 | 低 |
| `util.js` 在 anniversary 和 timecapsule 两个分包中完全重复 | 两处 utils/util.js | 低（分包隔离设计，不能跨包 require） |
| `app.js` 中 `globalData.theme` 初始化与实际使用（`toolkit-theme` key）不一致，home.js 直接读 Storage 未走 globalData | app.js:4-5 | 低 |

---

## 外部依赖

### npm 包

| 包 | 版本 | 用途 |
|----|------|------|
| `lunar-javascript` | ^1.7.7 | Solar ↔ Lunar 互转，`Solar.fromDate()`, `Lunar.fromYmd()` |

### 微信 API（关键）

| API | 用途 |
|-----|------|
| `wx.getStorageSync / setStorageSync` | 全部数据持久化 |
| `wx.getLocation({type:'gcj02'})` | 录制胶囊时获取坐标 |
| `wx.getRecorderManager()` | 录音 |
| `wx.createInnerAudioContext()` | 音频播放 |
| `wx.chooseMedia` | 选取封面照片 |
| `wx.getFileSystemManager().saveFile()` | 音频/图片持久化（temp→永久路径） |
| `wx.addPhoneCalendar` | 纪念日添加到系统日历 |
| `wx.setNavigationBarColor` | 主题联动导航栏颜色 |

### 外部 URL

- `https://down.ear0.com:3321/preview?soundid=37418&type=mp3` — mock 胶囊播放 demo 音频，仅开发测试用，非生产依赖

### 数据库

无数据库。全部数据存储于微信本地 Storage（键值对，单 key 上限 1MB，Storage 总量 10MB）。
