#include "CombatPlayerState.h"

#include "Net/UnrealNetwork.h"

ACPPlayerState::ACPPlayerState()
{
    bReplicates = true;
}

void ACPPlayerState::AddVerifiedXP(int32 Amount)
{
    if (!HasAuthority() || Amount <= 0) return;
    XP = FMath::Clamp(XP + Amount, 0, 2000000000);
    RecalculateLevel();
}

void ACPPlayerState::AddVerifiedKill()
{
    if (!HasAuthority()) return;
    ++Kills;
    Score += 100;
}

void ACPPlayerState::RecalculateLevel()
{
    Level = FMath::Clamp(1 + XP / 1000, 1, 100);
}

void ACPPlayerState::OnRep_Progression() {}

void ACPPlayerState::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(ACPPlayerState, XP);
    DOREPLIFETIME(ACPPlayerState, Level);
    DOREPLIFETIME(ACPPlayerState, Kills);
    DOREPLIFETIME(ACPPlayerState, Score);
    DOREPLIFETIME(ACPPlayerState, HeroId);
    DOREPLIFETIME(ACPPlayerState, EquippedWeaponIds);
}
