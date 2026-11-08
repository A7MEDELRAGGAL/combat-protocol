# Combat Protocol — Battle Royale Master Plan

**التاريخ:** 25 أكتوبر 2026  
**الهدف المستقبلي:** Battle Royale أصلية لـ60 لاعباً على خريطة Meridian Belt  
**الحالة الحالية:** Prototype محلي؛ BR الحالي sandbox ضد 12 خصماً، وليس المنتج النهائي.

هذا المستند هو خطة BR الكاملة من النسخة المحلية الحالية حتى نسخة production.
كل مرحلة لها حلقة قابلة للعب، عقد بيانات، Telemetry، وبوابة خروج. لا ننتقل إلى
المرحلة التالية بزيادة عدد اللاعبين فقط؛ نثبت أولاً أن الحركة والـloot والضرر
والشبكة والنتائج عادلة وقابلة للقياس.

---

## 1. الرؤية والوعود

### وعد اللاعب

```text
انزل → اقرأ المكان → اجمع تجهيزك → اختم اشتباكاً قصيراً
→ خذ قراراً اقتصادياً → دوّر مع الدائرة → قاتل للـfinal circle
```

كل 30–60 ثانية يجب أن يواجه اللاعب قراراً واضحاً:

- هل يهبط في POI عالي المخاطرة أم منطقة هادئة؟
- هل يحتفظ بسلاح قوي مع ذخيرة قليلة أم يبدله؟
- هل يطارد kill أم يدوّر نحو المنطقة الآمنة؟
- هل ينقذ زميله الآن أم يؤمن الزاوية أولاً؟

### القواعد

1. لا pay-to-win؛ كل القوة القتالية داخل المباراة مكتسبة باللعب.
2. Solo / Duo / Squad بأحجام `1 / 2 / 4`.
3. الهدف الإنتاجي: 60 لاعباً، لكن البداية العملية 20 bot ثم 20 لاعباً ثم 60.
4. لا respawn مجاني؛ revive وbuyback محدودان ومكلفان اقتصادياً.
5. كل معلومة حرجة تظهر بقناتين على الأقل: لون + نص/أيقونة أو صوت.
6. كل قدرة أو عنصر له counterplay واضح.

---

## 2. الحالة الحالية والفرق الإنتاجي

### ما يعمل الآن في الـPrototype

- Battle Royale محلي ضد 12 خصماً.
- دائرة deterministic تتحرك وتتقلص عبر 5 مراحل.
- لا respawn.
- فوز عند اختفاء جميع الأعداء.
- HUD يعرض الدائرة والضرر خارجها.
- خرائط محلية صغيرة قابلة للاختيار.

### ما لم يعمل بعد

- drop plane أو spawn trajectory.
- خريطة BR كبيرة authored POIs.
- loot أرضي وbackpack وdrop/pickup.
- سلاحان أساسيان + pistol داخل inventory.
- فرق وrevive وbuyback.
- 20 bot بميزانية سلوك واضحة.
- سيرفر authoritative ونتائج موثوقة.
- reconnect، late join، party، ping، voice، anti-cheat.

---

## 3. شكل المباراة المستهدف

| المرحلة | الزمن التقريبي | ما يفعله اللاعب |
|---|---:|---|
| Drop | 0:00–1:15 | يختار نقطة الهبوط ويقرأ مسار الفرق |
| Loot | 1:15–3:30 | يجمع سلاحاً ودرعاً وعلاجاً وذخيرة |
| Rotate 1 | 3:30–6:00 | يدوّر إلى الدائرة الأولى ويخوض أول اشتباكات |
| Rotate 2 | 6:00–8:30 | يقرأ الفرق المتأخرة ويختار high ground |
| Rotate 3 | 8:30–11:30 | POI الآمن يصبح محدوداً والاشتباك أغلى |
| Final | 11:30–14:30 | الفرق المتبقية تتقارب، الموارد تنفد |
| Overtime | 14:30–18:00 | دائرة صغيرة، damage مرتفع، لا انتظار ميت |

الهدف هو جلسة مدتها 18 دقيقة تقريباً، مع السماح بإنهاء مبكر عند تفوق فرقة
واضح. لا نريد 20 دقيقة من الدوران بلا احتكاك.

---

## 4. Meridian Belt — خريطة BR الكبيرة

### الحجم والبنية

- خريطة authored كبيرة مقسمة إلى 9 مناطق رئيسية.
- كل POI يحتوي على 3 مسارات دخول على الأقل ومخرج آمن واحد.
- كل منطقة تحتوي على cover قريب، خط mid-range، وموضع خطر مكشوف.
- لا يوجد POI يضمن loot أسطورياً؛ الندرة العالية ترفع المخاطرة ولا تلغيها.

### POIs

| POI | النوع | الهوية | المخاطرة |
|---|---|---|---|
| Port Meridian | hot-drop | حاويات ومياه ضحلة | close cover وفرق كثيرة |
| Glass District | high-ground | أبراج زجاجية مكسورة | sightlines طويلة |
| Old Market | hot-drop | سوق مسقوف وممرات ضيقة | اشتباك قريب |
| Blackline Facility | rotation-hub | منشأة طاقة مؤمنة | loot جيد ومخارج قليلة |
| Red Quarry | mid-tier | محجر مفتوح | تعرض كبير للدوران |
| Cloud Forest | quiet | غابة رطبة ومسارات ملتوية | رؤية محدودة وambush |
| Solar Ridge | high-ground | ألواح وتلال | دوران مكشوف |
| Floodplain | quiet | مبانٍ نصف غارقة | حركة ماء وصوت واضح |
| Relay Spire | rotation-hub | برج اتصالات مركزي | مكافأة رؤية ومخاطر نهائية |

### بنية POI القياسية

```text
Outer loot ring
  ├─ safe entry lane
  ├─ contested center
  ├─ vertical or flank route
  └─ rotation exit
```

معيار التصميم: يستطيع اللاعب الخروج من POI بدون عبور 100 متر مكشوفة بالكامل.

---

## 5. Drop والهبوط

### BR-0 المحلي

- اختيار spawn من قائمة POIs.
- زمن countdown قصير.
- لا نضيف طائرة قبل تثبيت loot وspawn flow.

### BR-1

- مسار طائرة deterministic لكل مباراة.
- اللاعب يقفز، يوجه trajectory، ويفتح مظلة تلقائياً.
- سرعة الهبوط والمناورة موحدة حتى لا يكون هناك exploit.
- تظهر على minimap كثافة الفرق التقديرية، لا مواقع دقيقة.

### BR-2

- مسارات طيران متعددة.
- team drop marker.
- ping موحد للـPOI والـloot.
- اختبار spawn fairness عبر 1000 seed.

---

## 6. Loot والندرة

### الفئات

- Weapon
- Ammo
- Armor
- Heal
- Grenade
- Attachment
- Utility

### الندرة

| Tier | الوزن | عدد slots | الاستخدام |
|---|---:|---:|---|
| Common | 60% | 1 | بداية المباراة |
| Rare | 28% | 2 | تجهيز قابل للاعتماد |
| Epic | 10% | 3 | build متخصص |
| Legendary | 2% | 3 | مكافأة مخاطرة عالية |

### قواعد loot

1. لا تظهر Legendary في كل POI hot-drop.
2. لا يكرر الصندوق نفس attachment بلا فائدة.
3. كل squad يجد سلاحين usable خلال أول 45 ثانية في POI عادي.
4. ammo economy تمنع إطلاقاً بلا توقف.
5. pickups لها silhouette وcolor وaudio مختلف لكن واضح.
6. loot table deterministic بالـseed للاختبار، عشوائي داخل حدود معروفة في اللعب.

### الصناديق

- Ground loot: سريع، منخفض الندرة.
- Supply crate: صوت واضح، وقت فتح، loot أعلى.
- Secure cache: يفتح بمفتاح/وقت، مكافأة متخصصة.
- High-value relay: يعلن المنطقة تقريبياً ويجذب الفرق.

---

## 7. Inventory

### السعة

- 10 slots أساسية.
- Backpack يرفع السعة حتى 18.
- سلاحان أساسيان.
- مسدس واحد.
- slot درع واحد.
- attachments مرتبطة بالسلاح ولا تملأ inventory بعد التركيب.

### قواعد الاستخدام

- pickup تلقائي اختياري، مغلق افتراضياً للـrare items.
- زر compare يعرض before/after.
- drop bundle لا يرمي كل الموارد بالخطأ.
- duplicate armor يتم تحويله إلى repair plates فقط إذا كانت القاعدة تسمح.
- عند الامتلاء تظهر رسالة واضحة وبديل drop، لا silently fail.

### Acceptance

```text
loot → equip → compare → drop → pick again → survive reload/reconnect
```

يجب أن ينجح هذا التدفق في اختبار browser قبل إضافة skins أو store.

---

## 8. Combat وWeapons داخل BR

### pool البداية

- AR-4: متوسط ومتوازن.
- SMG-9 / VPR-5: قريب سريع.
- DMR-7 / BR-7: mid/long precision.
- SG-12: close burst.
- SR-9: high-risk sniper.
- LMG-6: suppression مع reload ثقيل.
- P-12: sidearm.

### قواعد التوازن

- weapon ليس الأفضل في كل distance.
- shotgun يحتاج commitment ومسافة قريبة.
- sniper يملك glint/صوت/وقت إعادة تمركز كـcounterplay.
- LMG يعطي suppression ولا يقتل أسرع من AR في كل الحالات.
- attachment يزيد trade-off ولا يحوّل السلاح إلى upgrade مجاني.

### بيانات يجب قياسها

- pick rate لكل weapon.
- kill share.
- damage per engagement.
- average distance of kill.
- first-shot accuracy.
- attachment adoption.
- kills قبل أول heal.

بوابة التوازن الأولى: لا يتجاوز أي سلاح 35% من kills في عينة كبيرة إلا إذا كان
ذلك مقصوداً لفترة اختبار موثقة.

---

## 9. Armor والـHealing

### Armor

- ثلاث درجات درع تجميلية/وظيفية قابلة للضبط، لا تمنح invulnerability.
- الدرع يقلل incoming damage حسب نوعه، ولا يلغي headshot.
- plates أو repair kits تحتاج وقتاً وموقعاً آمناً.

### Healing

- heal سريع يعيد health جزئياً.
- med kit يعيد أكثر لكن يثبت اللاعب فترة أطول.
- لا full heal فوري أثناء إطلاق النار.
- صوت healing يسمعه الخصم القريب مع occlusion محدود.

---

## 10. Squad وRevive وBuyback

### Downed state

- اللاعب لا يموت فوراً في Squad.
- downed window: 25 ثانية.
- يزحف بسرعة منخفضة، لا يطلق النار.
- revive teammate: 7 ثوانٍ، قابل للمقاطعة بالضرر.
- لا self-revive في النسخة الأولى.

### Buyback

- teammate يمكنه إرجاع اللاعب من محطة شراء.
- buyback window: 120 ثانية.
- التكلفة ترتفع بعد كل buyback.
- لا buyback في final phase.
- محطة الشراء تعرض صوتاً ومؤشراً يجذب الخطر؛ لا تكون مجانية أو مخفية.

### Anti-abuse

- لا يمكن chain-revive بلا cooldown.
- لا revive داخل wall أو خارج play space.
- server يتحقق من المسافة والـline of sight والوقت.

---

## 11. الدائرة والـStorm

### المراحل

```text
Drop       radius 31 / damage 0
Loot       radius 31 / damage 0
Rotate 1   radius 24 / damage 3
Rotate 2   radius 18 / damage 5
Rotate 3   radius 13 / damage 8
Final      radius 9  / damage 12
Overtime   radius 7  / damage 15
```

الخطة data-driven موجودة في `js/battle-royale-plan.js`. النموذج الحالي يستخدم
خطة أبسط في `js/zone.js` حتى لا نكسر الـPrototype قبل إضافة inventory.

### قواعد القراءة

- warning قبل damage بوقت كافٍ.
- الخط الداخلي يوضح safe area الحالية.
- الخط الخارجي يوضح target area التالية.
- color يتدرج cyan → violet → red.
- الصوت يتغير حسب المرحلة دون إغراق أصوات الخطوات والطلقات.

---

## 12. AI Bots — BR-0

### 20 bot target

كل bot يملك:

- spawn/loot budget.
- سلاحاً وذخيرة ودرعاً.
- قرار rotate حسب الدائرة.
- hearing مبسط.
- retreat عند health منخفض.
- اختيار cover وflank محدود.
- سلوك squad اختياري بعد ثبات Solo bots.

### مستويات السلوك

1. **Rookie:** يمشي، يطلق، يدوّر نحو الدائرة.
2. **Tactical:** يختار cover ويستخدم heal.
3. **Squad:** يشارك target وrevive وping داخلي.

لا نستخدم bots لتزييف أرقام نجاح matchmaking؛ واجهة النتائج تميز bot عن player.

---

## 13. الشبكة والـAuthority

### البنية

```text
Client input
  → WebSocket gateway
  → authoritative simulation @ 20Hz
  → snapshots @ 10Hz
  → prediction/reconciliation
  → lag compensation
  → result persistence
```

### server authority

السيرفر يقرر:

- position validity.
- weapon/ammo/reload.
- hit registration والضرر.
- loot ownership.
- inventory.
- downed/revive/buyback.
- zone phase وdamage.
- placement والنتيجة.

العميل يعرض feedback فورياً، لكنه لا يكتب النتيجة النهائية.

### مراحل الشبكة

- BR-0: local 20 bot.
- BR-1: 20 human players، reconnect وserver results.
- BR-2: 60 players، squad/revive/ping.
- BR-3: ranked/seasonal بعد stability.

---

## 14. Progression والاقتصاد

### داخل المباراة

- kills، assists، placement، objectives، revive، loot value.
- XP لا يزيد damage مباشرة.
- weapon mastery تفتح cosmetics وتجارب attachment.

### خارج المباراة

- profile XP ومستوى.
- challenges يومية/أسبوعية.
- banners، weapon skins، charms، announcer packs.
- لا شراء armor أو damage أو rarity.

### النتائج

```text
placement + kills + team actions + challenge progress
→ XP + mastery + cosmetic currency
```

أي currency جديدة يجب أن تكون قابلة للتدقيق ولا تعتمد على loot boxes مدفوعة.

---

## 15. الصوت والواقعية

- اتجاه الطلقة والمسافة والـocclusion أهم من رفع مستوى الصوت.
- distinct audio لكل weapon family.
- loot وhealing وrevive لها sounds قابلة للقراءة.
- final circle يضيف tension layer، لكنه لا يغطي footsteps.
- subtitles للأحداث الحرجة.
- assets النهائية أصلية أو مرخصة، ولا نقلد تسجيلات لعبة أخرى.

---

## 16. الأداء والأمان

### أهداف الأداء

| البند | الهدف |
|---|---:|
| Client target | 60 FPS في TDM |
| BR-0 | 30 FPS كحد أدنى مع 20 bot |
| Server tick | 20Hz |
| Snapshot | 10Hz |
| Hit validation | server-side |
| reconnect | أقل من 10 ثوانٍ عند الإمكان |

### الأمان

- validation لكل input.
- fire-rate checks.
- impossible movement detection.
- line-of-sight/hit origin validation.
- rate limits على ping/loot/revive.
- audit log للنتيجة والـinventory.
- لا secrets في العميل أو repository.

---

## 17. Milestones وبوابات الخروج

### BR-0 — Local survival slice

**المحتوى:** 20 bot، loot، inventory، circle، placement.  
**Gate:** يستطيع اللاعب loot/equip/drop/heal والفوز أو الخسارة مع نتيجة صحيحة.

### BR-0.5 — Squad offline

**المحتوى:** bots squad، downed، revive، buyback mock.  
**Gate:** لا revive خارج الزمن أو خارج المسافة، والنتيجة تفرق بين alive/downed/dead.

### BR-1 — Networked 20

**المحتوى:** 20 لاعباً، server authority، reconnect، results.  
**Gate:** p95 latency وhit registration موثقان، ولا يمكن للعميل تزوير ammo/placement.

### BR-2 — Production 60

**المحتوى:** 60 لاعباً، squads، ping، revive، POIs كاملة.  
**Gate:** load test، crash-free sessions، queue، reconnect، moderation hooks.

### BR-3 — Live seasons

**المحتوى:** challenges، cosmetics، ranked، events.  
**Gate:** economy audit، content pipeline، rollback، anti-cheat monitoring.

---

## 18. خطة التنفيذ داخل هذا المشروع

1. إنهاء realism pass الحالي للأسلحة والعالم بدون لمس المشاريع الأخرى.
2. تثبيت `battle-royale-plan.js` كـcontract data-driven واختباره.
3. بناء inventory المحلي قبل أي WebSocket.
4. إضافة loot على خريطة واحدة authored ثم تعميمه على Meridian Belt.
5. رفع bot count إلى 20 بعد قياس الأداء.
6. إضافة downed/revive محلياً.
7. بناء TDM network prototype صغير.
8. نقل نفس contracts إلى BR networked.
9. load test ثم 60-player production.

### ما لن ندعيه الآن

- BR 60 لاعباً ليست منفذة.
- squads وrevive وloot الكامل ليست منفذة في الـPrototype الحالي.
- السيرفر المحلي ليس authoritative multiplayer.
- الواقعية الحالية هي procedural presentation pass، وليست assets production.

---

## 19. Definition of Done للـBR النهائي

- Solo/Duo/Squad تعمل بنتائج server-authoritative.
- 60 لاعباً مع reconnect وplacement موثوق.
- Loot وinventory وarmor/heal وattachments مكتملة.
- Downed/revive/buyback عادلة ومختبرة.
- دائرة واضحة ومقروءة مع final phase.
- POIs متنوعة ولا يوجد مسار مضمون للفوز.
- لا weapon dominant بعد telemetry كبيرة.
- 60 FPS TDM و30 FPS BR-0 على الجهاز المستهدف.
- crash/error/anti-cheat dashboards.
- كل المحتوى أصلي أو مرخص.
