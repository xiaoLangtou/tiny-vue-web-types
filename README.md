# tiny-vue-types

📦 **tiny-vue-types** 提供 `web-types.json`、`vetur-attributes.json` 和 `vetur-tags.json`，用于增强 Vue 组件在 **WebStorm**、**VS Code** 等 IDE 中的智能提示和开发体验。

## ✨ 特性

- 🚀 **Web-Types**：提供 **WebStorm** 组件自动补全和代码提示
- 🛠️ **Vetur 支持**：让 **VS Code Vetur** 插件识别 Vue 组件的属性、事件和插槽
- 🔄 **自动生成**：使用 `npm run build` 生成最新的 `types` 数据
- 📜 **开源可扩展**：支持更多 Vue 组件库的 IDE 提示增强

---

## 📦 安装

你可以通过 `npm` 或 `yarn` 或 `pnpm` 安装此包：

```bash
npm install tiny-vue-types -D

yarn add tiny-vue-types -D

```


## 📂 目录结构


```
tiny-vue-types/
│── types/
│   ├── web-types.json          # WebStorm 代码提示文件
│   ├── vetur-attributes.json   # Vetur 属性提示文件
│   ├── vetur-tags.json         # Vetur 组件提示文件
│── package.json
│── README.md                   # 项目文档

```
