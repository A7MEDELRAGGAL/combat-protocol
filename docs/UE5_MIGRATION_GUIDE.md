# COMBAT PROTOCOL — UE5 Migration Guide

**النطاق:** نقل prototype Three.js/WebGL إلى Unreal Engine 5 دون فقدان التصميم أو بيانات التوازن
**القاعدة:** Three.js يبقى Sandbox للـ balance/UX حتى يصبح TDM 5v5 في UE5 قابلاً للعب

## جدول المحتويات

1. [Three.js vs UE5](#1-threejs-vs-ue5)
2. [Target UE5 architecture](#2-target-ue5-architecture)
3. [Phased migration](#3-phased-migration)
4. [Mapping tables](#4-mapping-tables)
5. [Files not to port](#5-files-not-to-port)
6. [Data migration](#6-data-migration)
7. [Risks and mitigations](#7-risks-and-mitigations)
8. [Definition of Done](#8-definition-of-done)
9. [Actionable next steps](#9-actionable-next-steps)

---

## 1. Three.js vs UE5

| البعد | Three.js prototype | Unreal Engine 5 target |
|---|---|---|
| الأداء | ممتاز للإثبات المحلي، محدود عند 60 لاعباً | native rendering، profiling، dedicated server |
| الرسومات | WebGL/Canvas materials | Nanite/Lumen/Material Instances/Niagara |
| الشبكة | غير موجودة في الإنتاج | Replication، Prediction، Dedicated Server، Replication Graph |
| الأدوات | ملفات JS/CSS سريعة | C++/Blueprints/UMG/Data Assets/Editor tooling |
| الحركة | custom FPS بسيطة | Character Movement، Enhanced Input، animation graph |
| abilities | بيانات محلية | Gameplay Ability System (GAS) |
| الصوت | WebAudio مولد | Wwise/FMOD + MetaSounds عند الحاجة |
| mobile | WebGL fallback | UE5 mobile renderer وdevice profiles |
| منحنى التعلم | منخفض | مرتفع؛ يحتاج أسبوعين bootstrap على الأقل |
| التكلفة | منخفضة محلياً | تراخيص/أجهزة/build farm/backend/QA |

### لماذا UE5؟

- World Partition لخريطة 2×2 كم.
- Gameplay Ability System للـ attributes/cooldowns/effects.
- Dedicated Server وReplication Graph للبنية التنافسية.
- Niagara وAnimation/Control Rig لقراءة القدرات والأسلحة.
- Unreal Insights وStat commands لميزانيات الأداء.

لا ينبغي نقل كل prototype line-by-line؛ ننقل **القرارات والبيانات والسلوك المقبول**، ثم نعيد التنفيذ وفق framework UE5.

---

## 2. Target UE5 architecture

```text
CPGameInstance
 ├─ Auth/Backend facade
 ├─ Data registry (weapons/heroes/localization)
 └─ Audio/UI services

CPGameMode (server only)
 ├─ Match phase / rules
 ├─ Spawn / team assignment
 ├─ Zone manager
 └─ Result/XP grant

CPGameState (replicated)
 ├─ Mode, timer, score
 ├─ Zone snapshot
 └─ Match phase

CPPlayerState (replicated)
 ├─ Team, kills, score
 ├─ Hero/loadout IDs
 └─ session-only progression

CPPlayerCharacter
 ├─ Enhanced Input
 ├─ CharacterMovement
 ├─ AbilitySystemComponent
 ├─ CombatWeaponComponent
 └─ Health/Armor AttributeSet
```

---

## 3. Phased migration

### Phase A — Project foundation (الأسبوع 1–2)

**المخرجات:**

- مشروع UE5 `CombatProtocolFrontline` من Third Person Shooter أو First Person template.
- Git LFS أو Perforce، branch policy، `.uproject` وBuildGraph أولي.
- Modules: `CombatProtocol`, `CombatProtocolTests`.
- Plugins: Enhanced Input، GameplayAbilities، Niagara، OnlineSubsystem placeholder.
- map `L_Graybox_Drydock` وGameMode TDM.

**Acceptance:** مشروع يفتح ويُبنى على Windows Development Editor وDedicated Server target.

### Phase B — Weapon/GAS foundation (الأسبوع 3–4)

- نقل `CombatWeaponComponent` إلى UE5.
- `GA_Fire` يرسل intent، والسيرفر يقرر hitscan/ammo/damage.
- `CombatAttributeSet` لـ Health/Armor/Ammo.
- `DA_Weapon` و`DA_Attachment` بدل JSON runtime.
- Muzzle socket، recoil curve، animation montage placeholders.

**Acceptance:** AR-4 يطلق ويصيب dummy، reload يعمل، attachment يغير stats على server وclients.

### Phase C — Zone prototype (الأسبوع 5–6)

- نقل `ShrinkingZoneActor`.
- server phase clock، replicated center/radius، client visual ring.
- damage خارج المنطقة عبر Health Attribute.
- deterministic seed لتكرار test maps.

**Acceptance:** خمس مراحل zone تعمل في PIE وdedicated server، late join يرى الحالة الصحيحة.

### Phase D — TDM graybox (الأسبوع 7–8)

- Drydock 9 blockout بثلاثة lanes.
- Spawn points وanti-spawn trap.
- scoreboard، team colors، match timer.
- 1 Hero و6 weapons من Data Assets.

**Acceptance:** offline 5v5 bots، TDM 10 دقائق أو 50 kills، لا P0/P1.

### Phase E — Bots (الأسبوع 9–10)

- Behavior Tree: patrol/seek/cover/attack/retreat.
- EQS للغطاء والـ flank.
- perception hearing/vision.
- bots تُسجل كـ server actors ولا تستخدم client authority.

**Acceptance:** 5 bots يتنقلون بين lanes ولا يعلقون في geometry خلال 30 دقيقة soak.

### Phase F — Dedicated Server first online (الأسبوع 11–12)

- server build في Linux container.
- session create/join/leave.
- 5 لاعبين حقيقيين + bots fill.
- network emulation: 80/150ms، 1–3% packet loss.

**Acceptance:** 5v5 online، p95 latency مناسب للمنطقة، hit registration مقبول، reconnect policy موثقة.

---

## 4. Mapping tables

### Runtime systems

| Three.js | UE5 replacement |
|---|---|
| `js/main.js` | `CPGameMode`, `CPGameState`, `CPGameInstance`, match flow |
| `js/player.js` | `ACPPlayerCharacter` + CharacterMovement + Enhanced Input |
| `js/input.js` | Input Actions/Mapping Contexts |
| `js/weapons.js` | `UCombatWeaponComponent` + `GA_Fire` + weapon actor |
| `js/weapon-data.js` | `UCPWeaponDataAsset` / DataTable |
| `js/enemies.js` | `ACPBOTCharacter` + Behavior Tree + EQS |
| `js/world.js` | Level/World Partition/Geometry/World Settings |
| `js/hud.js` | `UCPHUD` + UMG widgets |
| `js/audio.js` | Wwise/FMOD events and RTPCs |
| `js/game-data.js` | Data Assets + backend catalog + localization tables |
| `localStorage profile` | server profile service / SaveGame only for offline |

### Data mapping

| Prototype data | UE5 data |
|---|---|
| `WEAPON_DEFS` | `DA_Weapon_AR4`, `DA_Weapon_SMG9`… |
| attachment IDs | `DA_Attachment` + slot enum |
| `MODE_DEFS` | `DA_GameMode` + `CPGameMode` rules |
| `OPERATOR_DEFS` | Hero Data Asset + Ability Set |
| `range: [start,end,min]` | curve/data struct with falloff parameters |
| `profile.xp` | server progression aggregate |

### Example mapping

```text
weapon.js tryFire()
  → client input: ActivateAbility(GA_Fire)
  → ServerRequestFire(sequence, origin, direction)
  → server rewind + trace + damage
  → multicast cosmetic fire event
```

---

## 5. Files not to port

لا تُنقل هذه الملفات ككود runtime:

- Three.js renderer and WebGL shaders.
- `index.html` و`css/style.css` كواجهة نهائية؛ يعاد بناؤها في UMG/CommonUI.
- WebAudio oscillator implementation؛ يعاد تصميمه كـ Wwise/FMOD.
- DOM pointer lock/touch handlers.
- Canvas minimap drawing؛ يستبدل بـ UMG/Material widget.

تُحفظ كـ reference فقط:

- أسماء controls.
- copy/text keys.
- layout ratios.
- math/tuning data.
- screenshots/evidence.

---

## 6. Data migration

### Export contract

أنشئ قبل النقل:

```json
{
  "schemaVersion": 1,
  "weapons": [{
    "id": "ar4",
    "damage": 26,
    "rpm": 620,
    "mag": 30,
    "range": [26, 68, 0.55],
    "attachments": ["red-dot", "vertical-grip"]
  }]
}
```

### Validation

- unique IDs/names.
- reserve ≥ mag.
- ADS spread < base spread.
- headshot multiplier 1.0–2.5.
- TTK band checks.
- localization keys موجودة لكل label.

لا ننقل profile المحلي إلى live account تلقائياً؛ يمكن تقديم opt-in import تجريبي، ولا يُعتمد اقتصادياً في beta.

---

## 7. Risks and mitigations

| الخطر | التخفيف |
|---|---|
| منحنى UE5 steep | أسبوعان bootstrap + pair programming + Epic Online Learning |
| فقدان تقدم Three.js | إبقاء Sandbox وتشغيل balance tests على المصدرين |
| Netcode late | Dedicated Server من Phase A، لا بعد اكتمال الفن |
| GAS overengineering | ابدأ بـ fire/reload/health/armor فقط |
| Nanite/Lumen mobile gap | device profiles وforward/baked fallback منذ blockout |
| بيانات غير متزامنة | schema version + import validator + golden fixtures |
| اختلاف الإحساس | قياس camera sensitivity/FOV/recoil بالـ fixtures لا بالذاكرة |

---

## 8. Definition of Done

- TDM 5v5 offline مع 5 bots.
- TDM 5v5 online مع 5 لاعبين حقيقيين.
- 60 FPS على GTX 1660 أو جهاز متوسط مكافئ في graybox.
- تسعة أسلحة تعمل مع Gunsmith، مع نقل SG-12 pellet behavior كـ data-driven weapon contract.
- server authority للطلقات والضرر والـ ammo.
- zone replicated وتعمل مع late join.
- `AutomationSpec` يغطي fire/reload/zone/score.
- لا assets من prototype تُستخدم دون license review.

---

## 9. Actionable next steps

1. إنشاء UE5 project وmodule خلال يومين.
2. إضافة `UCPWeaponDataAsset` وimport validator.
3. نقل AR-4 فقط، لا الستة معاً.
4. بناء server trace test قبل أي weapon art.
5. تشغيل 5 bots في Drydock graybox.
6. مقارنة TTK/feel مع prototype عبر recorded fixture.
7. بعد نجاح Gate 1، نقل بقية الأسلحة والـ zone.
