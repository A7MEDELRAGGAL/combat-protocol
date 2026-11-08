# Combat Protocol — Implementation Status v1.17 (Draw Call Pass)

**الإصدار:** `1.17.0` · **التاريخ:** 6 نوفمبر 2026

---

## 1. الملخص

هذه الحزمة لا تغيّر شكل اللعبة، بل تقلّل تكلفة رسم الأعداء استعداداً لـ20 بوتاً.
كل عدو انخفض من **39 mesh إلى 12 mesh** عبر دمج الأجزاء الصلبة داخل كل مقطع
بـvertex colors، مع الحفاظ على المفاصل والـvisor والـhit parts.

| السيناريو | قبل | بعد |
|---|---:|---:|
| 5 أعداء high | 336 draw call | **257** |
| 5 أعداء low | 332 draw call | **252** |
| 20 بوتاً على الشاشة high | 1104 draw call | **569** |
| 20 بوتاً على الشاشة low | 1104 draw call | **564** |
| 20 بوتاً أثناء اللعب high/low | — | **441 / 433** |

---

## 2. التحقق

```text
npm test        → 84 tests, 84 pass, 0 fail
npm run verify  → All smoke checks passed
                  no console errors
                  combat kill awards score — PASS
                  accuracy reflects landed shots — 100%
npm run capture → meshes=12, hasKnee=true, decals=12
npm run benchmark:
  dm-5   high drawCalls=257   low drawCalls=252
  br-20  high drawCalls=569   low drawCalls=564
  br-20-live high drawCalls=441 low drawCalls=433
```

- `br-20` يضع 20 بوتاً في شبكة أمام الكاميرا ثم يرسم إطاراً واحداً — قياس
  worst case وليس gameplay طبيعي.
- FPS مقاس على SwiftShader وليس عتاد المستخدم؛ لا يُستخدم كحكم على الأداء.

---

## 3. الملفات المعدّلة

| الملف | التغيير |
|---|---|
| `js/enemies.js` | `mergeColoredGeometry()` و`mergeRigidParts()`، خام vertex colors، إعادة بناء hitMeshes |
| `tools/visual-benchmark.mjs` | سيناريوهان dm-5 وbr-20 وقياس 20 بوتاً على الشاشة |
| `server.mjs` | `/health` = 1.17.0 |
| `index.html` | FIELD BUILD 1.17.0 / DRAW CALL PASS |
| `package.json` | 1.17.0 |
| `docs/PERFORMANCE_PASS_v1.17.md` | تفاصيل الحزمة والقياسات |

---

## 4. المخاطر والرجوع

| الخطر | التخفيف |
|---|---|
| تغيّر ملمس الأجزاء بعد توحيد roughness | الألوان محفوظة، والاختبار البصري يطابق v1.16 |
| فشل raycast بعد دمج الـgeometry | اختبار القتل والتصويب يمر؛ الـmeshes المدمجة تحتفظ بـposition/normal |
| الوميض يصيب الجسم كله | مقصود؛ الـvisor منفصل ويستعيد لونه الأصلي بعد الوميض |
| تراجع أداء العالم مع الخرائط الكبيرة | 569 لـ20 بوتاً؛ الخطوة التالية batching لعناصر العالم |

**الرجوع السريع:** استعادة `js/enemies.js` من v1.16، ثم `npm test && npm run verify`.
لا تغييرات في التخزين أو الـschema أو الـgameplay.

---

## 5. بوابة الإصدار

```powershell
npm test
npm run verify
npm run benchmark
npm run capture
curl http://127.0.0.1:4173/health   # 1.17.0
```
