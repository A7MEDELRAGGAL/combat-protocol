#pragma once

#include "CoreMinimal.h"
#include "AttributeSet.h"
#include "AbilitySystemComponent.h"
#include "CombatAttributeSet.generated.h"

#define CP_ATTRIBUTE_ACCESSORS(ClassName, PropertyName) \
GAMEPLAYATTRIBUTE_PROPERTY_GETTER(ClassName, PropertyName) \
GAMEPLAYATTRIBUTE_VALUE_GETTER(PropertyName) \
GAMEPLAYATTRIBUTE_VALUE_SETTER(PropertyName) \
GAMEPLAYATTRIBUTE_VALUE_INITTER(PropertyName)

UCLASS()
class COMBATPROTOCOL_API UCombatAttributeSet : public UAttributeSet
{
    GENERATED_BODY()

public:
    CP_ATTRIBUTE_ACCESSORS(UCombatAttributeSet, Health);
    CP_ATTRIBUTE_ACCESSORS(UCombatAttributeSet, MaxHealth);
    CP_ATTRIBUTE_ACCESSORS(UCombatAttributeSet, Armor);
    CP_ATTRIBUTE_ACCESSORS(UCombatAttributeSet, MaxArmor);
    CP_ATTRIBUTE_ACCESSORS(UCombatAttributeSet, Ammo);

    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
    virtual void PreAttributeChange(const FGameplayAttribute& Attribute, float& NewValue) override;
    virtual void PostGameplayEffectExecute(const FGameplayEffectModCallbackData& Data) override;

    UPROPERTY(BlueprintReadOnly, ReplicatedUsing=OnRep_Health, Category="Combat") FGameplayAttributeData Health;
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing=OnRep_MaxHealth, Category="Combat") FGameplayAttributeData MaxHealth;
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing=OnRep_Armor, Category="Combat") FGameplayAttributeData Armor;
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing=OnRep_MaxArmor, Category="Combat") FGameplayAttributeData MaxArmor;
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing=OnRep_Ammo, Category="Combat") FGameplayAttributeData Ammo;

protected:
    UFUNCTION() void OnRep_Health(const FGameplayAttributeData& OldValue);
    UFUNCTION() void OnRep_MaxHealth(const FGameplayAttributeData& OldValue);
    UFUNCTION() void OnRep_Armor(const FGameplayAttributeData& OldValue);
    UFUNCTION() void OnRep_MaxArmor(const FGameplayAttributeData& OldValue);
    UFUNCTION() void OnRep_Ammo(const FGameplayAttributeData& OldValue);
};
