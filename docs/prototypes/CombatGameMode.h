#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "CombatGameMode.generated.h"

UENUM(BlueprintType)
enum class ECPMatchPhase : uint8
{
    Warmup,
    Live,
    SuddenDeath,
    PostMatch
};

UCLASS()
class COMBATPROTOCOL_API ACPGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    ACPGameMode();

    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;
    virtual void PostLogin(APlayerController* NewPlayer) override;
    virtual void Logout(AController* Exiting) override;

    UFUNCTION(BlueprintCallable) void StartMatchPhase();
    UFUNCTION(BlueprintCallable) void EndMatchPhase();
    UFUNCTION(BlueprintPure) ECPMatchPhase GetMatchPhase() const { return MatchPhase; }

protected:
    UPROPERTY(EditDefaultsOnly) int32 TargetScore = 50;
    UPROPERTY(EditDefaultsOnly) float MatchDurationSeconds = 600.0f;
    ECPMatchPhase MatchPhase = ECPMatchPhase::Warmup;
    float RemainingSeconds = 0.0f;

    void EvaluateWinCondition();
};
