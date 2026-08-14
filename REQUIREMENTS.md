# 需求清单

1. **批量处理** ✅

   上传多图、统一设置、ZIP 下载，需求最高：旧 Issue 115 个赞，新 Issue 20 个赞。你目前已覆盖核心功能。

   [#301](https://github.com/GoogleChromeLabs/squoosh/issues/301) · [#1406](https://github.com/GoogleChromeLabs/squoosh/issues/1406)

2. **复制压缩结果**

   直接把压缩后的图片复制到剪贴板，省去“下载 → 复制 → 删除文件”。适合放在单张下载按钮旁。

   [#1371](https://github.com/GoogleChromeLabs/squoosh/issues/1371)

3. **粘贴图片** ✅

   支持直接粘贴截图、剪贴板图片或 Base64。项目旧版已有剪贴板代码，但新首页未接入。

   [#314](https://github.com/GoogleChromeLabs/squoosh/issues/314) · [#1388](https://github.com/GoogleChromeLabs/squoosh/issues/1388)

4. **命名规则**

   不只是 ZIP 名称，还需要批量前缀、后缀、尺寸变量，例如 `{name}-900w.webp`。

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
