# Combat Protocol — بروتوكول القتال

نسخة لعب FPS أصلية تعمل في المتصفح، مستوحاة من الإيقاع السريع لألعاب القتال التكتيكية مثل Combat Master. اللعبة مبنية من الصفر: لا تحتوي على نماذج أو خامات أو أصوات أو خرائط أو شعارات أو كود من اللعبة الأصلية.

> **إخلاء مسؤولية:** هذا مشروع أصلي وغير تابع لشركة Alfa Bravo Inc. ولا مدعوم منها. أسماء الأسلحة والشخصيات والخرائط هنا خيالية.

---

## التشغيل السريع

### الطريقة الأسهل (Windows)

انقر نقرًا مزدوجًا على:

```text
start.bat
```

سيفتح المتصفح على `http://127.0.0.1:4173` بعد تشغيل الخادم المحلي.

### الطريقة اليدوية

يتطلب **Node.js 22 أو أحدث** (لا توجد حزم مطلوبة للعب، مكتبة Three.js مضمّنة محليًا):

```powershell
cd C:\Users\ahmed\.openclaw-autoclaw\workspace\combat-protocol
node server.mjs
```

ثم افتح: <http://127.0.0.1:4173>

> لا تفتح `index.html` بالنقر المزدوج؛ المتصفح يمنع وحدات ES من العمل عبر `file://`. استخدم `start.bat` أو خادم Node.

---

## التحكم

| الإدخال | الوظيفة |
|---|---|
| `W A S D` | الحركة |
| `Shift` | جري |
| `Space` | قفز |
| `Ctrl` أو `C` | انخفاض |
| حركة الماوس | النظر |
| زر الماوس الأيسر | إطلاق النار |
| زر الماوس الأيمن | تسديد / ADS |
| `R` | إعادة التلقيم |
| `E` | تفاعل مع أهداف Frontline Ops |
| `1` — `9` | تبديل السلاح |
| عجلة الماوس أو `F` | تبديل السلاح التالي |
| `Esc` أو `P` | إيقاف مؤقت / استئناف |

**على الهاتف:** عصا يسرى للحركة، اسحب النصف الأيمن للنظر، زر «نار» للإطلاق، وأزرار `R` و`↑` و`⇄`.

---

## ما تم تنفيذه

- **خمس خرائط أصلية** مبنية إجرائيًا: Port Meridian، Crossline Yard، Stackyard 12، Drydock 9، وNight Bazaar، ولكل واحدة توزيع cover ومسارات مختلف.
- **Realism pass v1.7**: نماذج أسلحة بطبقات receiver/rails/bolt، casing ejection، bolt kickback، breathing sway، landing kick، وإضاءة/ضباب/خامات مختلفة لكل خريطة.
- **حركة FPS**: تسارع، جري، قفز، انخفاض، تصادم AABB مع الحاويات والجدران، وارتداد كاميرا.
- **تسعة أسلحة أصلية**: AR-4، SMG-9، DMR-7، P-12، SR-9، LMG-6، SG-12 shotgun بثماني pellets، BR-7 battle rifle، وVPR-5 machine pistol.
- **نظام تصويب hitscan**: ارتداد، انتشار ديناميكي، تراجع ضرر مع المسافة، مضاعف رأس، ذخيرة، تلقيم، تبديل سلاح.
- **خمسة أعداء** بحالة patrol/chase/attack، خط رؤية، إطلاق نار، صحة، موت، وإعادة ظهور.
- **HUD عربي**: صحة/درع، ذخيرة، وقت، نقاط، خريطة مصغرة، killfeed، crosshair ديناميكي، hitmarker، وتأثير ضرر.
- **قوائم كاملة**: بداية، طريقة اللعب، إعدادات (حساسية/FOV/جودة/صوت/عكس Y)، إيقاف، ونتائج نهائية.
- **إعدادات محفوظة** في `localStorage` تحت المفتاح `combat-protocol-settings-v1`.
- **صوت مولّد** بـ WebAudio: طلقات، تلقيم، إصابات، خطوات، وضجيج محيط.
- **تحكم لمس** كامل مع عصا افتراضية ومنطقة نظر وأزرار إطلاق.
- **حماية من فشل WebGL**: تظهر رسالة عربية واضحة بدل شاشة سوداء.
- **خمسة أطوار محلية**: Deathmatch، Team Deathmatch، Survival، Battle Royale تجريبي، وFrontline Ops السردي.
- **طور Frontline Ops محلي**: مهمة First Light بحالات ingress، استعادة المفتاح، Relay hold، واستخراج نهائي.
- **أهداف ملموسة داخل العالم**: Kiosk وRelay 07 وCrane Lane مع marker ثلاثي الأبعاد، objective HUD، progress، وتفاعل `E`/اللمس.
- **ترسانة قابلة للتطوير**: شاشة Armory، 11 مرفقاً تؤثر فعلياً على الضرر/المدى/الارتداد/الذخيرة/التلقيم، و4 Operators بملفات مختلفة، مع نماذج first-person جديدة للأسلحة المضافة.
- **تقدم محلي**: XP، مستويات، Credits، إحصاءات وانتصارات محفوظة في `localStorage`.
- **Visual Realism Pass v1.15**: واجهة field-build احترافية، خامات roughness إجرائية، تفاصيل معدن/خشب، إضاءة key/fill/rim، وغبار deterministic مع الحفاظ على low/safe mode.
- **Squad Silhouettes v1.16**: مفاصل hip/knee وshoulder/elbow للأعداء، 4 squad palettes، جرابات ووسادات ركب وراديو، موت مفصلي، و12 بقعة زيت/ماء/تراب على الأرض (6 في low).
- **Draw Call Pass v1.17**: دمج الأجزاء الصلبة لكل عدو من 39 mesh إلى 12 mesh، وخفض 20 بوتاً من 1104 إلى 569 draw call مع الحفاظ على المفاصل والـvisor.
- **Harbor Town v1.18**: خريطة BR ثالثة بثمانية بيوت، مبانٍ إجرائية بجدران وأبواب ونوافذ وأسطح في كل الخرائط، أنيميشن مشي محسّن، ونسخة `dist/` جاهزة للرفع على أي استضافة ثابتة.

---

## بنية المشروع

| الملف | الدور |
|---|---|
| `index.html` | الواجهة، شاشات القوائم، HUD، وأزرار اللمس |
| `css/style.css` | النظام البصري الكامل (تكتيكي داكن + RTL) |
| `js/main.js` | حلقة اللعبة، الحالة، القوائم، الإعدادات، pointer lock، الأطوار، وFirst Light |
| `js/world.js` | بناء الساحة، الخامات الإجرائية، الإضاءة، التصادم، خط الرؤية |
| `js/player.js` | حركة اللاعب، الكاميرا، الصحة/الدرع، الارتداد، الأقدام |
| `js/weapons.js` | نظام الأسلحة، raycast، الذخيرة، التلقيم، الترتيسر، الشرر |
| `js/weapon-data.js` | أرقام الأسلحة الأصلية (ضرر، RPM، مخزن، مدى) |
| `js/enemies.js` | الأعداء، الذكاء الاصطناعي، إطلاق النار، الصحة، إعادة الظهور |
| `js/hud.js` | تحديث HUD، الخريطة المصغرة، killfeed، hitmarker |
| `js/input.js` | لوحة المفاتيح، الماوس، pointer lock، واجهة اللمس |
| `js/audio.js` | مؤثرات WebAudio المولّدة |
| `js/utils.js` | رياضيات، تصادم AABB، تحليل الزوايا، تنسيق الوقت |
| `js/mission-rules.js` | state machine لمهمة First Light واختبارات الانتقال والفشل |
| `server.mjs` | خادم ثابت محلي (بدون تبعيات) |
| `start.bat` | تشغيل الخادم وفتح المتصفح |
| `tests/` | 85 اختبار وحدة + فحص متصفح شامل |
| `evidence/` | لقطات الشاشة ونتيجة الفحص |

---

## كيف تعمل حلقة اللعب

```text
إدخال (لوحة/ماوس/لمس)
  ↓
Player.update: اتجاه الحركة → تسارع → جاذبية → moveWithCollisions
  ↓
WeaponSystem.tryFire: Raycaster من الكاميرا → أقرب اصطدام (جسم عدو أو عالم)
  ↓
EnemyManager.damage: خصم الصحة → موت/نقاط/killfeed → إعادة ظهور
  ↓
HUD.update: صحة، ذخيرة، مؤقت، خريطة مصغرة، crosshair
  ↓
WebGLRenderer.render
```

التصادم يستخدم **substeps** بحد أقصى 0.2 متر لكل خطوة، لمنع اختراق الجدران عند انخفاض معدل الإطارات. خط رؤية الأعداء يستخدم اختبار Segment-AABB بدل Raycaster ثقيل.

---

## التخصيص

| ما تريد تغييره | الملف / المكان |
|---|---|
| ضرر الأسلحة، RPM، المخزن، المدى | `js/weapon-data.js` |
| معدل انتشار التصويب والارتداد | `js/weapon-data.js` |
| تخطيط الخريطة والحاويات | `js/world.js` → `buildArena()` |
| ألوان الواجهة والخطوط | `css/style.css` → `:root` |
| سلوك الأعداء وسرعتهم ودقتهم | `js/enemies.js` → `Enemy.update()` و`shoot()` |
| عدد الأعداء | `js/main.js` → `spawnInitial(5)` |
| مدة المباراة | `js/main.js` → `MATCH_SECONDS` |
| الحساسية وFOV والجودة | شاشة الإعدادات أو `localStorage` |
| النصوص العربية | `index.html` |

---

## الاختبارات والتحقق

```powershell
# 85 اختبار وحدة (التصادم، الأسلحة، الأطوار، المنطقة، التسوية، التليمتري، القنابل، الخرائط، وFirst Light)
npm test

# فحص متصفح كامل + لقطات شاشة
npm run verify
```

`npm run verify` يشغّل Chrome headless، يفتح اللعبة، يبدأ العرض، يتحقق من:

- تحميل الصفحة وWebGL مع draw calls فعلية
- وجود 5 أعداء وHUD
- إطلاق النار واستهلاك الذخيرة
- الحركة بـ WASD
- قتل عدو ومنح النقاط وتحديث killfeed
- إعادة التلقيم وتبديل السلاح
- الإيقاف والاستئناف
- حفظ الإعدادات بعد إعادة تحميل الصفحة
- مسار فشل WebGL
- تحكم اللمس على 390×844
- خلو الـConsole من الأخطاء
- اختيار Frontline Ops من الواجهة وتشغيل objective chain كاملة حتى النجاح

اللقطات في:

- `evidence/menu.png`
- `evidence/gameplay.png`
- `evidence/combat.png`
- `evidence/pause.png`
- `evidence/mobile-menu.png`
- `evidence/mobile-game.png`
- `evidence/error-state.png`

---

## الأداء والمتصفحات

- تم التحقق على Chrome (headless + SwiftShader) بدقة 1440×900 و390×844.
- يعمل على المتصفحات الحديثة التي تدعم WebGL2 وES Modules.
- على الأجهزة الضعيفة: اختر **جودة منخفضة** من الإعدادات (يقلل pixel ratio ويوقف الظلال).
- اللعبة لا تجري أي طلبات شبكة خارجية بعد تحميل الملفات.

---

## القيود المعروفة

- **ليست نسخة حرفية من Combat Master**: لا يمكن نسخ أصول اللعبة أو خرائطها أو أصواتها أو شبكتها. هذه نسخة أصلية مستوحاة من النوع.
- **لاعب واحد فقط**: لا يوجد multiplayer أو نتائج سيرفر.
- **ذكاء اصطناعي بسيط**: حركة/رؤية/إطلاق نار، بدون تكتيكات جماعية أو تمويه متقدم.
- **بدون أنيميشن شخصيات هيكلي**: الأعداء مكوّنون من أجزاء هندسية وأرجل تتأرجح.
- **الصوت مولّد صناعيًا** وليس تسجيلات استوديو.
- **التقدم محلي Prototype-only**: XP وCredits وإحصاءات المباريات تُحفظ محلياً مع تسوية idempotent؛ لا يوجد بعد server ledger أو مزامنة.

---

## التطوير التالي المقترح

1. إضافة Rook ability حقيقية مع cooldown وcounterplay وTelemetry.
2. إضافة subtitle/faction radio slice لمهمة First Light.
3. ربط hold relay بموجة ضغط أكثر وضوحاً وspawn pacing قابل للضبط.
4. إضافة loot/inventory محدود إلى Battle Royale.
5. تحسين نمط TDM إلى فرق ولوحة نتائج واضحة قبل Multiplayer الحقيقي.
6. multiplayer عبر WebSocket + server authoritative.
7. تحسين توازن الأسلحة بناءً على telemetry واختبارات أداء frame time.

الخطة التنفيذية الكاملة، مع ما تم تطبيقه وما يحتاج Multiplayer/خوادم، موجودة في [`ROADMAP.md`](./ROADMAP.md).

## مستند التصميم الاحترافي

مستند اللعبة الكامل — الرؤية، الحلقة، Art Bible، ستة Heroes، أشجار المهارات، أسلحة ومرفقات، Battle Royale، TDM، تصميم الخرائط، UE5، الشبكة، الأداء، الجداول، المخططات، وخطة الإنتاج — موجود في:

[`docs/COMBAT_PROTOCOL_GDD.md`](./docs/COMBAT_PROTOCOL_GDD.md)

نماذج Unreal المرجعية موجودة في:

[`docs/prototypes/`](./docs/prototypes/)

## مستندات الإنتاج الجديدة

- [`docs/GDD_SUPPLEMENT_v1.1.md`](./docs/GDD_SUPPLEMENT_v1.1.md) — الصوت، UX، الاقتصاد، الوصول، التعريب، والامتثال.
- [`docs/PLAYTEST_PLAN_v1.md`](./docs/PLAYTEST_PLAN_v1.md) — خطة اختبار prototype ومقاييس TTK/Operators/FPS.
- [`docs/UE5_MIGRATION_GUIDE.md`](./docs/UE5_MIGRATION_GUIDE.md) — خطة نقل الأنظمة إلى UE5 على 12 أسبوعاً أولياً.
- [`docs/SERVER_ARCHITECTURE.md`](./docs/SERVER_ARCHITECTURE.md) — Dedicated Servers، matchmaking، netcode، security والتكلفة التخطيطية.
- [`docs/prototypes/REVIEW_AND_IMPROVEMENTS.md`](./docs/prototypes/REVIEW_AND_IMPROVEMENTS.md) — مراجعة وتحسين نماذج C++.
- [`docs/GAME_SCENARIO_BIBLE_v1.md`](./docs/GAME_SCENARIO_BIBLE_v1.md) — السيناريو القانوني، العالم، الفصائل، الحملة، الـ Operators، والأولويات الإنتاجية.
- [`docs/FIRST_LIGHT_MISSION_SPEC_v1.md`](./docs/FIRST_LIGHT_MISSION_SPEC_v1.md) — مواصفة أول مهمة قابلة للتنفيذ وحالات الـ objective والاختبارات.
- [`docs/IMPLEMENTATION_STATUS_v1.5.md`](./docs/IMPLEMENTATION_STATUS_v1.5.md) — الحالة التنفيذية الموحدة، الأدلة، والخطة التالية.
- [`docs/IMPLEMENTATION_STATUS_v1.6.md`](./docs/IMPLEMENTATION_STATUS_v1.6.md) — الحالة التنفيذية بعد حزمة الخرائط والأسلحة الجديدة.
- [`docs/IMPLEMENTATION_STATUS_v1.7.md`](./docs/IMPLEMENTATION_STATUS_v1.7.md) — الحالة التنفيذية بعد realism pass وعقد Battle Royale.
- [`docs/CONTENT_EXPANSION_v1.6.md`](./docs/CONTENT_EXPANSION_v1.6.md) — مواصفات المحتوى الجديد وقواعد التوازن.
- [`docs/BATTLE_ROYALE_MASTER_PLAN_v1.md`](./docs/BATTLE_ROYALE_MASTER_PLAN_v1.md) — خطة Battle Royale الكاملة من BR-0 المحلي حتى 60 لاعباً.
- [`docs/REALISM_PASS_v1.7.md`](./docs/REALISM_PASS_v1.7.md) — ما تم تحسينه لرفع واقعية السلاح والعالم والحركة.
- [`docs/VISUAL_REALISM_PLAN_v1.15.md`](./docs/VISUAL_REALISM_PLAN_v1.15.md) — خطة تمريرة الجرافيك الواقعي، معايير القبول، وما يلزم للوصول إلى جودة AAA.
- [`docs/VISUAL_REALISM_PLAN_v1.16.md`](./docs/VISUAL_REALISM_PLAN_v1.16.md) — مفاصل الأعداء، squad palettes، البقع البيئية، وقياسات الأداء.
- [`docs/implementation_status_v1.16.md`](./docs/implementation_status_v1.16.md) — حالة التنفيذ والتحقق وخطة الرجوع لهذه الحزمة.
- [`docs/PERFORMANCE_PASS_v1.17.md`](./docs/PERFORMANCE_PASS_v1.17.md) — دمج الأجزاء وقياسات 5/20 بوتاً قبل وبعد.
- [`docs/implementation_status_v1.17.md`](./docs/implementation_status_v1.17.md) — حالة v1.17 والتحقق وخطة الرجوع.
- [`docs/WORLD_AND_DEPLOY_v1.18.md`](./docs/WORLD_AND_DEPLOY_v1.18.md) — Harbor Town، نظام المباني، تحسين الأنيميشن، وحزمة النشر.
- [`docs/implementation_status_v1.18.md`](./docs/implementation_status_v1.18.md) — حالة v1.18 والتحقق وخطة الرجوع.
- [`docs/PORT_POLICY.md`](./docs/PORT_POLICY.md) — حجز البورت 4173 للمشروع والتحقق من مالكه.

---

## الحقوق

- الكود والهندسة والخامات والأصوات: أصلية في هذا المشروع.
- Three.js: MIT License، مضمّنة في `vendor/`.
- لا تُستخدم أي علامة تجارية أو أصل من Combat Master.
