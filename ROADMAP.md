# Combat Protocol — خطة التطوير الكاملة الجديدة v2

**تاريخ الخطة:** 25 أكتوبر 2026  
**الإصدار الحالي:** `1.18.0`  
**الهدف:** تحويل الـPrototype المحلي القابل للعب إلى لعبة FPS أصلية قابلة
للتوسع، مع الحفاظ على خطوات قابلة للاختبار وعدم ادعاء أن Multiplayer أو UE5
منفذان قبل وجود كود واختبارات حقيقية.

---

## 0. القواعد غير القابلة للتفاوض

1. المشروع الوحيد المعتمد هو مجلد `combat-protocol`.
2. البورت `4173` محجوز لـCombat Protocol؛ أي مشروع آخر يستخدم بورتاً مختلفاً.
3. كل ميزة جديدة يجب أن تمر عبر loop حقيقي: واجهة → كود gameplay → نتيجة
   مرئية → اختبار.
4. لا نستخدم أصولاً أو شعارات أو خرائط أو أصواتاً من لعبة أخرى.
5. لا نعلن Multiplayer production أو 60-player BR أو UE5 جاهزاً دون بنية فعلية.
6. أي قدرة أو loot يجب أن يملك counterplay وحدوداً وTelemetry، لا مجرد زر شكلي.
7. لا نضيف paid gameplay أو pay-to-win؛ التخصيص المدفوع مستقبلاً تجميلي فقط.

---

## 1. خط الأساس المنفذ — v1.7.0

### المحتوى

- 5 أطوار محلية: Deathmatch، TDM، Survival، Battle Royale تجريبي، Frontline Ops.
- 5 خرائط: Port Meridian، Crossline Yard، Stackyard 12، Drydock 9، Night Bazaar.
- 9 أسلحة: AR-4، SMG-9، DMR-7، P-12، SR-9، LMG-6، SG-12، BR-7، VPR-5.
- 11 attachment مع slot constraints وتأثيرات حقيقية.
- 4 Operators: Vanguard، Scout، Medic، Atlas.
- Frag grenade، auto-heal، XP، Credits، local profile، settings، touch controls.
- realism pass للأسلحة: rails، bolt، fasteners، casing ejection، bolt kickback، وخامات deterministic.
- realism pass للحركة والعالم: breathing sway، landing kick، environment palettes، fog، stains، container door details، hazard strips.
- عقد Battle Royale data-driven في `js/battle-royale-plan.js` مع خطة 60 لاعباً غير معلنة كميزة منفذة.

### الحلقة

```text
Main Menu → Mode/Map → Armory → Match → Combat/Objectives → Debrief → XP
```

### الأدلة المطلوبة لهذا الخط الأساس

- `npm test`: unit rules والبيانات والـmission.
- `npm run verify`: browser smoke، القوائم، القتال، الخرائط، الهاتف.
- `/health` على `4173`: يعلن `Combat Protocol` و`1.14.0`.

---

## 2. المرحلة A — تثبيت حزمة المحتوى الجديدة

**المدة المستهدفة:** 3–5 أيام  
**الحالة:** قيد الإغلاق بعد إضافة v1.6

### المهام

- اختبار كل خريطة في Deathmatch وSurvival، وليس boot فقط.
- قياس زمن الاشتباك على Drydock 9 وNight Bazaar.
- ضبط SG-12 حتى لا يقتل من مدى AR-4 أو BR-7.
- إضافة weapon cards فيها damage/range/handling واضحة.
- إضافة map preview نصي أو صورة إجرائية لكل خريطة.
- التحقق من عدم قطع HUD عند ظهور 9 weapon slots على الشاشات الصغيرة.
- تسجيل telemetry للسلاح والخريطة عند بداية المباراة.

### معايير الخروج

- كل خرائط v1.6 تبدأ وتستمر حتى نهاية match بدون crash.
- SG-12 وBR-7 وVPR-5 أدوارها مفهومة من الوصف والأرقام.
- لا Console errors في smoke.
- `npm test` و`npm run verify` ناجحان.

---

## 3. المرحلة B — First Light 1.1 والقدرات الأولى

**المدة المستهدفة:** 1–2 أسبوع

### القصة والـUX

- شاشة Briefing قبل المهمة.
- Subtitle channel data-driven بالعربية والإنجليزية.
- Radio cues لـFRONTLINE/Assembly مع WebAudio fallback.
- Debrief يوضح objectives المكتملة وسبب الفشل والوقت.
- حفظ أفضل نتيجة للمهمة في profile.

### القدرة الأولى

تنفيذ `Rook` كقدرة أولى قبل بناء شجرة قدرات كاملة:

- `Breach Charge` تكسر cover خفيفاً.
- cooldown ظاهر في HUD.
- صوت/marker قبل الانفجار.
- ضرر محدود، لا auto-aim، ولا اختراق جدران كاملة.
- counterplay: الابتعاد، كسر الجهاز، أو تغيير الزاوية.
- Telemetry: cast، hit، cover_break، cooldown_ready.

### معايير الخروج

- First Light من البداية للنهاية في 8–10 دقائق دون تخطي state.
- كل objective له marker، subtitle، success/failure، وevent.
- Rook ability تعمل في match حقيقي وتفشل بشكل آمن عند cooldown.

---

## 4. المرحلة C — عمق اللاعب والـGunsmith

**المدة المستهدفة:** 2–3 أسابيع

### Operators

- نقل الهوية تدريجياً إلى Rook، Bulwark، Sable، Wisp، Ember، Atlas.
- aliases للـprototype IDs القديمة حتى لا تضيع profiles المحلية.
- لكل Operator: passive بسيط، قدرة primary، cooldown، counterplay، وتليمتري.
- عدم إضافة ultimate قبل ثبات primary ability.

### Loadout

- سلاح أساسي أول + سلاح أساسي ثانٍ + pistol.
- grenade slot وability slot.
- مقارنة base مقابل attachments مع أرقام before/after.
- weapon mastery منفصلة عن profile XP.
- inspect view وreload variants لاحقاً.

### الوصول

- إعادة ربط الأزرار.
- color-blind palette.
- حجم subtitles.
- reduced motion.
- gamepad mapping أولي.

### معايير الخروج

- حفظ loadout واستعادته بعد reload.
- كل attachment يعرض trade-off واضحاً.
- لا Operator يفوز في كل المسافات بسبب stats فقط.

---

## 5. المرحلة D — Battle Royale BR-0 محلي كامل

**المدة المستهدفة:** 3–4 أسابيع

### الأنظمة

- Loot tables: Common / Rare / Epic / Legendary.
- pickups: weapon، ammo، armor، heal، grenade، attachment.
- inventory بسعة محدودة وdrop/pickup.
- سلاحان أساسيان + pistol + ثلاث فتحات attachments.
- authored POIs من خرائط Meridian Belt.
- 20 bot بدلاً من 12 مع spawn budget واضح.
- circle phases، warning audio، وfinal-circle HUD.
- match result: placement، kills، loot، XP.

### معايير الخروج

- يمكن بدء BR، التقاط غرض، تغييره، إسقاطه، ثم استخدامه.
- لا ينهار inventory عند الامتلاء أو duplicate item.
- الدائرة تحذر قبل damage وتظل قابلة للعب.
- 20 bot تعمل ضمن ميزانية الأداء المتفق عليها.

---

## 6. المرحلة E — TDM حقيقي محلياً

**المدة المستهدفة:** 2–3 أسابيع

### الأنظمة

- فريق اللاعب وفريق الخصم فعلياً، لا مجرد enemyCount.
- team colors وally/enemy silhouettes.
- scoreboard لحظي: kills، deaths، assists، streak.
- spawn protection وspawn scoring.
- team score وround end وdraw.
- killfeed يميز الفريقين.
- map tuning لـDrydock 9 وNight Bazaar كخرائط TDM أساسية.

### معايير الخروج

- TDM يثبت 5v5 بوتات قبل الشبكة.
- scoreboard لا يعتمد على نص ثابت.
- spawn لا يعيد اللاعب أمام خط نار مباشر باستمرار.
- اختبارات contract تغطي win/loss/draw وrespawn.

---

## 7. المرحلة F — Multiplayer prototype 2–4 لاعبين

**المدة المستهدفة:** 4–6 أسابيع

### البنية

```text
Three.js client
   → WebSocket gateway
   → authoritative Node simulation @ 20Hz
   → snapshots @ 10Hz
   → client prediction/reconciliation
   → lag compensation
   → room lifecycle
```

### الترتيب

1. protocol schema للـjoin/leave/input/snapshot.
2. room واحدة مع 2 clients.
3. authoritative movement.
4. authoritative shooting/damage/ammo.
5. respawn وscoreboard.
6. reconnect وdisconnect cleanup.
7. telemetry latency/tick/hit registration.

### معايير الخروج

- لاعبان حقيقيان يقتلان بعضهما في TDM.
- السيرفر هو مصدر الحقيقة للضرر والذخيرة والنتيجة.
- اختبار packet delay وloss لا يكسر state machine.
- لا يتم تسمية هذه المرحلة production multiplayer قبل load test.

---

## 8. المرحلة G — Production services

**المدة المستهدفة:** بعد إثبات multiplayer prototype

- حسابات وهوية آمنة.
- PostgreSQL للملف والإحصاءات.
- Redis للغرف المؤقتة والـmatchmaking.
- rate limiting وvalidation وserver-side visibility.
- anti-cheat telemetry، audit log، moderation hooks.
- crash reporting وmetrics وalerts.
- CI يبني العميل والسيرفر ويشغل unit/integration/smoke.

### معايير الخروج

- migrations قابلة لإعادة التشغيل.
- rollback واضح.
- لا secrets داخل repository.
- load test موثق مع p50/p95 latency.

---

## 9. المرحلة H — UE5 migration

**شرط البدء:** اكتمال TDM الشبكي ووجود ميزانية أداء واضحة

1. إنشاء `.uproject` وBuild targets.
2. نقل movement/combat/attributes إلى C++ وGameplay Ability System.
3. نقل الخرائط إلى authored modular kits.
4. نقل First Light إلى Objective actors/state components.
5. replication وdedicated server.
6. replay، PIE automation، وnetworked test maps.
7. PBR materials، animation، VFX، audio middleware، LOD/HLOD.

لا يتم حذف Prototype قبل أن يثبت UE5 نفس acceptance tests الأساسية.

---

## 10. المرحلة I — Battle Royale production

```text
BR-0  20 bots + loot + circle                    ← بعد المرحلة D
BR-1  20 players + reconnect + server results    ← بعد المرحلة F/G
BR-2  60 players + squads + revive + ping        ← بعد load testing
BR-3  seasons + cosmetics + challenges           ← بعد stability
```

### قواعد

- لا 60 لاعباً قبل إثبات 5v5 ومقاييس latency.
- لا revive أو squad economy قبل inventory contract.
- كل cosmetics منفصلة عن damage وattachments القتالية.

---

## 11. الأداء والجودة

### أهداف Prototype

- 60 FPS مستهدف في Deathmatch على جهاز متوسط.
- 30 FPS كحد أدنى في BR-0 مع 20 bot.
- draw calls وtexture memory مراقبان في smoke أو benchmark.
- Safe Mode يعمل عند فشل WebGL/GPU.

### بوابة كل إصدار

```text
node --check <changed js files>
git diff --check
npm test
npm run verify
health check on 4173
```

لا يتم اعتماد release إذا فشل اختبار بسبب ميزة جديدة؛ يتم إصلاح السبب أو
تسجيل blocker واضح بدلاً من تعطيل الاختبار.

---

## 12. ترتيب التنفيذ النهائي

1. إغلاق واختبار v1.6 content pack.
2. First Light subtitles/radio/debrief.
3. Rook Breach Charge.
4. Gunsmith وinventory محدود.
5. BR-0 loot/inventory مع 20 bot.
6. TDM teams/scoreboard/spawn.
7. WebSocket 2–4 players.
8. services/security/observability.
9. UE5 migration بعد acceptance parity.
10. BR production ثم live content.

هذا الترتيب يمنع القفز إلى multiplayer أو 60-player BR قبل تثبيت الأساس
القابل للقياس.
