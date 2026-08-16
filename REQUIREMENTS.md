# 需求清单

## 已完成

1. **批量导入与导出** ✅

   支持多图、文件夹、拖放和剪贴板粘贴；队列支持添加、删除、清空撤销。当前右侧压缩设置可应用到整批图片，并显示处理进度、支持停止及 ZIP 下载。

   [#301](https://github.com/GoogleChromeLabs/squoosh/issues/301) · [#1406](https://github.com/GoogleChromeLabs/squoosh/issues/1406) · [#314](https://github.com/GoogleChromeLabs/squoosh/issues/314)

2. **批量文件命名** ✅

   提供 Original、Dimensions、Sequence 预设；支持 `{name}`、`{index}`、`{width}`、`{height}` 变量及自定义前后缀。规则输入限制 64 个字符，扩展名自动跟随输出格式，非法字符会被替换，Windows 保留名称会被修正，重名自动追加序号。ZIP 文件名同样会自动清洗。

   [#1390](https://github.com/GoogleChromeLabs/squoosh/issues/1390)

3. **基础体验** ✅

   默认使用浅色主题，用户可手动切换并保存暗色主题；支持编辑器图片初始自适应、回到顶部和移动端布局。首页已包含批量压缩、格式转换、结果预览、隐私、FAQs 和联系模块。

## 待做

1. **压缩设置预设**

   保存并切换多套格式、质量和尺寸配置。当前仅自动保存上次设置；批量文件名已有内置预设，但不属于压缩设置预设。

   [#430](https://github.com/GoogleChromeLabs/squoosh/issues/430)

2. **目标文件大小**

   输入目标大小或原图百分比，自动寻找合适质量。

   [#1422](https://github.com/GoogleChromeLabs/squoosh/issues/1422)

3. **保留 EXIF**

   选择性保留拍摄时间、版权、方向等元数据。

   [#1247](https://github.com/GoogleChromeLabs/squoosh/issues/1247)

4. **裁剪**

   优先级低于批量导出主线。

   [#314](https://github.com/GoogleChromeLabs/squoosh/issues/314)

5. **复制 PNG 预览**（搁置，不主动推进）

   无法可靠复制实际的 JPEG、WebP 或 AVIF 压缩文件，只能将当前预览重新编码为 PNG。优点是可粘贴到聊天、文档和设计工具；缺点是文件通常更大，且格式、文件大小与界面中的压缩结果不一致，还受浏览器剪贴板权限和兼容性限制。

   **决策：除非用户明确要求，否则不要实现、合并 `origin/codex/copy-png`，也不要将其列为下一步建议。**

   [#1371](https://github.com/GoogleChromeLabs/squoosh/issues/1371) · [维护者说明](https://github.com/GoogleChromeLabs/squoosh/issues/1371#issuecomment-1620069092)
