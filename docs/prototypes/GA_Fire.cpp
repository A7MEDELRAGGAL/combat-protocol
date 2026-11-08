#include "GA_Fire.h"

#include "CombatPlayerCharacter.h"
#include "CombatWeaponComponent.h"

UGA_Fire::UGA_Fire()
{
    InstancingPolicy = EGameplayAbilityInstancingPolicy::InstancedPerExecution;
    NetExecutionPolicy = EGameplayAbilityNetExecutionPolicy::LocalPredicted;
}

bool UGA_Fire::CanActivateAbility(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo* ActorInfo,
    const FGameplayTagContainer* SourceTags, const FGameplayTagContainer* TargetTags,
    FGameplayTagContainer* OptionalRelevantTags) const
{
    return Super::CanActivateAbility(Handle, ActorInfo, SourceTags, TargetTags, OptionalRelevantTags)
        && ActorInfo && ActorInfo->AvatarActor.IsValid();
}

void UGA_Fire::ActivateAbility(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo* ActorInfo,
    const FGameplayAbilityActivationInfo ActivationInfo, const FGameplayEventData* TriggerEventData)
{
    ACPPlayerCharacter* Character = Cast<ACPPlayerCharacter>(ActorInfo ? ActorInfo->AvatarActor.Get() : nullptr);
    if (!Character || !Character->Weapon)
    {
        EndAbility(Handle, ActorInfo, ActivationInfo, true, true);
        return;
    }

    const FVector Origin = Character->GetPawnViewLocation();
    const FVector Direction = Character->GetControlRotation().Vector();
    const uint16 Sequence = static_cast<uint16>(FMath::Rand());
    if (Character->HasAuthority())
    {
        Character->Weapon->ServerRequestFire(Origin, Direction, Sequence);
    }
    else
    {
        Character->Weapon->ServerRequestFire(Origin, Direction, Sequence);
    }

    EndAbility(Handle, ActorInfo, ActivationInfo, true, false);
}
