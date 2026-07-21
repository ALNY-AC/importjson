# Changelog

## 1.5.0

### ✨ Added

#### 中文

- 新增 **扫描目录** 配置（`jsonAutoImport.searchPaths`），支持配置多个目录，仅扫描指定目录及其所有子目录。
- 新增 **排除目录** 配置（`jsonAutoImport.excludePaths`），支持配置多个目录，自动排除指定目录及其所有子目录。
- 新增 **遵循 `.gitignore`** 配置（`jsonAutoImport.useGitIgnore`），默认开启，可自动过滤 Git 忽略的目录和文件。
- 优化 JSON 文件扫描逻辑，通过统一构建 `include` / `exclude` 规则，提高扫描效率。
- 完善配置项的中英文说明。

#### English

- Added **Search Paths** (`jsonAutoImport.searchPaths`) to scan only specified directories and all their subdirectories.
- Added **Exclude Paths** (`jsonAutoImport.excludePaths`) to exclude specified directories and all their subdirectories.
- Added **Respect .gitignore** (`jsonAutoImport.useGitIgnore`), enabled by default, to automatically ignore Git-excluded files and directories.
- Refactored JSON scanning by building unified `include` / `exclude` glob patterns for better performance.
- Improved multilingual descriptions for extension settings.

## 1.0.0

### Added

- Initial release.
- JSON auto import.
- Auto completion.
- Drag & Drop import.
- Configurable variable naming styles.
- Configurable import path extension.
- Configurable supported language ids.
- Localization support.
