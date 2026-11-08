# COMBAT PROTOCOL: FRONTLINE // مستند تصميم اللعبة (GDD)

**الإصدار:** 1.1 — Production Blueprint + Supplement
**التاريخ:** 24 أكتوبر 2026
**الحالة:** وثيقة التصميم المستهدفة + تحويل النموذج الأولي الحالي إلى خطة إنتاج
**المنصة:** PC أولاً، ثم Mobile
**المحرك المستهدف للإنتاج:** Unreal Engine 5
**النموذج الحالي:** Three.js/WebGL محلي قابل للعب، يستخدم لإثبات الحلقة والـ UX قبل نقل الأنظمة إلى UE5

> هذا المستند يحدد لعبة أصلية بالكامل. لا ينسخ أصولاً أو أسماء أو خرائط أو شعارات من أي لعبة أخرى.

---

## 0. ملخص تنفيذي وتحليل الوضع الحالي

### 0.1 الرؤية

**Combat Protocol: Frontline** لعبة FPS تنافسية سريعة تجمع بين:

- Battle Royale لـ 60 لاعباً: Solo / Duo / Squad.
- Team Deathmatch لـ 5v5 أو 6v6.
- Heroes بقدرات محدودة لا تطغى على مهارة التصويب.
- Gunsmith عميق بمقايضات واضحة.
- تقدم طويل المدى تجميلي ومهاري بدون Pay-to-Win.

وعد اللعبة للاعب:

> **كل 30 ثانية قرار مهم:** تحرك، اختر زاوية، اقتل، خذ الغنيمة، ثم غيّر تجهيزك قبل أن يتغير الموقف.

### 0.2 الوضع الحالي للنموذج الأولي

النموذج الحالي يثبت الأساس التالي:

| النظام | الحالة الحالية | الفجوة الإنتاجية |
|---|---|---|
| FPS movement | حركة، جري، قفز، crouch، تصادم | يحتاج slide، vault، mantle، stamina وحركة شبكية |
| Shooting | Hitscan، recoil، spread، ADS، hitmarker | يحتاج server authority، lag compensation، animation وdamage zones |
| Weapons | 6 أسلحة أصلية | يحتاج roster كامل، rarity، progression وGunsmith احترافي |
| Modes | Deathmatch/TDM محلي، Survival، BR تجريبي | يحتاج غرف multiplayer، teams، scoreboard وmatch flow |
| AI | Patrol/chase/attack | يحتاج cover، squads، loot، rotation وBR bots |
| World | ميناء إجرائي واحد | يحتاج خريطة BR يدوية 2×2 كم و3 خرائط TDM |
| Progression | XP/credits/operators/mرفقات محلية | يحتاج skill trees، inventory، backend وanti-cheat |
| Graphics | Geometry إجرائية ومواد Canvas | يحتاج art pipeline، PBR، VFX، animation، LOD وlighting production |
| Audio | WebAudio مولد | يحتاج طبقات صوتية، positional mix، voice lines وmastering |

### 0.3 قرارات النطاق

1. **لا نبدأ بـ 60 لاعباً قبل إثبات TDM 5v5.** الشبكة، spawn، hit registration والصوت يجب أن تثبت في مساحة أصغر.
2. **القدرات تعزز القرار ولا تستبدل التصويب.** لا يوجد auto-aim أو ضرر مجاني غير قابل للرد.
3. **المال يشتري الشكل فقط.** لا سلاح أو attachment أو skill gameplay يُباع مباشرة.
4. **النموذج الحالي ليس Multiplayer production.** هو playground للتحقق من المتعة والتجربة وواجهة الأنظمة.

---

# القسم الأول — Game Overview

## 1. الاسم، التصنيف، والمنصات

### الاسم المقترح

**Combat Protocol: Frontline**

اسم فرعي داخلي للعلامة: **CP-FL**.

### التصنيف

- FPS تنافسي.
- Battle Royale: Solo / Duo / Squad.
- Team Deathmatch: 5v5 / 6v6.
- Hero shooter خفيف القدرات.
- Gunsmith وweapon mastery.

### الجمهور المستهدف

| البند | القرار |
|---|---|
| العمر | 16+ حسب تصنيف المنطقة؛ عنف خيالي غير دموي بشكل مفرط |
| النمط | تنافسي أساسي، تعاوني في Duo/Squad |
| الجلسة | TDM: 10 دقائق، BR: 18–22 دقيقة |
| المهارة | سهل البدء، سقف مهارة مرتفع في aim/movement/positioning |
| الربح | Cosmetics فقط: skins، banners، finishers، announcer packs |
| المنصات | PC keyboard/mouse وcontroller أولاً، ثم touch-first mobile |

## 2. الحلقة الأساسية Core Loop

```text
استكشف → اختر مخاطرة → قاتل → انهب → طوّر تجهيزك → دوّر نحو الهدف → قاتل من جديد
   5s       5s          5-12s       3s          2s          5-15s
```

### حلقة 30 ثانية

1. يقرأ اللاعب الخريطة والصوت والـ minimap.
2. يحدد أقرب loot أو زاوية آمنة أو خصم ضعيف.
3. ينفذ اشتباكاً قصيراً: hip-fire / ADS / ability.
4. يلتقط قراراً واحداً: ذخيرة، armor، attachment، heal أو سلاح بديل.
5. يعيد التموضع قبل أن تصل دائرة أو فرقة أخرى.

### انعكاسها في Battle Royale

- **استكشف:** drop، POI، صوت إطلاق، خريطة الدائرة.
- **قاتل:** اشتباكات قصيرة وmid-range مع فرص disengage.
- **انهب:** rarity، ammo، armor، healing، attachments.
- **طوّر:** عدّل السلاح، اختر skill branch، وحافظ على اقتصاد المخزون.

### انعكاسها في TDM

- **استكشف:** قراءة lanes وspawn وtiming.
- **قاتل:** اشتباك متكرر كل 8–20 ثانية.
- **انهب:** لا يوجد loot أرضي؛ البديل هو اختيار loadout وweapon swap.
- **طوّر:** ultimate charge، streaks، تبديل attachment بحسب الخريطة.

## 3. مبادئ التصميم Design Pillars

1. **Readable Combat:** كل صوت، لون، muzzle flash وhit feedback واضح.
2. **Fast Decisions:** لا وقت ميت؛ كل انتقال يمنح معلومة أو مخاطرة.
3. **Fair Mastery:** المهارة تأتي من aim، movement، positioning وteamplay.
4. **Meaningful Trade-offs:** كل قوة لها كلفة في attachment أو قدرة.
5. **Original Identity:** هوية صناعية ساحلية مستقبلية، وليست نسخة من عسكري حديث تقليدي.

## 4. تجربة اللاعب User Experience

```text
Boot → Main Menu → Operator/Loadout → Mode Select → Matchmaking
  → Drop/Spawn → Match HUD → Result Screen → XP/Mastery → Next Match
```

معيار النجاح لأول جلسة:

- يبدأ اللاعب أول TDM خلال أقل من 60 ثانية.
- يفهم الحركة، النار، reload والقدرة خلال أول دقيقتين.
- يحقق أول kill أو assist خلال أول 3 دقائق.
- يفتح أول attachment خلال أول جلستين.

---

# القسم الثاني — Art Style Guide / Art Bible

## 5. الهوية البصرية

### الأسلوب

**Realistic industrial sci-fi with graphic tactical accents**:

- خامات واقعية متسخة ومستخدمة.
- هندسة صناعية واضحة وقابلة للقراءة من مسافة.
- خطوط إضاءة cyan/amber كجزء من الأجهزة لا كزخرفة عشوائية.
- ألوان الشخصيات والفرق مصممة للتمييز حتى في دخان خفيف.

### لوحة الألوان

| الاستخدام | اللون | Hex |
|---|---|---|
| Background charcoal | أسود أخضر | `#080D0E` |
| Industrial concrete | رمادي دافئ | `#77736A` |
| Protocol amber | برتقالي تكتيكي | `#D9A45C` |
| Recon cyan | أزرق سماوي | `#58C7D9` |
| Enemy red | أحمر تحذيري | `#D9584A` |
| Ally green | أخضر آمن | `#8BCB7A` |
| Rare blue | ندرة نادرة | `#4EA4E8` |
| Epic violet | ندرة ملحمية | `#A77BE8` |
| Legendary gold | ندرة أسطورية | `#F1B95E` |

### الإضاءة

- Key light دافئ منخفض الزاوية.
- Fill بارد من السماء أو مصادر صناعية.
- أضواء POI تشرح المناطق المهمة ولا تضيء كل شيء بالتساوي.
- داخل المباني: practical lights، volumetric shafts، flicker محدود.
- لا نستخدم bloom لتغطية ضعف الخامات؛ bloom مكافأة للـ muzzle/ultimate فقط.

### VFX وAtmosphere

- غبار خفيف في المناطق الجافة.
- رذاذ/ضباب بحري في الميناء.
- شرر، casing ejection، heat distortion وimpact decals.
- storm في BR: تدرج cyan → violet → red بحسب المرحلة.
- abilities تستخدم silhouettes مميزة لا مجرد ألوان مختلفة.

## 6. دليل الشخصيات

### قواعد القراءة من المسافة

- كل Hero له لون accent واحد، شكل كتف/خوذة مميز، وprop كبير واحد.
- silhouette يجب أن تُقرأ في 12–15 متراً بدون skin.
- لا نستخدم أزياء camouflage كاملة؛ نخسر الوضوح التنافسي.
- الفريق يملك rim light أخضر شفاف؛ العدو rim light أحمر خافت في المدى القريب.

### الحركة والأنيميشن

| الفئة | المعيار |
|---|---|
| Locomotion | idle، walk، sprint، crouch، slide، jump، land، mantle |
| Combat | equip، ADS، fire، reload tactical/empty، melee، hit react |
| Ability | cast، travel، impact، cancel، cooldown feedback |
| Expression | لا نستخدم facial animation أثناء القتال إلا في intro/finish |
| Readability | ability pose لا تتجاوز 0.4s قبل التأثير |

## 7. دليل الأسلحة

كل سلاح يمتلك:

- silhouette مختلفاً من الأمام والجانب.
- نقطة لون صغيرة مرتبطة بالفئة.
- خامة PBR: metalness، roughness، normal، AO، emissive للواجهة فقط.
- muzzle flash خاص بالفئة.
- طبقة صوت shot، tail، mechanical، impact.

أمثلة silhouette:

| الفئة | silhouette | خامات وألوان | VFX |
|---|---|---|---|
| AR | receiver متوسط، mag منحني، stock كامل | graphite + amber | flash قصير وtracer رفيع |
| SMG | جسم قصير، mag سفلي/خلفي، stock قابل للطي | dark teal + cyan | flash سريع وshell كثيف |
| DMR | barrel طويل، optic واضح، mag قصير | gunmetal + red | muzzle قوي وimpact أبيض |
| Sniper | barrel طويل، chassis عريض، bipod | sand/black | crack صوتي، lens glint محدود |
| Pistol | slide مميز، grip زاوي | brushed metal + accent | flash صغير عالي التباين |
| Melee | شكل واحد قابل للقراءة، لا أسلحة حادة واقعية مفرطة | ceramic/industrial | arc trail مختصر |

## 8. دليل البيئة والـ Moodboards

### خريطة BR: **The Meridian Belt**

شريط ساحلي صناعي تعرض لانهيار مناخي وتحوّل إلى منطقة صراع على الطاقة.

| المنطقة | Mood | ألوان | أسلوب اللعب |
|---|---|---|---|
| Port Meridian | حاويات ومياه ضحلة | teal/rust | lanes وclose cover |
| Glass District | أبراج زجاجية مكسورة | cyan/white | vertical mid-range |
| Old Market | سوق مسقوف مزدحم | amber/red | close quarters |
| Blackline Facility | منشأة عسكرية | green/steel | loot عالي ومخاطر عالية |
| Red Quarry | محجر مفتوح | ochre/black | sightlines طويلة |
| Cloud Forest | غابة رطبة | deep green | stealth وambush |
| Solar Ridge | ألواح شمسية وتلال | gold/blue | rotation مكشوف |
| Floodplain | مبانٍ نصف غارقة | blue/grey | water traversal |
| Relay Spire | برج اتصالات مركزي | violet/white | high-value central objective |

### خرائط TDM

1. **Drydock 9:** مصنع إصلاح سفن، 3 lanes، crane center، catwalks.
2. **Night Bazaar:** سوق ليلي مغلق، ممر رئيسي، أسطح جانبية، interior cover.
3. **Orbital Relay:** محطة فضائية تدريبية، غرف صغيرة، airlock lane، gravity lift flank.

---

# القسم الثالث — الشخصيات والتطوير

## 9. قائمة الـ Heroes

> الأرقام الأولية هدف توازن وليست نهائية. كل قدرة لها telegraph، cooldown وcounterplay.

### 9.1 Rook — الهجومي Assault

- **Passive — Momentum:** بعد sprint لمدة 2s، أول slide يستهلك stamina أقل ويمنح 8% سرعة لمدة 1s.
- **Primary — Breach Charge:** قنبلة لاصقة تكسر cover الخفيف وتسبب 65 ضرراً في المركز.
- **Secondary — Snap Dash:** اندفاعة 4m، لا تعبر الجدران، cooldown 16s.
- **Ultimate — Overdrive:** 8s: reload أسرع 25% وrecoil recovery أسرع 18%، لا زيادة ضرر.

```text
Rook Skill Tree
├─ Assault
│  ├─ Hot Entry: Breach Charge +10% radius
│  ├─ Quick Hands: reload بعد kill أسرع 12%
│  └─ Overpressure: Snap Dash يعيد 20% من cooldown عند assist
├─ Survival
│  ├─ Hard Landing: ضرر السقوط -50%
│  ├─ Second Wind: درع +15 بعد revive/respawn
│  └─ Slide Guard: damage أثناء slide -10%
└─ Team
   ├─ Breach Call: الأعداء المتأثرون يظهرون للفريق 2s
   ├─ Rally: Ultimate يعطي allies سرعة reload +8%
   └─ Entry Intel: أول damage في الجولة يكشف attacker 1s
```

### 9.2 Bulwark — الدفاع Defensive

- **Passive — Anchored:** crouch يقلل flinch بنسبة 20%.
- **Primary — Cover Node:** deployable cover له 350 HP، قابل للكسر من الجوانب.
- **Secondary — Kinetic Pulse:** دفعة قصيرة تبعد الأعداء ولا تسبب damage كبيراً.
- **Ultimate — Bastion Field:** مجال 6m يقلل damage الداخل 18% لمدة 7s، لا يمنع headshots.

```text
Bulwark Skill Tree
├─ Assault
│  ├─ Shock Frame: Kinetic Pulse +15% knockback
│  ├─ Counterplate: أول hit على Cover Node يطلق pulse صغير
│  └─ Breachproof: Cover Node يتحمل explosive +12%
├─ Survival
│  ├─ Reinforced Vest: max armor +15
│  ├─ Low Profile: crouch speed +8%
│  └─ Last Stand: عند HP أقل من 25، damage reduction 8% لمدة 3s
└─ Team
   ├─ Shared Cover: allies يمكنهم إصلاح 30 HP من node
   ├─ Safe Radius: Bastion Field +1m
   └─ Fortify Ping: ping داخل المجال يستمر 2s إضافية
```

### 9.3 Sable — الدعم Support

- **Passive — Field Medic:** revive أسرع 20%، ويمنح 15 armor مؤقتاً.
- **Primary — Med Drone:** drone يتبع ally ويعالج 45 HP على 5s؛ يتوقف عند damage قوي.
- **Secondary — Smoke Bloom:** دخان 5m، يمنع line of sight وليس thermal immunity.
- **Ultimate — Lifeline Array:** محطة تعالج 20 HP/s داخل 5m لمدة 8s، قابلة للتدمير.

```text
Sable Skill Tree
├─ Assault
│  ├─ Toxic Edge: Smoke Bloom يسبب 3 damage/s للأعداء فقط
│  ├─ Combat Medic: أول shot بعد healing أدق 12%
│  └─ Drone Dart: Med Drone يطبق 20 damage على enemy reveal فقط
├─ Survival
│  ├─ Triage: تبدأ healing أسرع 0.4s
│  ├─ Soft Step: footsteps أقل 10% أثناء حمل Med Drone
│  └─ Stabilize: health gate يمنع الموت مرة كل 90s ويترك 1 HP
└─ Team
   ├─ Wide Smoke: Smoke Bloom radius +1m
   ├─ Overheal: 10 HP من العلاج يصبح temporary armor
   └─ Remote Revive: revive يبدأ من 1m إضافية
```

### 9.4 Wisp — التقنية Recon/Intel

- **Passive — Signal Sense:** يلتقط صوت خطوات العدو بمدى أكبر 12%.
- **Primary — Scout Dart:** dart يثبت على surface ويكشف الحركة داخل 8m لـ 6s.
- **Secondary — Blink Beacon:** beacon يمكن إعادة التفعيل للعودة إلى موضعه خلال 5s.
- **Ultimate — Blackout Scan:** scan على شكل cone يكشف الأعداء غير خلف cover صلب لمدة 5s.

```text
Wisp Skill Tree
├─ Assault
│  ├─ Marked Target: damage على scanned enemy +5%، cap 1 target
│  ├─ Dart Shock: أول hit على dart-marked enemy يبطئ 12%
│  └─ Relay Burst: destroy beacon يسبب blind 0.4s
├─ Survival
│  ├─ Ghost Route: Blink Beacon صوت أقل 40%
│  ├─ Signal Scramble: لا يظهر ping موقعك عند كشفك أول مرة
│  └─ Escape Vector: العودة بالـ beacon تمنح 20% damage reduction لـ 1s
└─ Team
   ├─ Shared Mark: reveal يصل للفريق
   ├─ Long Scan: Blackout Scan +1.5s
   └─ Tactical Map: scanned enemies تظهر اتجاهاتها لا مواقعها الدقيقة
```

### 9.5 Ember — التحكم Control

- **Passive — Heat Economy:** damage على نفس الهدف خلال 3s يزيد ability charge بنسبة 4%.
- **Primary — Thermite Line:** خط نار 7m يبقى 4s ويمنع المرور الآمن.
- **Secondary — Flare Trap:** trap يضيء ويبطئ 20% عند التفعيل.
- **Ultimate — Heatwave:** موجة مخروطية تدفع وتضع burn خفيفاً، لا تقتل وحدها.

```text
Ember Skill Tree
├─ Assault
│  ├─ Hot Zone: Thermite Line damage +12%
│  ├─ Flashpoint: Flare Trap blind +0.2s
│  └─ Furnace: Heatwave cone +12%
├─ Survival
│  ├─ Firebreak: burn duration عليك -25%
│  ├─ Thermal Padding: explosive damage -8%
│  └─ Coolant: ability cooldowns -5% عند armor كامل
└─ Team
   ├─ Denial Call: يظهر خط النار على allied HUD
   ├─ Warm Cover: allies داخل flame edge يستعيدون 5 armor/s
   └─ Break Formation: Heatwave يكشف المتأثرين 2s
```

### 9.6 Atlas — التكتيكي Engineer

- **Passive — Salvage:** يحصل على 10% ammo من pickup إضافي، لا يزيد سعة المخزون.
- **Primary — Micro Turret:** turret 90 HP، damage منخفض، prioritizes marked enemies.
- **Secondary — Repair Beam:** يصلح allied deployable أو armor ذاتياً ببطء.
- **Ultimate — Aegis Drone:** drone متحرك يعطي 25 shield مؤقتاً للفريق داخل 5m لمدة 6s.

```text
Atlas Skill Tree
├─ Assault
│  ├─ Smart Targeting: turret acquisition أسرع 20%
│  ├─ Arc Rounds: turret يبطئ 8% لمدة 1s
│  └─ Salvage Shot: تدمير enemy deployable يعطي ammo صغير
├─ Survival
│  ├─ Toolbelt: deployable HP +12%
│  ├─ Emergency Plate: Repair Beam يمنح 5 temporary armor إضافية
│  └─ Hard Reset: cooldown أسرع 15% بعد destruction
└─ Team
   ├─ Shared Repair: allies يصلحون deployables بمعدل 50%
   ├─ Aegis Radius: drone radius +1m
   └─ Ammo Relay: allies داخل drone يحصلون على reserve ammo +10%
```

## 10. نظام التطوير Progression

### الحساب والـ Hero

- Account Level: 1–100، يفتح cosmetics وloadout slots.
- Hero Level: 1–50 لكل شخصية، يفتح skill points وvoice lines.
- Weapon Level: 1–30 لكل سلاح، يفتح Gunsmith attachments.
- لا توجد stats دائمة تجعل اللاعب الأقوى في matchmaking المصنف.

### XP Curve

المعادلة المستهدفة:

```text
XP_to_next_level(n) = round(600 + 180*n + 35*n²)
```

| المستوى | XP للمستوى التالي | XP تراكمي تقريبي |
|---:|---:|---:|
| 1 | 815 | 0 |
| 2 | 1,010 | 815 |
| 3 | 1,275 | 1,825 |
| 5 | 2,375 | 4,820 |
| 10 | 5,750 | 24,000 |
| 20 | 18,600 | 100,000 |
| 30 | 32,100 | 280,000 |
| 40 | 49,400 | 690,000 |
| 50 | 78,100 | 1,250,000 |

> القيم التراكمية تستخدم للتخطيط، وتُضبط بعد telemetry الفعلية.

### Early Wins

- أول match completion يمنح 500 XP.
- أول kill/assist في كل match يمنح 150 XP إضافية.
- أول فوز أسبوعي يمنح skill token تجميلي/تقدمي غير قتالي.
- أول 3 مستويات تفتح loadout slot، basic attachment وHero trial.

### Skill Points

- نقطة عند كل level فردي، ونقطتان عند كل level خامس.
- كل فرع يحتاج prerequisite خطي؛ لا يمكن فتح كل القدرات في مباراة واحدة.
- إعادة توزيع مجانية خارج المباراة، وبـ Credits رمزية داخل season؛ لا شراء مباشر للنقاط.

## 11. التخصيص Monetization

Cosmetics فقط:

- Hero skins: silhouette لا يتغير، hitbox لا يتغير.
- Weapon skins: لا تغير recoil/ADS أو muzzle visibility.
- Finishers: تُستخدم فقط في شاشة النتيجة أو elimination آمن.
- Banners، emblems، charms، trails، announcer voices.
- Battle Pass مجاني + مدفوع تجميلي فقط.

---

# القسم الرابع — الأسلحة والمرفقات

## 12. قواعد الأسلحة

الإحصاءات الأساسية على 100 HP و0 armor، مع damage falloff linear بين minimum range وmaximum range.

| السلاح | الفئة | ضرر الجسم | RPM | الدقة | الارتداد | المخزن | تلقيم | المدى الفعال |
|---|---|---:|---:|---:|---:|---:|---:|---|
| AR-4 | AR | 26 | 620 | 78 | 42 | 30 | 2.05s | 26–68m |
| AR-7 | AR | 31 | 540 | 66 | 58 | 25 | 2.35s | 30–75m |
| SMG-9 | SMG | 17 | 900 | 70 | 38 | 32 | 1.70s | 16–44m |
| SMG-5 | SMG | 14 | 1100 | 61 | 52 | 25 | 1.85s | 12–32m |
| DMR-7 | DMR | 52 | 190 | 91 | 66 | 10 | 2.55s | 50–120m |
| SR-9 | Sniper | 108 | 45 | 96 | 82 | 5 | 3.10s | 90–220m |
| SG-12 | Shotgun | 12×8 pellets | 80 | 48 | 72 | 6 | 2.70s | 4–14m |
| P-12 | Pistol | 24 | 400 | 75 | 36 | 15 | 1.45s | 14–40m |
| P-20 | Pistol | 18 | 720 | 58 | 44 | 20 | 1.60s | 12–30m |
| LMG-6 | LMG | 24 | 700 | 57 | 63 | 75 | 4.20s | 34–90m |
| CX-4 | Melee | 70 swing | 65 | — | — | — | 1.20s recovery | 1.8m |

### TTK targets

| المسافة | الهدف |
|---|---|
| 0–15m | 0.20–0.35s للـ primary، shotgun حسب pellet hit |
| 15–40m | 0.28–0.45s |
| 40–80m | 0.35–0.60s |
| 80–150m | 0.00s فقط للـ sniper headshot، غير ذلك ≤0.90s |

## 13. Gunsmith

### فتح المرفقات

- كل سلاح مستوى 1–30.
- مرفق واحد على الأقل كل مستويين في المسار الأساسي.
- المستويات 10/20 تفتح تحديات mastery لا إحصاءات مجانية.
- المستوى 30 يفتح Apex Attachment له trade-off خاص.

### خانات المرفقات

| الخانة | أمثلة | مبدأ المقايضة |
|---|---|---|
| Optic | Iron، Red Dot، 2×، 4×، 6× | zoom مقابل ADS speed |
| Barrel | Suppressor، Long، Compensator | stealth/range مقابل damage/handling |
| Muzzle | Flash Hider، Brake | visibility/recoil مقابل sound |
| Magazine | Fast، Extended، Drum | reload/mag مقابل movement/weight |
| Underbarrel | Vertical، Angled، Laser | recoil/accuracy مقابل hipfire/ADS |
| Stock | Light، Heavy، Tactical | movement مقابل stability |
| Special | Apex | هوية عالية مع كلفة واضحة |

### جدول مرفقات أساسي

| المرفق | التأثير الإيجابي | المقابل السلبي |
|---|---|---|
| Red Dot | ADS spread -18% | zoom -0.05 أو ADS time +3% |
| 2× Optic | دقة المسافة +12% | ADS time +10%، peripheral vision أقل |
| Long Barrel | max range +14% | sprint-to-fire +8%، recoil pitch +6% |
| Suppressor | muzzle flash -65%، sound radius -30% | close damage -4%، bullet velocity -5% |
| Compensator | vertical recoil -16% | sound radius +20% |
| Extended Mag | mag +8 | reload time +12%، swap time +5% |
| Fast Mag | reload time -22% | mag لا يزيد، reserve pickup -5% |
| Vertical Grip | vertical recoil -24% | horizontal sway +5% |
| Angled Grip | horizontal recoil -22% | ADS spread +6% |
| Light Stock | sprint-to-fire -12% | recoil recovery -8% |
| Heavy Stock | recoil recovery +18% | movement speed -4% |
| Apex: Stabilizer | أول 5 طلقات recoil -35% | بعد الطلقة الخامسة spread +18% |

### شجرة تطوير السلاح

```text
Weapon Level 1
├─ Lv 2: Optic trial
├─ Lv 4: Barrel branch
├─ Lv 6: Magazine branch
├─ Lv 8: Underbarrel branch
├─ Lv 10: Mastery challenge I
├─ Lv 12: Stock branch
├─ Lv 14: Optic advanced
├─ Lv 16: Barrel advanced
├─ Lv 18: Magazine advanced
├─ Lv 20: Mastery challenge II
├─ Lv 22: Underbarrel advanced
├─ Lv 24: Stock advanced
├─ Lv 26: Cosmetic blueprint
├─ Lv 28: Weapon badge / inspect animation
└─ Lv 30: Apex Attachment
```

## 14. التوازن

### ميزانية التوازن

كل weapon budget = 100 نقطة موزعة على:

```text
Damage 25% + Fire Rate 15% + Accuracy 15% + Range 15%
+ Handling 12% + Magazine 8% + Mobility 5% + Utility 5%
```

قواعد آلية:

1. لا سلاح يفوز في TTK والrange والhandling معاً.
2. body-shot kill عادة ≤ 8 طلقات للـ primaries باستثناء sniper/shotgun.
3. headshot multiplier بين 1.5× و2.5×.
4. كل Apex Attachment يضيف قوة ويأخذ قيمة من stat آخر.
5. كل patch يُختبر على 10th/50th/90th percentile accuracy، لا على dummy فقط.

---

# القسم الخامس — أوضاع اللعب

## 15. Battle Royale

### مواصفات المباراة

| البند | القيمة |
|---|---|
| اللاعبين | 60: Solo/Duo/Squad |
| المدة | 18–22 دقيقة |
| الخريطة | 2×2 كم، 8–10 POIs |
| drop | طائرة/مسار اختياري، هبوط حر، glide محدود |
| الدائرة | 5 مراحل، preview قبل التقلص |
| الفوز | آخر لاعب/فريق على قيد الحياة |
| revive | Duo/Squad فقط، time window محدود |

### الدائرة والعاصفة

| المرحلة | زمن الإغلاق | نصف القطر النسبي | ضرر storm/s |
|---:|---:|---:|---:|
| 1 | 3:00 | 100% → 72% | 2 |
| 2 | 2:45 | 72% → 50% | 4 |
| 3 | 2:30 | 50% → 32% | 7 |
| 4 | 2:00 | 32% → 16% | 11 |
| 5 | 1:30 | 16% → 6% | 18 |

خوارزمية المركز الجديد:

```text
newCenter = randomPointInside(oldCircle, oldRadius - newRadius)
newRadius = oldRadius * phaseMultiplier
stormDamage = baseDamage[phase] * (1 + armorMitigationFactor)
```

### Loot

| الندرة | الاحتمال الأرضي | المحتوى |
|---|---:|---|
| Common | 55% | Pistol/SMG، ammo، armor 1، heal صغير |
| Rare | 28% | AR/DMR، attachment 1–2، armor 2 |
| Epic | 13% | weapon blueprint، attachment متقدم، armor 3 |
| Legendary | 4% | Apex-compatible weapon، special item، airdrop |

قواعد loot:

- لا يظهر سلاح خارج فئة اللاعب الأولية بلا ammo معه.
- كل POI له loot seed ثابت مع variation.
- Airdrop يعلن صوته وموضعه للجميع.
- لا يُسمح لـ squad واحدة باحتكار كل high-tier loot في أول 60 ثانية.

## 16. Team Deathmatch

| البند | القيمة |
|---|---|
| الفريق | 5v5 أو 6v6 |
| المدة | 10 دقائق |
| الهدف | 50 kill أو أعلى score عند النهاية |
| respawn | 3–5 نقاط آمنة، anti-spawn trap |
| loadout | preset أو custom gunsmith |
| abilities | cooldown/ultimate charge بالـ damage/assist |

Spawn rules:

- لا spawn إذا كان enemy يملك line of sight مباشر خلال 18m.
- spawn score يأخذ أقرب threats وteammate density.
- بعد موت اللاعب 3 مرات من نفس lane، يرفع النظام أولوية flank spawn.

## 17. أوضاع إضافية

- **Domination:** ثلاث نقاط A/B/C، score عبر الزمن، دورة 8 دقائق.
- **Gun Game:** kill يبدل السلاح؛ ability cooldown ثابت أو معطل.
- **Ranked BR:** RP حسب placement، kills، assists، strength of lobby.
- **Extraction Drill:** prototype مستقبلي لجمع data وعودة حية.

---

# القسم السادس — تصميم الخرائط

## 18. خريطة BR الرئيسية: The Meridian Belt

### تقسيم 2×2 كم

```text
┌───────────────┬───────────────┬───────────────┐
│ Cloud Forest  │ Relay Spire   │ Glass District│
│ low loot      │ high risk     │ vertical      │
├───────────────┼───────────────┼───────────────┤
│ Red Quarry    │ Old Market    │ Blackline     │
│ long sight    │ close combat  │ military loot │
├───────────────┼───────────────┼───────────────┤
│ Floodplain    │ Port Meridian │ Solar Ridge   │
│ water flank   │ balanced      │ exposed rotate│
└───────────────┴───────────────┴───────────────┘
```

### تدفق اللاعبين

- high-value POIs موزعة على الأطراف: Blackline، Relay، Solar Ridge.
- الوسط يقدم loot متوسطاً وطرق دوران قصيرة، لكنه ليس أفضل بداية دائماً.
- مسارات آمنة: أنفاق، قنوات، مباني متصلة.
- مسارات عالية المخاطر: جسور، أسطح، quarry ridges.
- كل POI له مخرجان على الأقل، ومخرج طوارئ واحد قابل للكسر.

### Prototype flow

```text
Drop Plane
   ↓
High-value edge POI ── loot ── rotate via safe tunnel
   │                         ↘ contest central market
   └─ risk/reward ───────────→ next circle preview
                                ↓
                       final Relay/Market fight
```

## 19. خرائط TDM

### Drydock 9

```text
Spawn A === Crane Lane === Spawn B
   \       Center Dock       /
    == Warehouse Lane =======
```

- Lane 1: طويل، AR/DMR.
- Lane 2: متوسط، cover متدرج.
- Lane 3: ضيق، SMG/shotgun.
- catwalks تمنح elevation لا invulnerability.

### Night Bazaar

- lane مركزي داخل السوق.
- flank عبر أسطح وممرات خلفية.
- cover قابل للتدمير جزئياً.
- إضاءة neon مقروءة لا تخفي team color.

### Orbital Relay

- central zero-gravity lift كمسار عمودي.
- airlock lane طويل مع doors قابلة للإغلاق.
- side rooms للـ support/recon.
- لا يوجد head-glitch دائم؛ كل cover له counter-angle.

---

# القسم السابع — الجرافيك والتقنية

## 20. لماذا Unreal Engine 5

UE5 هو target الإنتاج للأسباب التالية:

- **Nanite:** geometry كثيف للبيئة مع إدارة LOD تلقائية، مع استثناءات للأصول المتحركة وmobile.
- **Lumen:** إضاءة عالمية وreflections عالية الجودة على PC؛ mobile يستخدم baked/forward fallback.
- **Replication/Gameplay Framework:** أساس مناسب لـ Dedicated Server وclient prediction.
- **World Partition:** تقسيم خريطة 2×2 كم وstreaming حسب اللاعب.
- **MetaSounds/Niagara:** نظام صوت وVFX قابل للضبط وprofiling.

النسخة الحالية في Three.js لا تُهدم؛ تُستخدم كـ UX sandbox وbalance lab حتى يثبت التصميم قبل تكلفة نقل الفن.

## 21. Art Pipeline

```text
Concept → Blockout → High Poly (ZBrush/Blender)
        → Low Poly/Retopo → UV → Bake
        → Substance Painter PBR → LODs
        → Unreal Material Instance → VFX/Audio
        → Performance Review → Ship
```

### إنتاج سلاح واحد

1. Concept sheet بثلاث زوايا وsilhouette اختبارية.
2. High-poly: bevels، panel breaks، wear zones.
3. Low-poly: target tris budget 25–45k للـ first-person weapon.
4. UV: texel density ثابت، mirror فقط للأجزاء غير الفريدة.
5. Bake: normal، AO، curvature، thickness.
6. Substance: base metal، roughness breakup، decals، dirt masks.
7. UE5: material instance + animation sockets + muzzle/optic.
8. LOD0/LOD1/LOD2 + first-person/third-person variants.
9. مراجعة readability من 5m/15m/40m.

## 22. الأداء

### الأهداف

| المنصة | الهدف |
|---|---|
| PC متوسط | 60 FPS، frame time ≤16.6ms |
| PC منخفض | 45 FPS قابل للثبات |
| Mobile حديث | 30 FPS، frame time ≤33.3ms |
| Server TDM | 60Hz simulation target |
| Server BR | 30Hz simulation target |

### تقنيات

- LOD/HLOD، Nanite حيث يصلح.
- World Partition + data layers.
- Frustum/occlusion culling.
- Texture streaming وvirtual textures بحذر.
- Instanced meshes للحاويات، النباتات، props المتكررة.
- VFX budgets لكل ability وweapon.
- عدم تشغيل tick لكل actor؛ استخدام timers/events.
- GPU/CPU budgets مقاسة في أسوأ POI لا في المشهد الفارغ.

## 23. الشبكة Netcode

```text
Client input (local)
      ↓ prediction
Dedicated Server (authority)
      ├─ movement validation
      ├─ weapon fire validation
      ├─ lag compensation history
      ├─ damage/loot/zone truth
      └─ snapshot replication
      ↓ reconciliation/interpolation
Other clients
```

### القواعد

- TDM: server tick 60Hz، snapshot 20–30Hz.
- BR: server tick 30Hz، snapshot 10–20Hz حسب actor importance.
- الحركة: client prediction + server reconciliation.
- الرمي: client يرسل input + timestamp + shot sequence؛ server يعيد rewind حتى 200ms.
- hitscan لا يُحسم client-side.
- loot/zone/ability cooldown كلها server authoritative.
- interest management يخفض replication للأعداء البعيدين.

### مكافحة الغش الأولية

- لا تثق في client damage/ammo/position النهائي.
- تحقق من fire rate، magazine، line of sight وmovement envelope.
- rate limits للـ RPC.
- telemetry للـ impossible accuracy، wall hits، teleport وrapid input.
- ban ليس قراراً آلياً من metric واحد؛ يتطلب evidence window.

---

# القسم الثامن — خطة التطوير الزمنية

## 24. Roadmap 12 شهراً

| المرحلة | الفترة | المخرجات | الجهد التقريبي | معيار المرور |
|---|---|---|---:|---|
| 1. Prototype | شهر 1–2 | Hero واحد، سلاح واحد، TDM صغير، greybox | 8–12 أسابيع-شخص | 20 لاعباً يكررون المباراة وD1 fun score ≥7/10 |
| 2. Foundation | شهر 3–4 | 3 Heroes، 5 أسلحة، Gunsmith أولي، BR blockout | 14–18 أسابيع-شخص | TDM 5v5 مستقر + loot loop قابل للتكرار |
| 3. Content Alpha | شهر 5–6 | 6 Heroes، 10+ أسلحة، BR 2×2، 3 خرائط TDM | 22–30 أسابيع-شخص | BR bot match من drop إلى win دون blocker |
| 4. Polish | شهر 7–8 | VFX، audio، animations، skins، optimization | 20–28 أسابيع-شخص | 60 FPS PC متوسط، 30 FPS mobile target |
| 5. Closed Beta | شهر 9–10 | 100–500 لاعب، backend، telemetry، balance | 18–24 أسابيع-شخص | crash-free session ≥99%، matchmaking success ≥95% |
| 6. Soft Launch | شهر 11–12 | منطقة واحدة، live ops، support، launch build | 18–24 أسابيع-شخص | D1 retention وlatency وstore approval targets |

### فريق مرجعي

- 1 Producer
- 1 Lead Designer + 2 gameplay designers
- 1 Technical Director + 3 gameplay/network engineers
- 1–2 environment artists
- 2 character/weapon artists
- 1 animator/technical animator
- 1 VFX artist
- 1 UI/UX designer
- 1 audio designer
- 2 QA/automation
- Outsource support حسب الحاجة

## 25. بوابات الجودة Quality Gates

### Gate 1 — Fun

- TDM round قابل للإعادة 5 مرات.
- time-to-first-fun أقل من 90s.
- لا spawn trap متكرر.

### Gate 2 — Combat

- hit registration deterministic على dedicated server.
- TTK ضمن النطاقات.
- كل Hero له counter واضح.

### Gate 3 — Content

- كل POI له identity بصري ولعب مختلف.
- لا duplicate loot path يقتل التنوع.
- LOD/VFX budgets مفعلة.

### Gate 4 — Beta

- crash-free ≥99%.
- p95 latency إقليمي ≤100ms.
- لا P0/P1 bugs مفتوحة.
- analytics consent وprivacy جاهزان.

## 26. مخاطر المشروع وتخفيفها

| الخطر | الاحتمال | الأثر | التخفيف |
|---|---|---|---|
| scope أكبر من الفريق | مرتفع | تأخير | TDM first، content gates، لا 60 لاعباً مبكراً |
| مشاكل replication | مرتفع | تجربة غير عادلة | dedicated server prototype في الشهر 2 |
| ضعف performance | متوسط | فشل mobile | budgets من أول greybox، لا تأجيل optimization |
| Hero meta مهيمن | مرتفع | churn | counter matrix وweekly telemetry |
| نقص المحتوى | متوسط | retention ضعيف | modular POIs وweapon blueprints |
| تكاليف backend | متوسط | burn rate | region caps، autoscaling، bot fill عند الحاجة |

---

# القسم التاسع — معايير القياس والتحليل

## 27. KPIs

| المقياس | الهدف الأولي |
|---|---:|
| Match completion | ≥75% |
| D1 retention closed beta | ≥35% |
| D7 retention | ≥15% |
| TDM queue time | ≤45s |
| BR match start | ≤90s |
| Crash-free sessions | ≥99% |
| Hit registration complaints | <2% sessions |
| Cosmetic attach rate | >25% من اللاعبين النشطين |

## 28. Telemetry المطلوبة

- weapon pick rate وkill share حسب range.
- Hero pick/win/ban وability damage/denial.
- POI drop rate، survival time، first engagement time.
- zone deaths، rotations، revive success.
- spawn deaths خلال 10s.
- frame time، memory، bandwidth، packet loss.

---

# ملاحق

## Appendix A — تعريف Prototype القابل للتحويل

النموذج الحالي في المشروع يطبق الجزء المحلي من الرؤية:

- modes وBR zone تجريبي.
- operators وXP وattachments.
- smoke tests وunit tests.

النقل إلى UE5 يكون على مراحل، مع الحفاظ على:

1. بيانات الأسلحة كـ Data Assets.
2. mode configs كـ Primary Data Assets.
3. abilities كـ Gameplay Ability System أو طبقة خفيفة فوقها.
4. zone server actor.
5. telemetry events متطابقة بين prototype وproduction.

## Appendix B — Definition of Done لنظام جديد

النظام لا يعتبر مكتملاً إلا إذا كان:

- قابلاً للعب من الواجهة الحقيقية.
- له حالة فشل واضحة.
- يعمل محلياً وعلى dedicated server حسب نطاقه.
- له automated test أو smoke check.
- له telemetry event.
- له budget للأداء.
- موثق في data/schema وGDD.

## Appendix C — ما هو خارج هذا الإصدار

لن ندعي اكتمال ما يلي قبل وجود dedicated server وتجارب حقيقية:

- 60 لاعباً حقيقياً.
- matchmaking عالمي.
- ranked integrity.
- anti-cheat production.
- متجر/مدفوعات.
- certification للمتاجر.

## Appendix D — GDD Supplement v1.1

التفاصيل التنفيذية للصوت، UX/UI، الاقتصاد، الوصول، التعريب، والامتثال موجودة في:

[`GDD_SUPPLEMENT_v1.1.md`](./GDD_SUPPLEMENT_v1.1.md)

الأقسام الجديدة تكمل هذا المستند ولا تغير قراراً أساسياً في الحلقة أو التوازن دون telemetry ومراجعة إنتاجية.

## Appendix E — Production documentation index

| المجال | المستند |
|---|---|
| Audio / UX / Economy / Accessibility / Localization / Legal | [`GDD_SUPPLEMENT_v1.1.md`](./GDD_SUPPLEMENT_v1.1.md) |
| Playtest and telemetry | [`PLAYTEST_PLAN_v1.md`](./PLAYTEST_PLAN_v1.md) |
| UE5 migration | [`UE5_MIGRATION_GUIDE.md`](./UE5_MIGRATION_GUIDE.md) |
| Dedicated servers and cost model | [`SERVER_ARCHITECTURE.md`](./SERVER_ARCHITECTURE.md) |
| C++ prototype review | [`prototypes/REVIEW_AND_IMPROVEMENTS.md`](./prototypes/REVIEW_AND_IMPROVEMENTS.md) |
