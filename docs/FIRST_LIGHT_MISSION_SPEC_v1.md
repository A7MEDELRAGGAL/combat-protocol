# First Light — Mission Implementation Spec v1

## الهدف

تحويل Port Meridian من ساحة تدريب إلى أول مهمة سردية محلية قابلة للعب، مع الحفاظ على نظام القتال الحالي وعدم ادعاء وجود Multiplayer.

## حالة التنفيذ في v1.5.0

تم تنفيذ الشريحة القابلة للعب التالية داخل `combat-protocol`:

- `frontlineOps` يظهر من شاشة اختيار الطور.
- `ingress → recover_key → secure_relay → hold_relay → extract → success/failure` تعمل عبر `js/mission-rules.js`.
- نقاط `kiosk` و`relay` و`extraction` تظهر داخل خريطة Port Meridian.
- objective HUD، progress، تفاعل `E`، زر لمس، وTelemetry مرتبطة بالمباراة.
- موجة ضغط أولية تبدأ عند `hold_relay`.

المتبقي من المواصفة وليس مدعى اكتماله بعد: شاشة briefing مستقلة، VO/subtitles للفصائل، Rook ability، وdebrief خاص بالمهمة.

## نطاق النسخة الأولى

- لاعب واحد.
- Operator canonical: `rook`، مع stat fallback الحالي إلى أن تُنفذ abilities.
- السلاح المقترح: `AR-4`.
- لا loot، لا متجر، لا matchmaking، لا branching campaign.
- نفس arena الحالية كـ greybox مع نقاط Relay وKiosk وExtraction محددة منطقياً.

## State machine

```text
briefing
  → ingress
  → recover_key
  → secure_relay
  → hold_relay
  → extract
  → success

أي حالة لعب
  → failure عند موت اللاعب أو فشل المؤقت
```

### تعريف الحالات

| الحالة | شرط الدخول | شرط الخروج | HUD |
|---|---|---|---|
| `briefing` | ضغط Start First Light | تأكيد Brief | عنوان المهمة + ملخص |
| `ingress` | بداية المهمة | الوصول إلى kiosk | الوصول إلى Relay 07 |
| `recover_key` | تفعيل kiosk | التفاعل 2 ثوانٍ | استعد maintenance key |
| `secure_relay` | استعادة المفتاح | الوصول إلى Relay 07 | ثبّت Relay 07 |
| `hold_relay` | بدء التثبيت | progress = 100% | حماية المرحل + progress |
| `extract` | اكتمال التثبيت | دخول extraction | اخرج إلى crane lane |
| `success` | دخول extraction | نهاية المهمة | debrief + rewards |
| `failure` | موت/timeout | إعادة تشغيل | سبب الفشل + Restart |

## الإيقاع

- أول landmark خلال 20 ثانية.
- أول contact بين 60 و90 ثانية.
- Kiosk قبل منتصف المهمة.
- Relay hold من 20 إلى 30 ثانية.
- Extraction يغيّر اتجاه الحركة ويمنع البقاء في cover واحد.

## السرد والـ VO

1. **Brief:** Rook: "Relay 07 لا يطفئ نفسه. ادخل، خذ المفتاح، ولا تترك الشبكة تختار من يعيش."
2. **Relay online:** FRONTLINE: "Priority correction accepted. Floodplain district remains nonessential."
3. **Extraction:** Assembly contact: "أخرج البيانات. إذا عاد الضوء، يجب أن نعرف لمن يعود."

كل سطر له key عربي وإنجليزي، ونسخة subtitle، ويظل الهدف مفهوماً عند تعطيل الصوت.

## القتال

- Kiosk: تماس أول قصير.
- Relay: موجة ضغط بزيادة بسيطة، لا spawn لا نهائي.
- Extraction: طريق عودة مع cover مختلف وtimer واضح.
- لا نضيف enemy archetype جديد قبل ثبات pacing.

## المكافأة

- `mission_started` لا يمنح مكافأة.
- `objective_completed` يسجل التقدم فقط.
- `success` يمنح completion XP مرة واحدة بواسطة `matchId`.
- `failure` لا يمنح completion XP.
- أي إعادة تشغيل تُنشئ match ID جديداً.

## telemetry

```text
mission_started { missionId: "first-light", operatorId, weaponId }
objective_started { missionId, objectiveId }
objective_completed { missionId, objectiveId, elapsed }
ability_used { missionId, operatorId, abilityId }
kill_confirmed { missionId, weaponId, headshot }
player_died { missionId, source }
mission_ended { missionId, result, elapsed, xpGranted }
```

## اختبار القبول

1. المهمة تدخل من UI حقيقي وليس من helper فقط.
2. كل transition يغير objective الظاهر.
3. reset يعيد state وenemy positions وtimer.
4. لا يمكن تخطي hold بإطلاق أو reload أو pause.
5. النجاح يعطي reward مرة واحدة.
6. الفشل لا يزيد `completedMatches`.
7. الصوت مغلق لا يمنع فهم المهمة.
8. العربية وmobile HUD لا تتداخل مع progress.
9. `npm test` و`npm run verify` يظلان ناجحين.

## ترتيب التنفيذ

1. pure mission state module + unit tests.
2. objective marker/progress في HUD.
3. نقاط world وinteraction trigger.
4. spawn waves مرتبطة بالحالة.
5. debrief وربط settlement.
6. smoke flow كامل من mode selection إلى success/failure.
