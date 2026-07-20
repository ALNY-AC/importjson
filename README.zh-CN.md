
# JSON 自动导入

[English](README.md)

自动导入 JSON 文件。

## 功能

- JSON 自动导入
- 支持 TypeScript、TSX、JavaScript、JSX、Vue 等任意可配置语言
- 支持变量名转换
- 支持是否保留扩展名
- 支持拖拽 JSON 自动导入
- 自动预览 import 语句

## 演示

### 自动补全

![completion](images/completion.png)

### 拖拽导入

![drag](images/drag-drop.png)

### 插件配置

![settings](images/settings.png)

---

## 支持的变量命名方式

- keep
- lowercase
- UPPERCASE
- snake_case
- SCREAMING_SNAKE_CASE
- camelCase
- PascalCase
- kebab-case

---

## 插件配置

| 配置项 | 说明 |
| ------- | ---- |
| jsonAutoImport.languages | 支持的语言 |
| jsonAutoImport.keepExtension | 是否保留扩展名 |
| jsonAutoImport.variableName | 变量命名方式 |

---

## 环境要求

VS Code >= 1.95

---

## 更新日志

详见：

CHANGELOG.md

---

## License

MIT
