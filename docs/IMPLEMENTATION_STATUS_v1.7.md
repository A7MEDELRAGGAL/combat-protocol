# Combat Protocol — Implementation Status v1.7

**التاريخ:** 25 أكتوبر 2026  
**الإصدار:** `1.7.0`  
**النطاق:** Prototype محلي Three.js/WebGL؛ لا Multiplayer production ولا BR لـ60 لاعباً.

## المنفذ الآن

- Realism pass للأسلحة: receiver layers، rails، fasteners، bolt، trigger guard،
  optics، front sight، muzzle details، deterministic weapon palettes.
- casing ejection محلي مع velocity/gravity/bounce pool.
- bolt kickback أثناء fire.
- breathing sway وhead bob مختلف وlanding kick.
- environment theme مستقل لكل خريطة مع sky/fog/ground/light palettes.
- تفاصيل world إضافية: container door lines، serial plates، hazard strips، ground stains.
- عقد Battle Royale كاملة قابلة للاختبار في `js/battle-royale-plan.js`.
- وثيقة BR الكاملة في `docs/BATTLE_ROYALE_MASTER_PLAN_v1.md`.

## ما زال Prototype فقط

- BR الحالي داخل اللعب ما زال 12 خصماً محلياً مع دائرة.
- لا loot/inventory/downed/revive/buyback منفذ داخل المباراة بعد.
- لا authoritative multiplayer أو 60 لاعباً.
- الأسلحة procedural وليست skeletal/PBR production assets.

## بوابة التحقق

```powershell
node --check js/weapons.js
node --check js/world.js
node --check js/player.js
npm test
npm run verify
```

لا تعتبر v1.7 مكتملة إذا فشل أي أمر بسبب realism pass أو BR contract.

الحالة المؤكدة في 25 أكتوبر 2026:

- `npm test`: **40 اختباراً ناجحاً، 0 فشل**.
- `npm run verify`: **All smoke checks passed**.
- `node --check` للملفات المعدلة: ناجح.
- `git diff --check`: ناجح.
- `http://127.0.0.1:4173/health`: يعلن `Combat Protocol` و`1.7.0`.
