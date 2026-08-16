# 需求清单

1. **批量处理** ✅

   上传多图、统一设置、ZIP 下载，需求最高：旧 Issue 115 个赞，新 Issue 20 个赞。你目前已覆盖核心功能。

   [#301](https://github.com/GoogleChromeLabs/squoosh/issues/301) · [#1406](https://github.com/GoogleChromeLabs/squoosh/issues/1406)

2. **复制 PNG 预览**（方案待确认）

   系统图片剪贴板通常复制位图，无法可靠保留 JPEG、WebP、AVIF 的压缩数据和文件大小。实验分支 `codex/copy-png` 会把当前预览重新编码为 PNG，适合粘贴到聊天、文档和设计工具，但文件可能大于界面中的压缩结果。

   [#1371](https://github.com/GoogleChromeLabs/squoosh/issues/1371) · [维护者说明](https://github.com/GoogleChromeLabs/squoosh/issues/1371#issuecomment-1620069092)

3. **粘贴图片** ✅

   首页支持直接读取剪贴板中的截图和图片。

   [#314](https://github.com/GoogleChromeLabs/squoosh/issues/314) · [#1388](https://github.com/GoogleChromeLabs/squoosh/issues/1388)

4. **批量命名规则** ✅

   支持 `{name}`、`{index}`、`{width}`、`{height}` 变量，可添加前后缀；扩展名自动跟随输出格式，重复名称自动编号。

   [#1390](https://github.com/GoogleChromeLabs/squoosh/issues/1390)

5. **命名预设**

   保存多套格式、质量、尺寸配置。当前只有自动保存上次设置，没有可命名、切换的预设。

   [#430](https://github.com/GoogleChromeLabs/squoosh/issues/430)

6. **目标文件大小**

   输入 `100KB` 或原图 `30%`，自动寻找合适质量，比手动调滑块实用。

   [#1422](https://github.com/GoogleChromeLabs/squoosh/issues/1422)

7. **保留 EXIF**

   摄影用户需要选择性保留拍摄时间、版权、方向等元数据。

   [#1247](https://github.com/GoogleChromeLabs/squoosh/issues/1247)

8. **裁剪与暗色模式**（暗色模式 ✅）

   有需求，但与批量压缩主线相比优先级较低。

   [裁剪 #314](https://github.com/GoogleChromeLabs/squoosh/issues/314) · [暗色模式 #1392](https://github.com/GoogleChromeLabs/squoosh/issues/1392)
