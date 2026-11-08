#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "AbilitySystemInterface.h"
#include "CombatPlayerCharacter.generated.h"

class UAbilitySystemComponent;
class UCombatAttributeSet;
class UCombatWeaponComponent;

UCLASS()
class COMBATPROTOCOL_API ACPPlayerCharacter : public ACharacter, public IAbilitySystemInterface
{
    GENERATED_BODY()

public:
    ACPPlayerCharacter();

    virtual UAbilitySystemComponent* GetAbilitySystemComponent() const override;
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;
    virtual void PossessedBy(AController* NewController) override;
    virtual void OnRep_PlayerState() override;
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION(BlueprintCallable) void StartSprint(bool bWantsSprint);
    UFUNCTION(BlueprintPure) bool IsSprinting() const { return bSprinting; }

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly) TObjectPtr<UAbilitySystemComponent> AbilitySystem;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly) TObjectPtr<UCombatAttributeSet> Attributes;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly) TObjectPtr<UCombatWeaponComponent> Weapon;

protected:
    void BindMove(const FVector2D& Axis);
    void MoveForward(float Value);
    void MoveRight(float Value);
    void LookUp(float Value);
    void Turn(float Value);
    void BeginAim();
    void EndAim();

    UPROPERTY(Replicated) bool bSprinting = false;

    void InitializeAbilityActorInfo();
};
