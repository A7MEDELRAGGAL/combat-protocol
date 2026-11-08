#include "GA_Reload.h"

#include "CombatPlayerCharacter.h"
#include "CombatWeaponComponent.h"

UGA_Reload::UGA_Reload()
{
    InstancingPolicy = EGameplayAbilityInstancingPolicy::InstancedPerExecution;
    NetExecutionPolicy = EGameplayAbilityNetExecutionPolicy::LocalPredicted;
}

void UGA_Reload::ActivateAbility(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo* ActorInfo,
    const FGameplayAbilityActivationInfo ActivationInfo, const FGameplayEventData* TriggerEventData)
{
    ACPPlayerCharacter* Character = Cast<ACPPlayerCharacter>(ActorInfo ? ActorInfo->AvatarActor.Get() : nullptr);
    if (Character && Character->Weapon)
    {
        Character->Weapon->ServerRequestReload();
    }
    EndAbility(Handle, ActorInfo, ActivationInfo, true, Character == nullptr);
}
