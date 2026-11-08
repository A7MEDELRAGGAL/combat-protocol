# Combat Protocol — Implementation Status v1.18

**الإصدار:** `1.18.0` · **التاريخ:** 6 نوفمبر 2026

---

## 1. ما تغيّر

| النظام | قبل v1.18 | بعد v1.18 |
|---|---|---|
| خرائط BR | 2 (Meridian/Dune) بحدود 68×48 | 3 (Harbor Town 80×72) + إصلاح حدود Meridian/Dune إلى 72×68 |
| المباني | لا يوجد | نظام بيوت إجرائي في كل الخرائط (2–8 لكل خريطة) |
| المداخل | لا يوجد | أبواب بفتحات حقيقية، نوافذ، أسطح، بارابيت، أثاث داخلي |
| Minimap | حاويات/صناديق فقط | + كتل المباني |
| الأنيميشن | إيقاع مشي ثابت | إيقاع يتغير مع السرعة، ميل جانبي، تنفس، تأرجح ذراعين |
| النشر | خادم Node محلي فقط | `dist/` ثابت 2.35 MB + إعدادات Netlify/Vercel/nginx |
| Loot | مواقع عشوائية قد تدخل الجدران | يتجنب colliders وحدود الخريطة + ثلث الصناديق داخل المباني |

---

## 2. التحقق

```text
npm test        → 85 tests, 85 pass, 0 fail
npm run verify  → All smoke checks passed
                  no console errors
                  Harbor Town: buildings=8, enemies=20, bounds=40/36
                  classic maps: buildings 2–3
npm run build   → dist ready: 2.35 MB
Static server   → title OK, map=harborTown, buildings=8, enemies=20
                  0 console errors, 0 failed requests
```

- لقطة النشر: `evidence/dist-deploy.png`.
- لقطة مبنى: `evidence/building.png`.
- تدقيق كل الخرائط: Port 2، Crossline 3، Stackyard 3، Drydock 3، Night Bazaar 3،
  Meridian 5، Dune 7، Harbor 8.

---

## 3. الملفات المعدّلة

| الملف | التغيير |
|---|---|
| `js/world.js` | `buildBuildings()`، `addBuilding()`، `canPlaceBuilding()`، مواد الجدران/النوافذ، أثاث داخلي |
| `js/br-map-data.js` | حدود Meridian/Dune، خريطة Harbor Town وبيوتها وPOIها |
| `js/enemies.js` | إيقاع مشي/جري، ميل جانبي، تنفس، تأرجح ذراعين |
| `js/loot.js` | مواقع loot تحترم colliders وحدود الخريطة |
| `tools/build-dist.mjs` | بناء `dist/` |
| `netlify.toml`, `vercel.json` | إعدادات نشر |
| `README-DEPLOY.md` | دليل النشر خطوة بخطوة |
| `tests/smoke.mjs` | فحص المباني في كل خريطة + Harbor Town 20 بوتاً |

---

## 4. المخاطر والرجوع

| الخطر | التخفيف |
|---|---|
| مبنى يحجب ممراً أو spawn | `canPlaceBuilding` يتحقق من الحدود والـspawns ونقاط المهام والـcolliders |
| زيادة draw calls بسبب المباني | كل مبنى ~20 صندوقاً؛ المراقبة عبر benchmark، والخطوة التالية دمج مواد المبنى |
| اختلاف الشكل على استضافة ثابتة | `dist` تم اختباره على static server مع 0 طلبات فاشلة |
| فشل WebGL على أجهزة الزوار | `?safe=1` موجود، وشاشة الفشل العربية تعمل |
| بيانات lobbies قديمة تشير لخريطة محذوفة | `normalizeLobby` يرجع للخريطة الافتراضية |

**الرجوع:** استعادة `js/world.js` و`js/br-map-data.js` و`js/enemies.js` و`js/loot.js`
من v1.17، ثم `npm test && npm run verify && npm run build`.

---

## 5. بوابة الإصدار

```powershell
npm test
npm run verify
npm run build
# ارفع محتويات dist/ إلى الاستضافة
curl http://127.0.0.1:4173/health   # 1.18.0
```
