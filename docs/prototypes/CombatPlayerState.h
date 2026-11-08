#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerState.h"
#include "CombatPlayerState.generated.h"

UCLASS()
class COMBATPROTOCOL_API ACPPlayerState : public APlayerState
{
    GENERATED_BODY()

public:
    ACPPlayerState();

    UFUNCTION(BlueprintCallable) void AddVerifiedXP(int32 Amount);
    UFUNCTION(BlueprintCallable) void AddVerifiedKill();
    UFUNCTION(BlueprintPure) int32 GetLevel() const { return Level; }

    UPROPERTY(ReplicatedUsing=OnRep_Progression, BlueprintReadOnly) int32 XP = 0;
    UPROPERTY(ReplicatedUsing=OnRep_Progression, BlueprintReadOnly) int32 Level = 1;
    UPROPERTY(Replicated, BlueprintReadOnly) int32 Kills = 0;
    UPROPERTY(Replicated, BlueprintReadOnly) int32 Score = 0;
    UPROPERTY(Replicated, BlueprintReadOnly) FName HeroId = TEXT("rook");
    UPROPERTY(Replicated, BlueprintReadOnly) TArray<FName> EquippedWeaponIds;

protected:
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION() void OnRep_Progression();
    void RecalculateLevel();
};
