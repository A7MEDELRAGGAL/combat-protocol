# Combat Protocol — Implementation Status v1.16 (Squad Silhouettes + Ground Decals)

**الإصدار:** `1.16.0` · **التاريخ:** 6 نوفمبر 2026

---

## 1. ما تغيّر

| النظام | قبل v1.16 | بعد v1.16 |
|---|---|---|
| أرجل العدو | أسطوانة واحدة تدور من منتصفها | hip + knee، انثناء ركبة في الخطوة |
| أذرع العدو | أسطوانة واحدة | shoulder + elbow، ذراع سلاح مثبتة |
| تفاصيل النموذج | خوذة/درع/حقيبة | + 3 جرابات، وسادات ركب، حامل فخذ، راديو، هوائي، شرائط خوذة |
| تمييز الأعداء | لون واحد | 4 squad palettes (زي/سترة/خوذة/visor/كتف) |
| موت العدو | سقوط جسم صلب | انثناء ركب وهبوط ذراع أثناء السقوط |
| شريط الصحة | 1.05×0.13 فاتح | 0.82×0.09 بخلفية داكنة ومسار وحدود |
| الأرض | خامة ground فقط | + 12 بقعة زيت/ماء/تراب (6 في low) |

---

## 2. التحقق

```text
npm test        → 84 tests, 84 pass, 0 fail
npm run verify  → All smoke checks passed
                  no console errors
                  WebGL rendered frames — 275 draw calls (menu/boot scene)
npm run benchmark → high fps=2.2 drawCalls=336 pixelRatio=1
                    low  fps=2.9 drawCalls=332 pixelRatio=1
npm run capture → evidence/enemy-closeup.png
                  evidence/ground-decals.png
```

- العدو الواحد: 39 hit meshes بعد إضافة المفاصل والتفاصيل.
- البقع: 12 high / 6 low، seed ثابت، geometry واحد و3 materials مشتركة.
- `?safe=1` وquality low يعملان؛ لم تُضف أي طلبات شبكة أو أصول خارجية.

> FPS في benchmark مقاس على SwiftShader (رسم بالمعالج) وليس على RTX 4060؛
> القيمة المفيدة هنا هي draw calls. مع 20 بوتاً يجب تنفيذ LOD/Instancing.

---

## 3. الملفات المعدّلة

| الملف | التغيير |
|---|---|
| `js/enemies.js` | سلاسل hip/knee وshoulder/elbow، squad palettes، تفاصيل gear، موت مفصلي، health bar أرفع |
| `js/world.js` | `stainTexture()` و`buildEnvironmentDecals()` و`isBlockedGround()` |
| `server.mjs` | `/health` يعلن 1.16.0 |
| `index.html` | FIELD BUILD 1.16.0 / SQUAD SILHOUETTES |
| `package.json` | 1.16.0 + سكربت `capture` |
| `tools/visual-capture.mjs` | أداة لقطات قريبة للعدو والأرض |
| `docs/VISUAL_REALISM_PLAN_v1.16.md` | خطة وقياسات هذه الحزمة |

---

## 4. المخاطر وخطة الرجوع

| الخطر | التخفيف |
|---|---|
| زيادة draw calls مع 20 بوتاً | القياس الحالي 336 لـ5 أعداء؛ الخطوة التالية LOD/Instancing |
| بقع تحت الحاويات أو في ممرات ضيقة | `isBlockedGround()` مع padding 1.6m وseed ثابت |
| كسر `?safe=1` | البقع تعمل بـMeshBasicMaterial؛ low يستخدم 6 فقط، والاختبار يمر |
| رجوع بصري غير مقصود | النسخة الاحتياطية `combat-protocol-backup-20261021` + git بعد التثبيت |

**الرجوع السريع:** استعادة `js/enemies.js` و`js/world.js` من النسخة السابقة،
ثم `npm test && npm run verify`. لا تغييرات في التخزين أو الـschema.

---

## 5. بوابة الإصدار

```powershell
npm test
npm run verify
npm run benchmark
npm run capture
curl http://127.0.0.1:4173/health   # 1.16.0
```
