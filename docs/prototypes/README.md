# Unreal Engine 5 prototypes

هذه الملفات **نماذج مرجعية محسّنة** لنقل الأنظمة إلى UE5. لا تُبنى داخل مشروع Three.js الحالي لعدم وجود Unreal Engine/`.uproject` في workspace، وتحتاج مشروع Unreal مع `GameplayAbilities`/`NetCore` أو بدائلها.

المبادئ المهمة:

- كل قرار مؤثر على النتيجة يُحسم على السيرفر.
- العميل يرسل input/intent لا damage أو ammo النهائي.
- الـ zone والـ attachments بيانات قابلة للضبط وليست ثوابت متناثرة داخل الكود.
- الكود هنا skeleton إنتاجي صغير، وليس بديلاً عن integration مع Animation/Replication/Inventory.

## الملفات

| الملف | الاستخدام |
|---|---|
| `AttachmentData.h` | slots/modifiers وPrimary Data Asset |
| `CombatWeaponComponent.*` | server fire/reload/attachments |
| `ShrinkingZoneActor.*` | phases/center/radius/storm |
| `CombatPlayerCharacter.*` | Character + GAS + weapon |
| `CombatGameMode.*` | server match lifecycle |
| `CombatGameState.*` | replicated phase/timer/score |
| `CombatPlayerState.*` | XP/level/score/loadout |
| `CombatHUD.*` | UMG entry point |
| `CombatAttributeSet.*` | Health/Armor/Ammo |
| `GA_Fire.*` / `GA_Reload.*` | GAS ability entry points |
| `CombatProtocolAutomationTests.cpp` | UE automation smoke tests |
| `REVIEW_AND_IMPROVEMENTS.md` | مراجعة، قيود، وخطوات الدمج |

## Bootstrap

1. أنشئ module اسمه `CombatProtocol` أو غيّر `COMBATPROTOCOL_API` لاسم module الحقيقي.
2. أضف dependencies: `GameplayAbilities`, `GameplayTags`, `GameplayTasks`, `EnhancedInput`, `UMG`, `NetCore`.
3. عرّف `GameMode`, `GameState`, `PlayerState`, `HUD` في `DefaultGame.ini`.
4. أضف Data Assets للمرفقات والأسلحة.
5. شغّل Automation Tests بعد إنشاء `.uproject` وDedicated Server target.

راجع `REVIEW_AND_IMPROVEMENTS.md` قبل اعتبار النماذج production-ready؛ خصوصاً sequence counter، lag compensation، damage execution، وverified reward service.
