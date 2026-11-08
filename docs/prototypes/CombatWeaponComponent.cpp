#include "CombatWeaponComponent.h"

#include "DrawDebugHelpers.h"
#include "GameFramework/Pawn.h"
#include "GameFramework/PlayerController.h"
#include "Net/UnrealNetwork.h"

UCombatWeaponComponent::UCombatWeaponComponent()
{
    SetIsReplicatedByDefault(true);
}

void UCombatWeaponComponent::BeginPlay()
{
    Super::BeginPlay();
    RuntimeStats = BaseStats;
    RebuildRuntimeStats();
}

void UCombatWeaponComponent::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(UCombatWeaponComponent, EquippedAttachments);
    DOREPLIFETIME(UCombatWeaponComponent, CurrentAmmo);
    DOREPLIFETIME(UCombatWeaponComponent, LastAcceptedShotSequence);
    DOREPLIFETIME(UCombatWeaponComponent, bReloading);
    DOREPLIFETIME(UCombatWeaponComponent, NextAllowedFireServerTime);
}

bool UCombatWeaponComponent::EquipAttachment(const FCPAttachmentData& Attachment)
{
    if (!GetOwner() || !GetOwner()->HasAuthority())
    {
        return false;
    }

    if (Attachment.Id.IsNone() || Attachment.UnlockWeaponLevel < 1)
    {
        return false;
    }

    for (int32 Index = EquippedAttachments.Num() - 1; Index >= 0; --Index)
    {
        if (EquippedAttachments[Index].Slot == Attachment.Slot)
        {
            EquippedAttachments.RemoveAt(Index);
        }
    }

    EquippedAttachments.Add(Attachment);
    RebuildRuntimeStats();
    return true;
}

void UCombatWeaponComponent::ServerRequestReload_Implementation()
{
    if (!GetOwner() || !GetOwner()->HasAuthority() || bReloading || CurrentAmmo >= RuntimeStats.Magazine)
    {
        return;
    }

    bReloading = true;
    const float ReloadDuration = RuntimeStats.ReloadTime;
    FTimerHandle ReloadTimer;
    GetWorld()->GetTimerManager().SetTimer(ReloadTimer, this, &UCombatWeaponComponent::FinishReload, ReloadDuration, false);
}

void UCombatWeaponComponent::FinishReload()
{
    if (!GetOwner() || !GetOwner()->HasAuthority())
    {
        return;
    }

    CurrentAmmo = RuntimeStats.Magazine;
    bReloading = false;
}

void UCombatWeaponComponent::OnRep_Attachments()
{
    RebuildRuntimeStats();
}

void UCombatWeaponComponent::RebuildRuntimeStats()
{
    RuntimeStats = BaseStats;
    for (const FCPAttachmentData& Attachment : EquippedAttachments)
    {
        const FCPWeaponModifiers& M = Attachment.Modifiers;
        RuntimeStats.Damage *= M.DamageMultiplier;
        RuntimeStats.RPM *= M.RPMMultiplier;
        RuntimeStats.Spread *= M.SpreadMultiplier;
        RuntimeStats.Recoil *= M.RecoilMultiplier;
        RuntimeStats.ADS *= M.ADSMultiplier;
        RuntimeStats.Range *= M.RangeMultiplier;
        RuntimeStats.Magazine += M.MagazineDelta;
        RuntimeStats.ReloadTime *= M.ReloadMultiplier;
    }
    RuntimeStats.Magazine = FMath::Max(1, RuntimeStats.Magazine);
    RuntimeStats.ReloadTime = FMath::Clamp(RuntimeStats.ReloadTime, 0.45f, 8.0f);
}

bool UCombatWeaponComponent::ValidateShot(
    FVector_NetQuantize10 Origin,
    FVector_NetQuantizeNormal Direction,
    uint16 ShotSequence) const
{
    if (!GetOwner() || !GetOwner()->HasAuthority())
    {
        return false;
    }

    const float Now = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0f;
    if (ShotSequence == LastAcceptedShotSequence || bReloading || CurrentAmmo <= 0 || Now < NextAllowedFireServerTime)
    {
        return false;
    }

    const APawn* Pawn = Cast<APawn>(GetOwner());
    if (!Pawn)
    {
        return false;
    }

    const FVector ExpectedOrigin = Pawn->GetPawnViewLocation();
    return FVector::DistSquared(ExpectedOrigin, Origin) < FMath::Square(65.0f)
        && FMath::IsNearlyEqual(Direction.SizeSquared(), 1.0f, 0.04f);
}

void UCombatWeaponComponent::ServerRequestFire_Implementation(
    FVector_NetQuantize10 Origin,
    FVector_NetQuantizeNormal Direction,
    uint16 ShotSequence)
{
    if (!ValidateShot(Origin, Direction, ShotSequence))
    {
        return;
    }

    LastAcceptedShotSequence = ShotSequence;
    --CurrentAmmo;
    NextAllowedFireServerTime = GetWorld()->GetTimeSeconds() + (60.0f / FMath::Max(1.0f, RuntimeStats.RPM));
    ResolveServerHitscan(Origin, Direction);
}

void UCombatWeaponComponent::ResolveServerHitscan(const FVector& Origin, const FVector& Direction)
{
    const FVector End = Origin + Direction * (18000.0f * RuntimeStats.Range);
    FHitResult Hit;
    FCollisionQueryParams Params(SCENE_QUERY_STAT(CombatProtocolWeapon), true, GetOwner());
    if (GetWorld() && GetWorld()->LineTraceSingleByChannel(Hit, Origin, End, ECC_Visibility, Params))
    {
        // Production: resolve hit zones, rewind target pose, armor, headshot multiplier,
        // team validation, damage events and anti-cheat telemetry here.
        DrawDebugLine(GetWorld(), Origin, Hit.ImpactPoint, FColor::Yellow, false, 0.08f, 0, 1.5f);
    }
}
