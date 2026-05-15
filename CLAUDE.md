# Kintsu 项目开发规范

## 微信小程序 `input` 组件布局规则

### ⚠️ 高频错误：input 上下 padding 导致文字贴顶/挤压

**问题根源**：微信小程序的 `<input>` 组件不是标准 HTML input，`padding-top` / `padding-bottom` 不会撑高组件并让文字居中，而是让文字从顶部偏移，导致文字贴顶或字形挤压变形。

**错误写法**：
```css
.some-input {
  padding: 24rpx;        /* ❌ 上下 padding 在 input 组件上无效 */
  line-height: 1.5;      /* ❌ line-height 对 input 垂直居中无效 */
}
```

**正确写法**：
```css
.some-input {
  display: block;        /* ✅ 必须，否则 width:100% 失效 */
  width: 100%;
  height: 88rpx;         /* ✅ 用 height 控制高度 */
  padding: 0 24rpx;      /* ✅ 只设左右 padding，上下为 0 */
  box-sizing: border-box;
  font-size: 26rpx;
}
```

**规则总结**：
1. 所有 `<input>` 必须加 `display: block`
2. 用 `height` 固定高度，不用 `padding` 撑高
3. 只设 `padding: 0 <水平值>`，禁止 `padding-top` / `padding-bottom`
4. `placeholder-style` 要带 `font-size`，与输入字号保持一致
5. `line-height` 对 input 组件垂直居中无效，勿使用

### `textarea` 组件

`textarea` 不同于 `input`，支持 `padding` 和 `min-height`，但同样需要 `display: block`。
