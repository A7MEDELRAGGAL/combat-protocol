# UE5 Prototype Review & Improvements

**تاريخ المراجعة:** 24 أكتوبر 2026
**النطاق:** كل الملفات تحت `docs/prototypes/`
**النتيجة:** تم تحويل skeleton الأولي إلى reference implementation أكثر أماناً وقابلية للدمج، مع فصل واضح بين server authority وclient presentation.

## جدول المحتويات

1. [Executive review](#1-executive-review)
2. [File-by-file findings](#2-file-by-file-findings)
3. [Applied improvements](#3-applied-improvements)
4. [New production scaffolding](#4-new-production-scaffolding)
5. [Unreal integration notes](#5-unreal-integration-notes)
6. [Automation tests](#6-automation-tests)
7. [Remaining risks](#7-remaining-risks)
8. [Actionable next steps](#8-actionable-next-steps)

---

## 1. Executive review

### المشاكل الحرجة في النسخة السابقة

| المشكلة | الأثر |
|---|---|
| `GetLifetimeReplicatedProps` غير معلن في headers | compile/link failure في UHT/C++ |
| Match state كان داخل GameMode | GameMode server-only؛ clients لا يرون state بشكل صحيح |
| `PhaseIndex` لا يزيد | zone عالقة في أول phase |
| `GetOwner()->GetOwner()` في shot validation | قد يفشل في تحديد Pawn الصحيح |
| لا fire-rate throttle server | client يستطيع تجاوز RPM |
| لا reload RPC/state | ammo/reload غير مكتملين |
| zone تطبق damage على كل Pawn بلا rules | spectator/team/special actors قد يتضررون |
| attachment لا يتحقق من id/slot/unlock | loadout invalid أو duplicate slots |
| debug line داخل كل hit | draw/debug overhead في shipping |
| random shot sequence | sequence replay/order غير موثوق |

### مبدأ الإصلاح

```text
Client intent → server validation → authoritative state → replicated result
                                             ↓
                                  cosmetic multicast/UI only
```

---

## 2. File-by-file findings

### AttachmentData.h

**قبل:** structs فقط، لا Data Asset، لا module API، ولا catalog validation.

**بعد:**

- أضيف `UCPAttachmentDefinition : UPrimaryDataAsset`.
- أضيف module API macro.
- بقيت modifiers data-driven.

**مطلوب لاحقاً:**

- `GameplayTag` لكل slot/rarity.
- asset manager scan.
- server catalog ID validation.

### CombatWeaponComponent.h/cpp

**قبل:**

- firing server RPC بلا throttle.
- لا reload state.
- owner cast خاطئ.
- missing replication declaration.

**بعد:**

- `GetLifetimeReplicatedProps`.
- `NextAllowedFireServerTime`.
- `bReloading` وserver reload timer.
- Pawn validation من component owner.
- direction normalization check.
- ammo decrement على السيرفر.
- attachment slot replacement وbasic ID validation.

**مطلوب لاحقاً:**

- monotonic per-weapon shot sequence مع wrap-safe comparison.
- server rewind history للـ lag compensation.
- hit zones/armor/team validation.
- object pooling للـ impact FX.
- لا `DrawDebugLine` في Shipping؛ خلف `#if CP_WEAPON_DEBUG`.

### ShrinkingZoneActor.h/cpp

**قبل:**

- center type غير واضح.
- PhaseIndex لا يتقدم.
- `GetLifetimeReplicatedProps` missing.
- target center randomness غير deterministic.

**بعد:**

- replicated `FVector_NetQuantize` center.
- phase advance بعد اكتمال الحركة.
- explicit replication declaration.
- bounded random offset function.

**مطلوب لاحقاً:**

- seed من MatchState لضمان reproducibility.
- damage interface بدلاً من `TakeDamage` الخام.
- pause/late join/spectator rules.
- visual ring component على client.

### CombatPlayerCharacter

- يملك AbilitySystemComponent وAttributeSet وWeapon component.
- يتطلب استبدال legacy input بـ Enhanced Input عند integration.
- server sprint state موثق؛ client animation يعتمد على replicated state.

### CombatGameMode/GameState

- GameMode server-only للقرارات.
- GameState replicated للـ phase/timer/team score.
- لا نضع replicated properties داخل GameMode.

### CombatPlayerState

- XP/Level/Kills/Score/Hero/Loadout replicated.
- **تنبيه:** في الإنتاج XP لا يُكتب من client؛ يستلم فقط verified grant من Results Service.

### CombatHUD

- UMG هو owner الحقيقي للـ HUD.
- `DrawHUD` محفوظ للـ debug/profiling.
- kill feed يجب أن يكون bounded/pooled.

### GAS abilities

- `GA_Fire` و`GA_Reload` skeletons موجودة.
- activation prediction موجودة كبداية، لكن shot authority لا يزال في weapon component.
- Production يضيف tags: `State.Reloading`, `Cooldown.Weapon.Fire`, `Blocked.Stunned`.

---

## 3. Applied improvements

الملفات المحسنة:

```text
AttachmentData.h
CombatWeaponComponent.h/cpp
ShrinkingZoneActor.h/cpp
CombatPlayerCharacter.h/cpp
CombatGameMode.h/cpp
CombatGameState.h/cpp
CombatPlayerState.h/cpp
CombatHUD.h/cpp
CombatAttributeSet.h/cpp
GA_Fire.h/cpp
GA_Reload.h/cpp
CombatProtocolAutomationTests.cpp
```

### Memory leaks

- لا توجد allocations يدوية في الملفات.
- Unreal `UObject`/`UPROPERTY` ownership مستخدم للـ components/widgets.
- Timer reload مرتبط بالـ world timer manager؛ عند integration يجب إلغاؤه في EndPlay أو استخدام `FTimerHandle` member لإلغاء reload عند death/swap.
- Widget reference `TObjectPtr` تمنع GC غير المقصود.

### Thread safety

- كل state mutation gameplay على Game Thread/server.
- لا static mutable data.
- أي telemetry/network persistence يجب أن تذهب إلى async subsystem ولا تكتب PostgreSQL من actor tick.
- لا `UObject` access من worker thread بدون task handoff.

### Replication

- Gameplay authority server.
- GameMode server-only، GameState replicated.
- `COND_OwnerOnly` للـ ammo.
- Client لا يرسل damage/health/XP.

### Missing includes / UHT

- تمت إضافة `Net/UnrealNetwork.h` في ملفات replication.
- كل reflected class لديه generated header.
- module macro `COMBATPROTOCOL_API` يجب أن يطابق اسم module الحقيقي.
- headers تنتهي بالـ generated header include الأخير بين includes الخاصة بالـ UE reflection.

---

## 4. New production scaffolding

| الملف | الغرض |
|---|---|
| `CombatPlayerCharacter.*` | Character + GAS + weapon ownership |
| `CombatGameMode.*` | server match lifecycle |
| `CombatGameState.*` | replicated match state |
| `CombatPlayerState.*` | score/progression/session loadout |
| `CombatHUD.*` | UMG entry point |
| `CombatAttributeSet.*` | Health/Armor/Ammo attributes |
| `GA_Fire.*` | predicted ability → server fire request |
| `GA_Reload.*` | reload ability → server reload |
| `CombatProtocolAutomationTests.cpp` | data/contract smoke tests |

---

## 5. Unreal integration notes

### Build.cs dependencies

```csharp
PublicDependencyModuleNames.AddRange(new [] {
    "Core", "CoreUObject", "Engine", "InputCore",
    "EnhancedInput", "GameplayAbilities", "GameplayTags", "GameplayTasks",
    "UMG", "NetCore"
});
```

أضف `AIModule`, `NavigationSystem`, `Niagara`, `OnlineSubsystem` حسب الملفات القادمة.

### Config

- `DefaultGame.ini`: GameMode/GameState/PlayerState/HUD classes.
- `DefaultInput.ini` أو Enhanced Input Data Assets.
- `DefaultGameplayTags.ini`: combat tags.
- `DefaultEngine.ini`: Replication Graph، net driver، dedicated server settings.

### Server build

- Target `CombatProtocolServer.Target.cs` منفصل.
- لا يطبخ UMG/audio cosmetics الضرورية للسيرفر.
- automation tests تعمل في Editor وcommandlet حيث يمكن.

---

## 6. Automation tests

الملف الحالي يثبت:

- attachment trade-off data.
- zone phase test harness.

قبل production نضيف:

```text
CombatProtocol.Weapon.FireRate
CombatProtocol.Weapon.ReloadAuthority
CombatProtocol.Weapon.AttachmentSlotUniqueness
CombatProtocol.Zone.PhaseProgression
CombatProtocol.Zone.DamageOutsideOnly
CombatProtocol.Match.TargetScore
CombatProtocol.Progression.IdempotentGrant
```

### تشغيل مقترح

```text
UnrealEditor-Cmd.exe CombatProtocol.uproject \
  -ExecCmds="Automation RunTests CombatProtocol; Quit" \
  -TestExit="Automation Test Queue Empty"
```

---

## 7. Remaining risks

- هذه الملفات لا يمكن compile هنا لأن workspace لا يحتوي Unreal Engine أو `.uproject`.
- `GA_Fire` يحتاج sequence counter حقيقياً؛ random sequence موجود كـ placeholder ويجب تغييره قبل multiplayer.
- `CombatGameMode` يحتاج team allocator وverified result service.
- zone تحتاج net relevancy/visual replication وdeterministic match seed.
- `UCombatAttributeSet` يحتاج damage execution/armor mitigation فعلياً.
- `CombatHUD` يحتاج typed UMG interface، وليس comments فقط.

هذه فجوات integration موثقة وليست مخفية كميزات مكتملة.

## 8. Actionable next steps

1. إنشاء module باسم يطابق `COMBATPROTOCOL_API`.
2. إضافة Build.cs و`.uproject` test target.
3. استبدال random shot sequence بـ client-owned monotonic counter.
4. إضافة `FCPDamageExecutionCalculation` للـ armor/headshot.
5. ربط GameState بالـ scoreboard وzone widget.
6. تشغيل Automation command في UE5 Editor/CI.
7. تمرير review ثانية بعد أول dedicated server session.
