#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameStateBase.h"
#include "CombatGameState.generated.h"

UCLASS()
class COMBATPROTOCOL_API ACPGameState : public AGameStateBase
{
    GENERATED_BODY()

public:
    UPROPERTY(Replicated, BlueprintReadOnly) uint8 MatchPhase = 0;
    UPROPERTY(Replicated, BlueprintReadOnly) float RemainingSeconds = 0.0f;
    UPROPERTY(Replicated, BlueprintReadOnly) int32 TeamScore[2] = { 0, 0 };

protected:
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
};
