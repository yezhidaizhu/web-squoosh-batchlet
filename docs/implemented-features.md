# Vicoco 已实现功能

本文件是产品功能声明的权威清单。SEO 内容只能声明这里标记为 `✓` 的能力。

## 输入与队列

| 功能                             | 状态 | 实现依据                                                                     |
| -------------------------------- | :--: | ---------------------------------------------------------------------------- |
| 单张和多张图片选择               |  ✓   | [App/index.tsx](../src/client/initial-app/App/index.tsx)                     |
| 文件夹选择和递归目录拖放         |  ✓   | [App/index.tsx](../src/client/initial-app/App/index.tsx)                     |
| 拖放和剪贴板粘贴                 |  ✓   | [App/index.tsx](../src/client/initial-app/App/index.tsx)                     |
| 重复图片过滤                     |  ✓   | [App/index.tsx](../src/client/initial-app/App/index.tsx)                     |
| SEO 页面 IndexedDB 交接          |  ✓   | [handoff.ts](../src/client/initial-app/handoff.ts)                           |
| 添加、选择、删除、清空和折叠队列 |  ✓   | [ImageQueue/index.tsx](../src/client/lazy-app/Compress/ImageQueue/index.tsx) |
| 清空队列后撤销                   |  ✓   | [App/index.tsx](../src/client/initial-app/App/index.tsx)                     |

## 编解码与编辑

| 功能                                           | 状态 | 实现依据                                                                             |
| ---------------------------------------------- | :--: | ------------------------------------------------------------------------------------ |
| 浏览器支持的常用图片输入                       |  ✓   | [Compress/index.tsx](../src/client/lazy-app/Compress/index.tsx)                      |
| AVIF、WebP、JPEG XL、WebP v2、QOI 专用解码回退 |  ✓   | [Compress/index.tsx](../src/client/lazy-app/Compress/index.tsx)                      |
| SVG 输入和栅格化处理                           |  ✓   | [Compress/index.tsx](../src/client/lazy-app/Compress/index.tsx)                      |
| JPEG、PNG、WebP、AVIF 输出                     |  ✓   | [feature-meta/index.ts](../src/client/lazy-app/feature-meta/index.ts)                |
| GIF、JPEG XL、QOI、WebP v2 输出                |  ✓   | [feature-meta/index.ts](../src/client/lazy-app/feature-meta/index.ts)                |
| 编码质量与格式专用参数                         |  ✓   | [Options/index.tsx](../src/client/lazy-app/Compress/Options/index.tsx)               |
| 自定义宽高、比例锁定和尺寸倍率预设             |  ✓   | [resize/client/index.tsx](../src/features/processors/resize/client/index.tsx)        |
| 多种缩放算法和 SVG 矢量缩放                    |  ✓   | [resize/client/index.tsx](../src/features/processors/resize/client/index.tsx)        |
| 调色板颜色数量与抖动                           |  ✓   | [quantize/client/index.tsx](../src/features/processors/quantize/client/index.tsx)    |
| 90 度旋转                                      |  ✓   | [Output/index.tsx](../src/client/lazy-app/Compress/Output/index.tsx)                 |
| 双图滑动对比、缩放、平移和背景切换             |  ✓   | [Output/index.tsx](../src/client/lazy-app/Compress/Output/index.tsx)                 |
| 输入输出文件大小、尺寸和变化比例               |  ✓   | [Results/index.tsx](../src/client/lazy-app/Compress/Results/index.tsx)               |
| 单图下载                                       |  ✓   | [Results/index.tsx](../src/client/lazy-app/Compress/Results/index.tsx)               |
| JPEG、WebP、AVIF 单次目标大小自动调参          |  ✓   | [target-size.ts](../src/client/lazy-app/Compress/target-size.ts)                     |
| 目标大小提交校验与搜索期间设置锁定             |  ✓   | [TargetSize/index.tsx](../src/client/lazy-app/Compress/Options/TargetSize/index.tsx) |
| 目标大小无法满足时自动缩小并回写 Resize        |  ✓   | [target-size.ts](../src/client/lazy-app/Compress/target-size.ts)                     |

JPEG XL 在界面中标记为 beta，WebP v2 标记为 unstable。对外 SEO 页面默认只应宣传 JPEG、PNG、WebP 和 AVIF。

## 批量与持久化

| 功能                                                | 状态 | 实现依据                                                                         |
| --------------------------------------------------- | :--: | -------------------------------------------------------------------------------- |
| 将右侧设置应用到完整队列                            |  ✓   | [Compress/index.tsx](../src/client/lazy-app/Compress/index.tsx)                  |
| 批量进度和停止处理                                  |  ✓   | [App/index.tsx](../src/client/initial-app/App/index.tsx)                         |
| ZIP 打包下载和重名避让                              |  ✓   | [App/index.tsx](../src/client/initial-app/App/index.tsx)                         |
| 自定义 ZIP 文件名                                   |  ✓   | [App/index.tsx](../src/client/initial-app/App/index.tsx)                         |
| `{name}`、`{index}`、`{width}`、`{height}` 命名变量 |  ✓   | [batch-naming.ts](../src/client/initial-app/App/batch-naming.ts)                 |
| 保存和复用压缩预设                                  |  ✓   | [compression-presets.ts](../src/client/lazy-app/Compress/compression-presets.ts) |
| 保存左右面板最近设置                                |  ✓   | [Compress/index.tsx](../src/client/lazy-app/Compress/index.tsx)                  |

## 隐私与安装

| 功能                           | 状态 | 实现依据                                                        |
| ------------------------------ | :--: | --------------------------------------------------------------- |
| 浏览器内 Web Worker/WASM 处理  |  ✓   | [Compress/index.tsx](../src/client/lazy-app/Compress/index.tsx) |
| 图片不上传处理服务器           |  ✓   | 编解码和批处理均使用本地文件、Canvas、Worker 与 Blob            |
| PWA manifest 和 Service Worker |  ✓   | [static-build/index.tsx](../src/static-build/index.tsx)         |
| 系统图片分享入口               |  ✓   | [static-build/index.tsx](../src/static-build/index.tsx)         |
| 明暗主题                       |  ✓   | [App/index.tsx](../src/client/initial-app/App/index.tsx)        |

## 未实现

| 功能               | 状态 | 依据                                                                                                                                                                                                 |
| ------------------ | :--: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.jpeg` 扩展名导出 |      | 两个 JPEG 编码器都固定输出 `.jpg`，见 [mozJPEG/shared/meta.ts](../src/features/encoders/mozJPEG/shared/meta.ts) 和 [browserJPEG/shared/meta.ts](../src/features/encoders/browserJPEG/shared/meta.ts) |

功能发生变化时，同步更新本文件和 SEO 仓库的 `docs/product-capabilities.md`。
