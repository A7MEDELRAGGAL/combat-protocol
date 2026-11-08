# Combat Protocol: Frontline — Game Scenario Bible v1.0

**الحالة:** Canonical pre-production bible
**تاريخ الإصدار:** 24 أكتوبر 2026
**النطاق:** الهوية السردية، العالم، الفصائل، الأبطال، الحملة، الأطوار، UX، الصوت، التعريب، والاحتياجات الإنتاجية.

هذا المستند هو المرجع السردي والإنتاجي الموحد للعبة. أي اسم أو فصيل أو حدث جديد يجب أن ينسجم معه أو يضيف قراراً موثقاً في نسخة لاحقة. المشروع الحالي ما زال Prototype محلياً بـ Three.js/WebGL؛ هذا المستند لا يدعي وجود Multiplayer أو UE5 جاهز.

---

## 1. الرؤية المختصرة

### الجملة التعريفية

> في ممر طاقة ساحلي أنهكته الكوارث المناخية، يقاتل عملاء مستقلون للسيطرة على بروتوكول طوارئ اسمه FRONTLINE؛ نظامٌ يقرر أي الأحياء تستحق الكهرباء والماء وأيها يمكن التضحية به.

### هوية التجربة

- **النوع:** FPS تكتيكي سريع، أصلي، قائم على الحركة والقراءة المكانية.
- **النبرة:** احتراف ميداني هادئ تحت ضغط، لا استعراض عسكري أجوف ولا أبطال خارقون.
- **الموضوع:** من يملك حق اتخاذ القرار عندما تصبح الموارد أقل من احتياجات الناس؟
- **الركائز:** حركة دقيقة، سلاح واضح الدور، أهداف مادية في العالم، قرارات لها أثر، وواجهة Industrial Precision.
- **قاعدة الأصالة:** كل الأسماء والشخصيات والخرائط والأصوات والرموز أصلية ولا تستخدم أصولاً أو علامات من ألعاب أخرى.

---

## 2. العالم والزمن

### Meridian Belt

Meridian Belt سلسلة موانئ ومحطات تحلية وطاقة مدّية ومراكز اتصالات على ساحل متضرر من ارتفاع البحر والعواصف. بعد سلسلة أعطال تسمى **Breakwater Failure**، فُعّل نظام إدارة طوارئ مركزي اسمه **FRONTLINE**.

في البداية أنقذ النظام المدن الكبرى من الانهيار. مع الوقت بدأ يحسب البشر كـ "قيمة خدمة"، ويقطع الماء والكهرباء والاتصالات عن الأحياء الأقل أولوية كي يحافظ على العقد الاستراتيجية.

### الخط الزمني القانوني

1. **قبل الانهيار:** بناء شبكة الطاقة والمضخات والمرحلات المحلية.
2. **Breakwater Failure:** عاصفة مركبة تعطل الموانئ وتكشف هشاشة الشبكة.
3. **تفعيل FRONTLINE:** تحويل القرار من مجالس محلية إلى خوارزمية طوارئ.
4. **الأحياء الصامتة:** انقطاعات انتقائية بلا تفسير، ثم اختفاء سجلاتها من الشبكة العامة.
5. **Relay 07:** يكتشف مهندسو الميناء أن الانقطاع متعمد وليس عطلاً.
6. **الحاضر:** تتنافس أربع قوى على مفتاح الجذر قبل أن يعيد FRONTLINE ترتيب المنطقة بالكامل.

### قاعدة الخيال العلمي

FRONTLINE ليس ذكاءً شريراً واعياً. هو نظام تحسين طوارئ يطبق أهدافاً بشرية قديمة بلا سياق أخلاقي. الخطر يأتي من القرارات التي صممه البشر ليتخذها، ومن الشركات والفصائل التي تريد امتلاك الجذر.

---

## 3. الفصائل

| الفصيل | العقيدة | هدف الموسم الأول | الهوية البصرية والصوتية |
|---|---|---|---|
| **Continuity Directorate** | الحفاظ على الشبكة المركزية بأي تكلفة | تأمين FRONTLINE ومنع تفككه | Amber/white، أوامر مختصرة، صفارات إنذار وإجراءات رسمية |
| **Freeport Assembly** | إعادة القرار إلى المجتمعات المحلية | إعادة فتح الأحياء المعزولة | Teal/green، إصلاحات مرتجلة، أصوات بشرية ونداءات مدنية |
| **Helix Grid Consortium** | تحويل بنية الطوارئ إلى ملكية تقنية | استخراج نواة FRONTLINE وبيعها | Violet/black، أجهزة مصقولة، اتصالات مضغوطة ونظيفة |
| **FRONTLINE Network** | حماية العقد ذات أعلى قيمة تشغيلية | استمرار الشبكة ولو على حساب مناطق كاملة | صوت نظام محايد، إعلانات آلية، همهمة محولات وتشويش خرائط |

اللاعبون **عملاء مستقلون** يعملون عبر عقود، لذلك لا يُقفل الـ Operator على فصيل واحد. الانتماء يظهر في الخلفية والحوارات والجوائز لا في منع تشكيل الفرق.

---

## 4. دور اللاعب

اللاعب عضو في **Frontline Response Compact**، شبكة صغيرة من متخصصين يقبلون عقوداً لا تستطيع أي جهة رسمية الاعتراف بها. كل عملية تتكون من:

1. **Brief:** هدف واحد واضح وسؤال أخلاقي أو تكتيكي.
2. **Ingress:** دخول إلى مكان له تاريخ ووظيفة مفهومة.
3. **Contact:** أول احتكاك خلال 60–90 ثانية للاعب المتمرس.
4. **Objective pressure:** إصلاح، اختراق، حماية، استخراج، أو تعطيل تحت ضغط.
5. **Revelation:** معلومة تغيّر فهم اللاعب للصراع.
6. **Extraction:** انتقال إجباري أو طريق يتغير.
7. **Debrief:** نتيجة، XP، استجابة فصيل، وخطوة تالية.

القتل وسيلة لفتح الطريق، وليس الهدف السردي الوحيد.

---

## 5. الحملة — Season 0: Blackout

### Act I — Blackout

#### 01 — First Light / Port Meridian

- **وظيفة:** تعليم الحركة والسلاح والأهداف.
- **الهدف:** الوصول إلى Relay 07، استخراج maintenance key، تثبيت المرحل، ثم الخروج.
- **الاكتشاف:** FRONTLINE قطع الطاقة عن Floodplain عمداً.
- **النهاية:** سؤال القائد: "من قرر أن هذا الحي يمكن إطفاؤه؟"

#### 02 — Cutline / Drydock 9

- **الهدف:** إعادة توجيه رافعة وتحويل قافلة طاقة.
- **الصراع:** Directorate يريد حماية الشحنة؛ Assembly يريد استخدامها لإعادة ضخ المياه.
- **النظام الجديد:** أهداف متوازية ومسارات cover مختلفة.

#### 03 — Market Static / Old Market

- **الهدف:** استخراج مهندس اتصالات قبل حذف مفاتيحه.
- **النبرة:** قتال قريب، shutters، إعلانات مدنية وانقطاع إشارات.
- **النظام الجديد:** إنقاذ شخصية مدنية وقراءة subtitles وسط التشويش.

### Act II — The Cost of Light

#### 04 — High Water / Floodplain

- **الهدف:** حماية محطات الضخ مدة كافية لإجلاء حي.
- **القرار:** تأمين Relay أو إبقاء ممر إخلاء مفتوحاً.
- **النظام الجديد:** hazard متغير، ماء، ومؤقت إخلاء.

#### 05 — Blackline Facility

- **الهدف:** اختراق منشأة Helix وسرقة نسخة من نموذج الأولويات.
- **الاكتشاف:** النظام صُمم منذ البداية لتصنيف أحياء كاملة كـ acceptable loss.

### Act III — Root Access

#### 06 — Relay Spire

- **الهدف:** السيطرة على الجذر أو حمايته أو كشف سجل قراراته.
- **الإصدار الأول:** نهاية لعب واحدة canonical، مع اختلاف نص debrief والـ cosmetics حسب الاختيارات.
- **المواسم اللاحقة:** يمكن فتح نهايات متفرعة بعد ثبات المحتوى والـ telemetry.

---

## 6. أول مهمة قابلة للتنفيذ: First Light

مدة المهمة المحلية المستهدفة: **8–10 دقائق**.

### تدفق اللعب

1. Spawn عند بوابة Port Meridian.
2. عبور حارات الحاويات إلى service kiosk.
3. استعادة maintenance key.
4. الوصول إلى Relay 07.
5. تثبيت المرحل لمدة 20–30 ثانية مع موجة ضغط.
6. استقبال كشف FRONTLINE عن Floodplain.
7. حمل data module إلى extraction قرب crane lane.
8. إنهاء المهمة وفتح debrief.

### حالات المهمة

```text
briefing
  → ingress
  → recover_key
  → secure_relay
  → hold_relay
  → extract
  → success
```

الفشل الوحيد في النسخة الأولى هو موت اللاعب أو انتهاء objective hold قبل التثبيت. Restart يعيد كل الحالة والـ spawns والـ narrative flags بشكل deterministic.

---

## 7. الـ Operators القانونيون

| ID | الاسم | الخلفية | الدور | القدرة الأساسية |
|---|---|---|---|---|
| `rook` | Rook | قائد اقتحام سابق في Directorate فقد ثقته بالقيادة | Assault | Breach Charge يفتح cover ويعاقب التمركز |
| `bulwark` | Bulwark | مهندس إنشائي من Freeport | Defense | Deployable Cover وDefensive Field |
| `sable` | Sable | مسعفة من Floodplain | Support | Healing Drone وSmoke |
| `wisp` | Wisp | سارق إشارات سابق لدى Helix | Recon | Scout Dart وReturn Beacon |
| `ember` | Ember | مختصة مخاطر صناعية | Control | Thermite Line وSlowing Flare |
| `atlas` | Atlas | فني صيانة يستطيع التخاطب مع FRONTLINE | Engineer | Micro-Turret وRepair Beam |

الـ IDs القديمة في Prototype (`vanguard`, `scout`, `medic`) تبقى migration aliases فقط:

- `vanguard → rook`
- `scout → wisp`
- `medic → sable`

لا نعلن abilities كاملة قبل تنفيذ input/cooldown/telemetry/Counterplay لها.

---

## 8. الأطوار وعلاقتها بالسرد

| الطور الحالي | المعنى السردي | قرار المنتج |
|---|---|---|
| Deathmatch | Combat Drill داخل شبكة تدريب | يبقى طور onboarding/debug |
| Team Deathmatch | عقد live-fire بين فرق مستقلة | يبقى هدف الشبكة الأول، 5v5 لاحقاً |
| Survival | Hold the Relay ضد موجات ضغط | أفضل أساس لإعادة لعب PvE |
| Battle Royale | Meridian Collapse بعد broadcast طوارئ | يظل BR sandbox حتى وجود Dedicated Server |
| Frontline Ops | مهام First Light وبقية الحملة | أول إضافة سردية مؤثرة |

### حدود الإصدار الحالي

- لا نسمي النسخة الحالية 60-player BR.
- لا ندعي 5v5 حقيقياً قبل وجود فرق وscoreboard وrespawn authority.
- لا نضيف paid economy أو loot boxes.
- الـ progression المحلي prototype-only حتى وجود server ledger.

---

## 9. الهوية المرئية والواجهات

### Industrial Precision

- Charcoal داكن مع Amber للحالة التشغيلية، Cyan للمعلومات، Red للخطر، Green للتأكيد.
- نصوص قصيرة تشبه terminal fieldnet.
- objective strip دائم، لا يعتمد على اللون وحده.
- كل معلومة حرجة تظهر عبر اثنين على الأقل من: نص، أيقونة، لون، صوت.
- العربية RTL هي locale الأول، مع إبقاء IDs وtimecodes وkeybinds LTR.

### واجهات يجب إضافتها

1. Briefing قبل First Light.
2. Objective state وhold progress.
3. Operator ability + cooldown.
4. Subtitle channel مع source faction.
5. Debrief يوضح XP وCredits المكتسبة.
6. اختيار اللغة مع fallback للإنجليزية.

---

## 10. الصوت والسرد المسموع

### قنوات الصوت

- **Directorate:** radio dry، clipped، قليل الصدى.
- **Assembly:** أصوات بشرية متداخلة، callouts محلية.
- **Helix:** telemetry نظيف، confirmation tones.
- **FRONTLINE:** صوت نظام محايد مع PA announcements.

### أحداث صوتية أولية

```text
vo.mission.first_light.brief
vo.mission.first_light.relay_online
vo.mission.first_light.extraction
vo.operator.rook.low_health
vo.operator.rook.ability_breach
ui.objective.started
ui.objective.completed
ui.warning.zone
```

النسخة الحالية تستخدم WebAudio procedural كـ fallback Prototype. يجب لاحقاً إنشاء event map لـ Wwise/FMOD، وإضافة subtitles لكل VO، وducking للموسيقى عند النداءات الحرجة.

---

## 11. التعريب والوصول

### اللغات المخططة

1. العربية RTL
2. الإنجليزية
3. الفرنسية
4. الإسبانية
5. التركية

### قواعد إلزامية

- لا نصوص إنتاجية جديدة داخل منطق gameplay دون key.
- fallback chain: locale المطلوب → الإنجليزية → key واضح.
- الأرقام وIDs والوقت لا تنقلب مع RTL.
- دعم reduced motion، حجم subtitles، colorblind palettes، remapping، touch scaling.
- كل objective يجب فهمه مع الصوت مغلقاً.

---

## 12. الاقتصاد والتقدم

- Cosmetics-only.
- لا Pay-to-Win.
- لا paid loot boxes في Season 0.
- XP وCredits محليان في Prototype فقط.
- كل match settlement يجب أن يكون idempotent بمفتاح match ID.
- أي backend لاحقاً يستخدم ledger server-authoritative مع audit trail.

### إيقاع التقدم الأولي

- kill: XP صغير ومحدد.
- mission completion: مكافأة أكبر مرة واحدة.
- win: bonus واضح.
- failure: لا completion XP، لكن يمكن الاحتفاظ بـ combat XP حسب القرار النهائي.

---

## 13. الـ telemetry والاختبار

الأحداث المحلية الأساسية:

```text
mode_selected
match_started
objective_started
objective_completed
shot_fired
shot_hit
reload_started
damage_taken
kill_confirmed
player_died
player_respawned
match_ended
```

كل حدث يحمل `schemaVersion`, `sessionId`, `matchId`, `sequence`, `timestamp` وpayload محدوداً. لا نسجل mouse paths أو credentials أو بيانات شخصية.

### بوابة الجودة

- unit tests لكل contract وsettlement وtelemetry.
- smoke flow من الواجهة الحقيقية.
- لا console errors.
- حفظ reset deterministic.
- تشغيل `npm test` و`npm run verify` قبل كل handoff.

---

## 14. الاحتياجات الناقصة مرتبة

### P0 — قابل للتنفيذ داخل Prototype

1. First Light objective state machine.
2. mode lifecycle contract وrespawn حسب الطور.
3. idempotent match settlement.
4. local telemetry.
5. locale keys للعربية والإنجليزية.
6. إصلاح attachment slot uniqueness.
7. توحيد result/debrief وXP/credits.

### P1 — بعد ثبات الحلقة المحلية

1. authored Port Meridian greybox للـ Relay 07 وExtraction.
2. Rook ability مع cooldown وcounterplay.
3. faction radio + subtitle channel.
4. playtest event export.
5. TDM scoreboard وplayer respawn الاختباري.

### P2 — يحتاج UE5/backend

1. dedicated server authority.
2. lag compensation وrewind.
3. server economy ledger.
4. anti-cheat، matchmaking، reconnect.
5. 60-player BR.

---

## 15. تعريف النجاح لهذا الإصدار

يُعتبر First Light جاهزاً للـ playtest عندما:

- يبدأ اللاعب المهمة من الواجهة في ثلاث نقرات أو أقل.
- يفهم الهدف التالي دون moderator.
- يبدأ أول contact خلال 90 ثانية.
- يتغير objective state فعلياً، لا النص فقط.
- يمكن إنهاء المهمة أو فشلها وإعادة تشغيلها نظيفاً.
- تُسجل الأحداث المطلوبة محلياً دون network side effects.
- لا تتكسر العربية أو mobile layout.
- يظل `npm test` و`npm run verify` ناجحين.

هذا هو خط العمل التالي؛ لا نضيف محتوى كبيراً قبل أن تصبح هذه الحلقة قابلة للقياس.
