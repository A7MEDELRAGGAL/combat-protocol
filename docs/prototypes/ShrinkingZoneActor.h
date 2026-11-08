#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ShrinkingZoneActor.generated.h"

USTRUCT(BlueprintType)
struct FCPZonePhase
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) float WaitSeconds = 30.0f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float ShrinkSeconds = 90.0f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float RadiusMultiplier = 0.72f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float DamagePerSecond = 2.0f;
};

UCLASS()
class AShrinkingZoneActor : public AActor
{
    GENERATED_BODY()

public:
    AShrinkingZoneActor();

    virtual void Tick(float DeltaSeconds) override;
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION(BlueprintPure)
    bool IsOutsideZone(FVector WorldLocation) const;

    UFUNCTION(BlueprintPure)
    float GetDamagePerSecond() const { return CurrentDamagePerSecond; }

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY(Replicated)
    FVector_NetQuantize CurrentCenter = FVector::ZeroVector;

    UPROPERTY(Replicated)
    float CurrentRadius = 90000.0f;

    UPROPERTY(Replicated)
    int32 PhaseIndex = 0;

    UPROPERTY(EditDefaultsOnly)
    TArray<FCPZonePhase> Phases;

    float PhaseClock = 0.0f;
    float CurrentDamagePerSecond = 2.0f;
    FVector2D StartCenter = FVector2D::ZeroVector;
    float StartRadius = 90000.0f;
    FVector2D TargetCenter = FVector2D::ZeroVector;
    float TargetRadius = 90000.0f;

    void StartNextPhase();
    void ApplyStormDamage(float DeltaSeconds);
    FVector2D ChooseTargetCenter(float MaxOffset) const;
};
