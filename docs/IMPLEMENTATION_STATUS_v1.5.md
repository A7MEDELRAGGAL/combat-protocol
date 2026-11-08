# Combat Protocol — Implementation Status v1.5 (Historical)

> هذه الصفحة تسجل حالة v1.5 فقط. الحالة الحالية بعد إضافة الخرائط والأسلحة
> الجديدة موجودة في [`IMPLEMENTATION_STATUS_v1.6.md`](./IMPLEMENTATION_STATUS_v1.6.md).

**تاريخ الحالة:** 25 أكتوبر 2026  
**المشروع:** `C:\Users\ahmed\.openclaw-autoclaw\workspace\combat-protocol`  
**النطاق:** Prototype محلي Three.js/WebGL؛ لا Multiplayer production ولا UE5 compiled build.

هذا المستند هو الخريطة العملية الموحدة: ما تم تنفيذه فعلاً، ما تم اختباره، وما سيأتي بعده. لا يعتبر أي بند «منفذاً» إلا إذا كان مربوطاً بالكود أو اختبار حقيقي.

---

## 1. ما تم تنفيذه فعلياً

### الحلقة الأساسية

- شاشة Boot/Menu/How to Play/Mode Select/Armory/Settings/Pause/Debrief.
- تشغيل محلي عبر `server.mjs` و`start.bat`.
- WebGL fallback، Safe Mode، ورسالة فشل واضحة عند تعذر WebGL.
- حفظ إعدادات الحساسية، FOV، الجودة، الصوت، وInvert Y.
- حفظ profile محلياً: XP، Level، Credits، kills، matches، wins، وloadout.

### الحركة والقتال

- حركة FPS: WASD، Sprint، Jump، Crouch، mouse look، touch movement/look.
- تصادم AABB مع substeps، أرضية، جدران، cover، stairs، وline of sight.
- Hitscan shooting، ADS، spread/bloom، recoil، damage falloff، headshots، reload، weapon switching.
- ستة أسلحة أصلية: AR-4، SMG-9، DMR-7، P-12، SR-9، LMG-6.
- procedural first-person weapon models، optics، attachment visuals، muzzle/tracer/spark feedback.
- Frag grenades: throw، fuse، collision، blast radius، line of sight، self-damage، telemetry.
- Auto-heal بعد regen delay مع اختلاف السرعة حسب Operator.

### الأطوار

| الطور | ما يعمل الآن | الحد الحالي |
|---|---|---|
| Deathmatch | score/kill loop محلي | ليس online deathmatch |
| Team Deathmatch | team score، enemy/player respawn، draw/win/loss | خصوم محليون، لا 5v5 حقيقي |
| Survival | waves متصاعدة وwave breaks | PvE محلي فقط |
| Battle Royale | 12 خصماً، zone deterministic، no respawn | sandbox محلي، ليس 60-player |
| Frontline Ops | First Light state machine وobjective markers وmission success/failure | core mission slice؛ VO/ability/briefing pending |

### العالم والمحتوى

- ثلاث خرائط قابلة للاختيار: `port`، `crossline`، `stackyard`.
- Minimap يتبع حدود الخريطة، spawn points، containers، crates، barriers، barrels، lights.
- First Light points في Port Meridian:
  - `kiosk` — استعادة maintenance key.
  - `relay` — بدء وتثبيت Relay 07.
  - `extraction` — Crane Lane.
- Objective marker ثلاثي الأبعاد يظهر فقط للنقطة النشطة.

### First Light state machine

```text
ingress
  → recover_key       عند الوصول إلى kiosk ثم الضغط على E
  → secure_relay      بعد اكتمال استخراج المفتاح
  → hold_relay        عند الوصول إلى relay والضغط على E
  → extract           بعد امتلاء progress داخل نطاق relay
  → success            عند الوصول إلى extraction

أي حالة لعب → failure عند موت اللاعب أو timeout
```

عند بدء `hold_relay` تُفعّل موجة ضغط محلية من 7 أعداء بدون respawn لا نهائي.

### Telemetry

- match lifecycle: `match_started`, `match_ended`.
- combat: `shot_fired`, `shot_hit`, `kill_confirmed`, `damage_taken`, `player_died`, `player_respawned`.
- objectives: `objective_started`, `objective_completed`.
- mission: `mission_started`, `mission_ended`، مع `matchId` وpayload محدود.
- telemetry يمكن تعطيله عبر `?telemetry=0`.

---

## 2. الأدلة والاختبارات الحالية

### Unit tests

الأمر:

```powershell
npm test
```

الحالة المؤكدة في v1.5.0: **36 اختباراً ناجحاً، 0 فشل**.

وتغطي:

- الرياضيات والتصادم.
- اتساق الأسلحة وTTK.
- attachments slot constraints.
- operators/profile/settlement idempotency.
- zone determinism.
- mode rules لـ TDM/Survival/BR.
- grenade damage/configuration.
- map definitions.
- First Light transitions/failure boundaries.
- telemetry bounds and monotonic timestamps.

### Browser smoke

الأمر:

```powershell
npm run verify
```

يغطي تحميل WebGL، القوائم، mode cards، map cards، Armory، demo match، إطلاق النار، القتل، reload، تبديل الأسلحة، القنابل، auto-heal، scopes، attachments، pause/settings، WebGL failure، safe mode، TDM respawn، alternate map، First Light flow، وmobile layout.

الحالة المؤكدة في v1.5.0: **All smoke checks passed**.

---

## 3. خطة التطوير بعد v1.5.0

### Slice 1 — First Light production polish

1. Briefing screen حقيقية قبل بدء المهمة.
2. Subtitles data-driven بالعربية والإنجليزية.
3. FRONTLINE/Assembly radio cues مع WebAudio fallback.
4. Debrief خاص بالمهمة يعرض objectives المكتملة وسبب الفشل.
5. Rook Breach Charge: input، cooldown، telemetry، counterplay.
6. Relay pressure pacing: lanes، budget، spawn timing، clear feedback.

### Slice 2 — Player depth

1. Operator IDs canonical: `rook`، `bulwark`، `sable`، `wisp`، `ember`، `atlas`.
2. Migration aliases للـ prototype IDs القديمة.
3. Ability UI/cooldown وتوازن قدرات غير قاتلة مباشرة.
4. Inventory محدود وتجهيز سلاحين أساسيين + pistol.
5. Accessibility: key rebinding، colorblind palette، subtitle size، reduced motion.

### Slice 3 — BR content

1. Loot tables بندرة Common/Rare/Legendary.
2. Weapon/ammo/armor/heal pickups.
3. Backpack capacity وdrop/pickup flow.
4. authored POIs وrotation paths.
5. 20 bot BR-0 قبل التفكير في players حقيقيين.

### Slice 4 — TDM foundation

1. فرق player/opponent فعلية.
2. scoreboard وteam HUD.
3. spawn protection وspawn selection.
4. score events وround end contracts.
5. اختبار 2–4 لاعبين عبر WebSocket قبل 5v5.

### Slice 5 — Multiplayer production path

```text
Three.js client
  → WebSocket gateway
  → authoritative Node simulation 20Hz
  → snapshots 10Hz
  → prediction/reconciliation
  → lag compensation
  → validation/rate limits/anti-cheat telemetry
```

لا نعلن هذه المرحلة منفذة قبل وجود server authority واختبار لاعبين فعليين.

### Slice 6 — UE5 migration

- إنشاء `.uproject` وBuild targets عند توفر Unreal Engine.
- نقل movement/combat/attributes إلى C++/Gameplay Ability System.
- نقل First Light إلى Gameplay State/Objective actors.
- Dedicated server target، replication، replay، وautomated PIE tests.

---

## 4. الحدود التي لا يجوز تجاوزها في التقارير

- لا نقول إن اللعبة Multiplayer production.
- لا نقول إن Battle Royale فيها 60 لاعباً.
- لا نقول إن UE5 جاهز للـ compile بدون `.uproject` وUnreal Engine.
- لا نعد بقدرات Operators قبل تنفيذ input/cooldown/counterplay/telemetry.
- لا نضيف paid gameplay أو loot boxes.
- لا نستخدم أصولاً أو أصواتاً أو خرائط أو كوداً من ألعاب أخرى.

---

## 5. أوامر التشغيل والتحقق

```powershell
cd C:\Users\ahmed\.openclaw-autoclaw\workspace\combat-protocol
npm test
npm run verify
node server.mjs
```

المعاينة المحلية:

```text
http://127.0.0.1:4173/
```
