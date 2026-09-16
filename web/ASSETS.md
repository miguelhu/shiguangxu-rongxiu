# 演示素材来源清单

生成日期：2026-09-10。方式：内置 imagegen 工具；未使用CLI或第三方图库。所有人物均为虚构。图像已复制进本原型 public/images，运行不依赖生成缓存路径。

| 文件 | 用途 | 说明 |
| --- | --- | --- |
| `public/images/teacher.png` | 陈明远老师邀请／仪式／人物卡 | 教室中的虚构退休教师 |
| `public/images/leader.png` | 周启山案例 | 工作室中的虚构工程团队负责人 |
| `public/images/nurse.png` | 沈知秋案例 | 休息室中的虚构护士长，便装、无患者 |
| `public/images/campus.png` | 后续照片、教师节近况、相框背景 | 无人的校园树荫，风景示意 |

图像在页面内通过CSS裁切，不修改原图。人物场景照片不称为真实毕业照或现场合影；实际照片可通过素材选择器在本机替换。单文件构建会嵌入照片以及下面列出的贴纸、校徽与音频。

## 生成提示词

### teacher

```text
Use case: photorealistic-natural. Asset type: hero photograph for a warm Chinese retirement gift demo. Create a beautiful natural editorial photograph, landscape 3:2, a fictional Chinese male teacher around 60 with salt-and-pepper short hair and thin round glasses, wearing a soft beige linen shirt, warmly smiling while sitting at a wooden desk in a sunlit old Chinese school classroom. Large windows with leafy trees outside, green chalkboard softly out of focus, exercise books and a small vase, late-afternoon summer light, quiet cinematic 35mm film, cream sage olive palette, authentic skin texture, understated, dignified, candid. Subject toward right half, upper body clearly visible, left side has softly lit classroom for future UI text overlay. No written words, no logos, no watermarks. Original fictional person, not an existing public figure. Deliver one photograph, not a collage or a UI mockup.
```

### leader

```text
Use case: photorealistic-natural. Asset type: hero photograph for Chinese retirement gift demo. One landscape 3:2 natural editorial photograph of a fictional retired Chinese male engineering mentor around 62, silver short hair, no glasses, wearing a slate-blue cotton shirt, gently smiling in a sunlit workshop office with wooden desks, architectural papers and a window opening to lush greenery. Dignified, calm, candid, natural texture, cinematic 35mm film, muted sage green and warm cream highlights. Upper body toward right half, atmospheric office on left for UI text overlay. No words, no logos, no watermark. One photo, not collage. Fictional person.
```

### nurse

```text
Use case: photorealistic-natural. Asset type: hero photograph for a Chinese retired head nurse commemorative gift demo. One landscape 3:2 elegant natural editorial photo of a fictional Chinese woman around 58 with a short softly curled dark and silver bob, warm kind smile, wearing a pale sage linen cardigan and white blouse, sitting by a large window in a hospital staff lounge, softly blurred pale walls and green plants. Off-duty, no white coat or badges, no patients. Graceful dignified natural skin, cinematic 35mm film grain, late afternoon golden light, warm cream and sage muted palette. Person toward right half, calm negative space on left for UI overlay. No text, no logos, no watermark. One photo, no collage. Fictional person.
```

### campus

```text
Use case: photorealistic-natural. Asset type: landscape photograph attached to a Teachers Day greeting. One beautiful 3:2 landscape photograph of a quiet Chinese school campus path under large plane trees, dappled morning light, a red brick school building softly visible, an empty wooden bench and scattered early autumn leaves, no people, no text, no signage, no logos. Editorial 35mm analog film, subtle fine grain, muted natural sage greens, warm cream sunlight, peaceful and nostalgic but contemporary, realistic texture. No collage, no UI.
```


## 2026-09-11 增补

六张祝福贴纸直接复用仓库 `prototype/showcase/public/stickers/` 的原有素材：

| 本版文件 | 原素材 |
| --- | --- |
| sticker-thanks.png | 01_子女版/02_想念感谢祝福类/02_谢谢.png |
| sticker-respect.png | 01_子女版/02_想念感谢祝福类/05_致敬.png |
| sticker-happy.png | 01_子女版/02_想念感谢祝福类/03_开心每一天.png |
| sticker-peace.png | 03_银发广场版/03_祝愿类/05_岁岁平安.png |
| sticker-health.png | 03_银发广场版/03_祝愿类/02_福寿安康.png |
| sticker-miss.png | 00_风格确认版/04_想你.png |

`tsinghua-logo.jpg` 来自[清华大学官方视觉形象网站·校徽](https://vi.tsinghua.edu.cn/gk/xxbz/xh/bzjbzsy.htm)，[原图](https://vi.tsinghua.edu.cn/__local/8/1C/21/2F02A66E31BF084FE340463BB47_B9A95F73_185BC.jpg)。根据用户指定用于虚构荣休礼主办案例，界面注明情景示例；不表示学校真实主办或认可。使用原图，通过CSS容器展示中心校徽。

`voice-demo.wav` 使用本机 macOS Tingting 合成声音生成，7秒左右，非真人录音。文字为：“谢谢您把耐心留给我们。愿您往后的日子从容、有趣，有空回来看看我们。” 页面明确标注演示配音，不调用麦克风。

## V4素材扩充 · 2026-09-13

新增65张各自独立生成的案例场景照片：老师17张、老领导12张、护士长12张、生日12张、婚龄12张，均放在 `public/images/cases/<caseId>/`。老师第18张复用原校园风景。另独立生成生日人物封面和婚龄双人封面，共67个新的JPEG文件，内容哈希均不同。

全部由内置 imagegen 分别生成，人物参考已有人像保持外观一致，场景来自V4案例脚本。采用自然摄影、暖色光线、完整人物和物体，不烘焙界面文字。没有把参考图改名充当新照片。原生成PNG保留在本机生成目录；网站使用 sips 转换的JPEG（质量82）以减小体积。

- 场景、日期、输出路径：`scripts/photo-jobs.json`。
- 原始生成文件与场景／提示词记录：`scripts/generated-photo-manifest.json`。
- 每张照片的作者ID、日期精度、图注、来源：`src/v4/content.json`。
- 新封面：`images/cases/birthday/birthday-cover.jpg`、`images/cases/anniversary/anniversary-cover.jpg`。

配音扩充：macOS Tingting 合成11段案例声音（对应内容中的故事／祝福ID）及5段礼后问候，共16个M4A，位于 `public/audio/cases/`。声轨文字分别来自案例 `voices` 和 `data.ts` 的 `nextWish`。页面明确显示“演示配音”，声音可实际播放，非真人共创录音。原贴纸与校徽继续沿用上述来源。

所有媒体随 `dist/` 自带，网页运行不依赖生成缓存或远端图库。离线HTML也嵌入相同素材。
