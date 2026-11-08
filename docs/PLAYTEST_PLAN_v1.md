# COMBAT PROTOCOL — Prototype Playtest Plan v1

**الإصدار:** 1.0
**النطاق:** Three.js/WebGL prototype الحالي
**الهدف:** تحويل الانطباعات إلى قرارات قابلة للقياس قبل نقل الأنظمة إلى UE5

## جدول المحتويات

1. [Objectives](#1-objectives)
2. [Participants](#2-participants)
3. [Session scenarios](#3-session-scenarios)
4. [Quantitative metrics](#4-quantitative-metrics)
5. [Qualitative research](#5-qualitative-research)
6. [Instrumentation](#6-instrumentation)
7. [Schedule](#7-schedule)
8. [Analysis and decision rules](#8-analysis-and-decision-rules)
9. [Report template](#9-report-template)
10. [Consent and privacy](#10-consent-and-privacy)

---

## 1. Objectives

### أسئلة القرار

1. هل حلقة **استكشف ← قاتل ← انهب/طوّر** ممتعة خلال أول 30 ثانية؟
2. هل الأسلحة الستة لها أدوار مفهومة أم يوجد weapon dominant؟
3. هل الفرق بين Operators الحاليين واضح ومفيد؟
4. هل الحركة والتصويب والـ ADS يشعران بالاستجابة؟
5. ما أكبر 10 pain points تمنع إعادة اللعب؟

### معايير النجاح الأولية

| السؤال | target |
|---|---:|
| Fun rating بعد أول مباراة | ≥3.8/5 |
| نية إعادة اللعب بعد الجلسة | ≥70% |
| أول kill/assist | ≤5 دقائق للمبتدئ، ≤3 دقائق للمتوسط |
| weapon role recognition | ≥80% يطابقون سلاحين مع الدور الصحيح |
| Operator distinction | ≥75% يذكرون فرقاً وظيفياً بدون prompt |
| movement responsiveness | ≥4/5 من المتوسطين والمحترفين |
| critical bug rate | 0 P0، ≤2 P1 |

---

## 2. Participants

### العينة

20 لاعباً مستهدفاً:

- 5 مبتدئين لم يلعبوا shooter بانتظام.
- 10 لاعبين متوسطين يلعبون FPS أسبوعياً.
- 5 محترفين/تنافسيين لديهم خبرة ranked أو scrims.

يمكن البدء بـ15 عند ضيق الوقت، لكن لا نخلط بين missing data وnegative finding.

### معايير الاختيار

- 16+ أو موافقة ولي الأمر حسب السوق.
- لا علاقة مباشرة بفريق التطوير أو اختبار داخلي.
- مزيج PC specs، display refresh، mouse/controller إن كانت النسخة تدعم ذلك.
- تسجيل input device وFPS class، لا كلمات مرور أو بيانات دفع.

### التجنيد

- Discord communities بإعلان واضح أن المنتج prototype.
- جامعات/نوادي ألعاب محلية.
- مجتمعات FPS تنافسية.
- referral محدود يمنع أن تكون العينة كلها أصدقاء المطورين.

تعويض بسيط معلن مقابل الوقت، وليس مقابل positive feedback.

---

## 3. Session scenarios

كل جلسة تبدأ بـ consent وhardware check وwarm-up قصير.

### Session 1 — Onboarding + TDM (30 دقيقة)

| الزمن | النشاط |
|---:|---|
| 0–3m | consent + controls |
| 3–8m | tutorial: move/look/fire/reload/ADS |
| 8–14m | TDM match 1، بدون شرح إضافي |
| 14–20m | TDM match 2، اشرح loadout فقط |
| 20–27m | TDM match 3، حرية اختيار |
| 27–32m | survey قصير 5 دقائق |

المراقب لا يصحح اللاعب إلا عند blocker أو bug.

### Session 2 — Weapons + Operators (45 دقيقة)

- 5 مباريات TDM قصيرة أو demo rounds.
- كل لاعب يجرب AR، SMG، DMR، SR، LMG، Pistol.
- كل لاعب يجرب Operators الثلاثة المتاحة في prototype.
- تسجيل سبب اختيار السلاح/Operator قبل المباراة وبعدها.
- لا نعرض tier list للمشاركين.

### Session 3 — BR prototype + Gunsmith (45 دقيقة)

- شرح 90 ثانية للدائرة والنهب/المرفقات.
- مباراة BR ضد 20 bot أو simulation أقرب متاح.
- تجربة loadout قبل وبعد attachment.
- سؤال forced trade-off: هل ستأخذ magazine أم recoil control؟ ولماذا؟

### Between-session survey (5 دقائق)

1. ما الذي جعلك تريد مباراة أخرى؟
2. ما اللحظة الأكثر إرباكاً؟
3. أي سلاح فهمت دوره فوراً؟
4. أي Operator يبدو أقوى؟
5. ما الإحساس الذي تريد تحسينه أولاً؟

---

## 4. Quantitative metrics

### Combat

- متوسط TTK لكل سلاح عند 5m/20m/50m/100m.
- shots fired/hit، headshot rate، damage per engagement.
- weapon pick rate وkill share وdrop-off range.
- reload cancel، empty fire، weapon swap frequency.

```text
TTK = time(first_damage_event → death_event)
effective_range = distance where median TTK exceeds target band
```

### Operators

- pick rate، win rate، kill/assist share.
- ability cast/min، ability damage/denial/healing.
- ultimate charge time وsuccessful use rate.
- post-match perceived strength 1–5.

### Match and UX

- match duration، time-to-first-shot، time-to-first-kill.
- abandonment/quit، pause/menu confusion، settings completion.
- clicks/time للـ mode، loadout، attachment.
- FPS p50/p95، frame time، memory، crash/page error.

### Map / Death Heatmap

كل kill/death يسجل:

```json
{
  "matchId": "local-uuid",
  "position": {"x": 0, "z": 0},
  "weaponId": "ar4",
  "distance": 23.4,
  "mode": "tdm",
  "timestamp": 123.4
}
```

تُجمع الخريطة إلى grid 4m أو 8m وتعرض:

- deaths per cell.
- first-contact cells.
- repeated spawn deaths خلال 10s.
- weapon range overlay.

لا نسجل raw mouse path أو أي identifier شخصي غير ضروري.

---

## 5. Qualitative research

### Likert survey (1–5)

1. الحركة استجابت كما توقعت.
2. التصويب وإطلاق النار كانا واضحين.
3. فهمت متى أستخدم ADS.
4. الأسلحة بدت مختلفة فعلاً.
5. فهمت فائدة كل Operator.
6. الـ HUD عرض المعلومات المناسبة في الوقت المناسب.
7. الصوت ساعدني على معرفة اتجاه الخطر.
8. الموت شعرت أنه عادل/مفهوم.
9. اختيار attachment كان ذا معنى.
10. أريد لعب مباراة أخرى الآن.

### مقابلات فردية

15 دقيقة مع 5 مشاركين موزعين على الفئات. أسئلة:

- صف آخر اشتباك خطوة بخطوة.
- ما الذي ظننته سيحدث ولم يحدث؟
- متى شعرت بالسيطرة؟
- متى شعرت أن النتيجة عشوائية؟
- ما الذي ستشرحه لصديق قبل أن يلعب؟

### Think Aloud / recording

- OBS مع indicator واضح للتسجيل.
- لا تسجيل شاشة login أو بيانات شخصية.
- يطلب من اللاعب verbalize القرار، لا كل حركة يد.
- marker sheet يربط timestamp بالمشكلة.

---

## 6. Instrumentation

### Events

```text
session_started
tutorial_step_completed
match_started
shot_fired
shot_hit
damage_taken
weapon_switched
reload_started
operator_selected
ability_used
kill_confirmed
player_died
match_ended
menu_opened
setting_changed
bug_reported
```

### Local prototype implementation

في نسخة prototype يكفي `window.__PLAYTEST_EVENTS__` مع export JSON في نهاية الجلسة. في UE5 يستبدل بـ telemetry service مع consent.

### Quality checks

- كل event له schema version.
- timestamps monotonic داخل session.
- matchId random غير مرتبط بالحساب.
- missing fields لا تكسر المباراة.
- telemetry off يعطل collection لا gameplay.

### أدوات التحليل

- Google Forms للاستبيان.
- OBS للتسجيل.
- Excel/Google Sheets للـ pivot وTTK.
- Python/Node script لتجميع JSON وdeath heatmap.
- Grafana لاحقاً عند dedicated server.

---

## 7. Schedule

| الأسبوع | العمل | المخرج |
|---:|---|---|
| 1 | recruitment، consent، instrument check | participant roster + test build |
| 2 | 5 جلسات × 3–4 لاعبين | raw telemetry + recordings |
| 3 | quantitative/qualitative analysis | findings deck + prioritized backlog |
| 4 | design fixes + targeted retest | patch validation |

الجلسة الواحدة لا تتجاوز 4 لاعبين لتقليل noise في المراقبة.

---

## 8. Analysis and decision rules

### قواعد التوازن

- إذا سلاح pick rate >45% وkill share >50% مع عينة ≥100 engagements: balance investigation.
- إذا median TTK خارج band بنسبة >15% في مسافتين: تعديل ضرر/سرعة/مرفق.
- إذا Operator win rate يتجاوز baseline بـ8 نقاط مئوية مع sample كافٍ: نراجع counters أولاً ثم الأرقام.
- لا نعدل بناءً على لاعب محترف واحد.

### قواعد UX

- ≥30% من المبتدئين يتوقفون في نفس الشاشة = P1 UX blocker.
- ≥20% لا يجدون attachment أو لا يفهمون trade-off = إعادة wireframe.
- ≥2 crashes لنفس trigger = إيقاف السيناريو حتى الإصلاح.

### Severity

| الأولوية | التعريف |
|---|---|
| P0 | يمنع الاختبار/يفسد البيانات/فقدان تقدم |
| P1 | يمنع الفهم أو يفسد مباراة كاملة |
| P2 | إرباك متكرر أو balance issue |
| P3 | polish أو اقتراح |

---

## 9. Report template

```markdown
# Playtest Report — YYYY-MM-DD

## Executive summary
- القرار المقترح:
- أكبر نجاح:
- أكبر خطر:

## Sample
| cohort | n | device | input |

## Quantitative
| metric | baseline | result | target | decision |

## Weapon balance
| weapon | median TTK | pick | kill share | action |

## Qualitative themes
1. Theme / evidence / affected cohort / action

## Top 10 problems
| rank | issue | severity | evidence | owner | due |

## Next build acceptance criteria
- [ ] ...
```

---

## 10. Consent and privacy

- consent منفصل للتسجيل والـ telemetry.
- يحق للمشارك الانسحاب دون خسارة التعويض.
- لا نجمع اسم حقيقي داخل telemetry.
- recordings تخزن بمفتاح participant code وتُحذف بعد مدة المشروع.
- أي نشر اقتباس أو مقطع يحتاج موافقة منفصلة.

## Actionable next steps

1. إنشاء `playtest-schema-v1.json` للأحداث.
2. إضافة export telemetry محلي للنسخة الحالية.
3. تجنيد cohort أول من 5 مبتدئين و5 متوسطين.
4. تشغيل Session 1 فقط قبل حجز Session 2.
5. استخراج TTK وdeath heatmap خلال 48 ساعة من أول جلسة.
6. فتح backlog بمالك وموعد لكل P0/P1/P2.
