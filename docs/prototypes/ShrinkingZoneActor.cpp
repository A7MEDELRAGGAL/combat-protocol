#include "ShrinkingZoneActor.h"

#include "Engine/World.h"
#include "GameFramework/Pawn.h"
#include "Net/UnrealNetwork.h"

AShrinkingZoneActor::AShrinkingZoneActor()
{
    PrimaryActorTick.bCanEverTick = true;
    bReplicates = true;

    Phases = {
        { 45.0f, 90.0f, 0.72f, 2.0f },
        { 30.0f, 75.0f, 0.69f, 4.0f },
        { 25.0f, 65.0f, 0.64f, 7.0f },
        { 20.0f, 55.0f, 0.50f, 11.0f },
        { 15.0f, 45.0f, 0.38f, 18.0f }
    };
}

void AShrinkingZoneActor::BeginPlay()
{
    Super::BeginPlay();
    if (HasAuthority())
    {
        StartNextPhase();
    }
}

void AShrinkingZoneActor::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (!HasAuthority() || !Phases.IsValidIndex(PhaseIndex))
    {
        return;
    }

    PhaseClock += DeltaSeconds;
    const FCPZonePhase& Phase = Phases[PhaseIndex];
    const float MoveStart = Phase.WaitSeconds;
    const float MoveEnd = Phase.WaitSeconds + Phase.ShrinkSeconds;

    if (PhaseClock < MoveStart)
    {
        CurrentDamagePerSecond = Phase.DamagePerSecond;
        return;
    }

    if (PhaseClock < MoveEnd)
    {
        const float Alpha = FMath::Clamp((PhaseClock - MoveStart) / Phase.ShrinkSeconds, 0.0f, 1.0f);
        const FVector2D Center = FMath::Lerp(StartCenter, TargetCenter, Alpha);
        CurrentCenter = FVector(Center.X, Center.Y, 0.0f);
        CurrentRadius = FMath::Lerp(StartRadius, TargetRadius, Alpha);
        CurrentDamagePerSecond = Phase.DamagePerSecond;
        ApplyStormDamage(DeltaSeconds);
        return;
    }

    ++PhaseIndex;
    StartNextPhase();
}

bool AShrinkingZoneActor::IsOutsideZone(FVector WorldLocation) const
{
    const FVector2D P(WorldLocation.X, WorldLocation.Y);
    return FVector2D::Distance(P, FVector2D(CurrentCenter.X, CurrentCenter.Y)) > CurrentRadius;
}

void AShrinkingZoneActor::StartNextPhase()
{
    if (!Phases.IsValidIndex(PhaseIndex))
    {
        return;
    }

    StartCenter = FVector2D(CurrentCenter.X, CurrentCenter.Y);
    StartRadius = CurrentRadius;
    TargetRadius = StartRadius * Phases[PhaseIndex].RadiusMultiplier;

    const float MaxOffset = FMath::Max(0.0f, StartRadius - TargetRadius);
    TargetCenter = StartCenter + ChooseTargetCenter(MaxOffset);
    PhaseClock = 0.0f;
}

FVector2D AShrinkingZoneActor::ChooseTargetCenter(float MaxOffset) const
{
    const float Radius = MaxOffset * 0.8f;
    const float Angle = FMath::FRandRange(0.0f, UE_TWO_PI);
    const float Distance = FMath::Sqrt(FMath::FRand()) * Radius;
    return FVector2D(FMath::Cos(Angle) * Distance, FMath::Sin(Angle) * Distance);
}

void AShrinkingZoneActor::ApplyStormDamage(float DeltaSeconds)
{
    for (FConstPawnIterator It = GetWorld()->GetPawnIterator(); It; ++It)
    {
        APawn* Pawn = It->Get();
        if (!Pawn || !IsOutsideZone(Pawn->GetActorLocation()))
        {
            continue;
        }

        // Production: call the authoritative health component, emit telemetry,
        // and replicate only the resulting damage event to clients.
        const float Damage = CurrentDamagePerSecond * DeltaSeconds;
        Pawn->TakeDamage(Damage, FDamageEvent(), nullptr, this);
    }
}

void AShrinkingZoneActor::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(AShrinkingZoneActor, CurrentCenter);
    DOREPLIFETIME(AShrinkingZoneActor, CurrentRadius);
    DOREPLIFETIME(AShrinkingZoneActor, PhaseIndex);
}
