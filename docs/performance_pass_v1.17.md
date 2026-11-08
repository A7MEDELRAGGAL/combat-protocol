# Combat Protocol — Performance Pass v1.17 (Draw Calls)

## الهدف

تجهيز اللعبة لـ20 بوتاً على الخريطة دون أن ينهار عدد draw calls، مع الحفاظ
على نفس شكل الأعداء والمفاصل والـhit detection.

## المشكلة

كل عدو كان 39 mesh منفصلاً (torso/vest/pouches/head/helmet/rails/arms/legs/gun).
مع 20 بوتاً يصبح 780 draw call للأعداء وحدهم، بغض النظر عن العالم.
القياس قبل التحسين (كل الأعداء على الشاشة): **1104 draw calls**.

## الحل

كل مقطع صلب في هيكل العدو أصبح **mesh واحداً** بخامات vertex colors:

| المقطع | الأجزاء المدمجة | الناتج |
|---|---|---:|
| Root body | torso, vest, belt, backpack, 3 pouches, neck, antennas | 1 |
| Root head | skull, helmet, stripe, rails, ear cups | 1 |
| Root limb | shoulders + gun parts | 1 |
| Visor | يبقى منفصلاً للحفاظ على الـemissive | 1 |
| كل hip | thigh + holster | 1 × 2 |
| كل knee | knee pad + shin + boot | 1 × 2 |
| كل shoulder | upper arm | 1 × 2 |
| كل elbow | forearm + hand | 1 × 2 |

الإجمالي: **12 mesh للعدو** بدل 39. المفاصل (`hip/knee/shoulder/elbow`) بقيت
كما هي، لذلك الأنيميشن والموت المفصلي يعملان بدون تغيير. الـhit parts أُعيد
بناؤها من الـmeshes المدمجة، والـhealth bar والـmuzzle flash خارج الدمج.

## القياس

| السيناريو | قبل | بعد | التخفيض |
|---|---:|---:|---:|
| 5 أعداء — high | 336 | **257** | 24% |
| 5 أعداء — low | 332 | **252** | 24% |
| 20 بوتاً على الشاشة — high | 1104 | **569** | 48% |
| 20 بوتاً على الشاشة — low | 1104 | **564** | 48% |
| 20 بوتاً أثناء اللعب — high | — | **441** | — |
| 20 بوتاً أثناء اللعب — low | — | **433** | — |

- `npm run benchmark` أصبح يقيس ثلاثة سيناريوهات: `dm-5`، `br-20` (20 بوتاً
  موضوعين في شبكة أمام الكاميرا لقياس worst case)، و`br-20-live` (20 بوتاً
  في حلقة اللعب الطبيعية بعد الهبوط).
- FPS في البيئة الحالية (SwiftShader) غير ممثل لعتاد RTX 4060؛ القرار على
  draw calls وعدد الـmeshes.

## التحقق

- `npm test` → 84/84.
- `npm run verify` → All smoke checks passed + no console errors.
- اختبار القتل والتصويب: `combat kill awards score` و`accuracy reflects landed shots`
  (100%) يمران بعد الدمج.
- `npm run capture` → 12 hit mesh، والشكل البصري مطابق للإصدار السابق.

## المخاطر والرجوع

| الخطر | التخفيف |
|---|---|
| فقدان اختلاف roughness بين الأجزاء | الألوان محفوظة بالvertex colors؛ الفرق البصري طفيف في لقطة gameplay |
| خلل في raycast بعد الدمج | اختبار القتل/التصويب يمر؛ geometry غير م indexed وله normals |
| وميض الإصابة يصيب كل الجسم | مقصود: الوميض أصبح موحداً لكل المقطع، والـvisor يرجع للونه الأصلي |

**الرجوع:** استعادة `js/enemies.js` من v1.16 (إزالة `mergeRigidParts` واستدعاء
الدمج)، مع إبقاء `tools/visual-benchmark.mjs` الجديد.

## الخطوة التالية

1. Batching/Instancing لعناصر العالم (containers/crates/barriers).
2. LOD للمسافات البعيدة: نسخة silhouette أبسط لما يزيد عن 45m.
3. TDM محلي كامل (فريق لاعب + bots) قبل أي netcode.
