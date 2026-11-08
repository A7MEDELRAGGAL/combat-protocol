#include "CombatGameMode.h"

#include "CombatPlayerState.h"
#include "CombatGameState.h"
#include "GameFramework/PlayerController.h"
#include "Net/UnrealNetwork.h"

ACPGameMode::ACPGameMode()
{
    PrimaryActorTick.bCanEverTick = true;
    PlayerStateClass = ACPPlayerState::StaticClass();
    GameStateClass = ACPGameState::StaticClass();
}

void ACPGameMode::BeginPlay()
{
    Super::BeginPlay();
    RemainingSeconds = MatchDurationSeconds;
    StartMatchPhase();
}

void ACPGameMode::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (!HasAuthority() || MatchPhase != ECPMatchPhase::Live) return;
    RemainingSeconds = FMath::Max(0.0f, RemainingSeconds - DeltaSeconds);
    if (ACPGameState* State = GetGameState<ACPGameState>())
    {
        State->RemainingSeconds = RemainingSeconds;
    }
    EvaluateWinCondition();
    if (RemainingSeconds <= 0.0f) EndMatchPhase();
}

void ACPGameMode::PostLogin(APlayerController* NewPlayer)
{
    Super::PostLogin(NewPlayer);
    // Production: assign team using party affinity, balance, and backfill policy.
}

void ACPGameMode::Logout(AController* Exiting)
{
    Super::Logout(Exiting);
    // Production: preserve reconnect token and remove player from active score.
}

void ACPGameMode::StartMatchPhase()
{
    if (!HasAuthority()) return;
    MatchPhase = ECPMatchPhase::Live;
    RemainingSeconds = MatchDurationSeconds;
    if (ACPGameState* State = GetGameState<ACPGameState>())
    {
        State->MatchPhase = static_cast<uint8>(MatchPhase);
        State->RemainingSeconds = RemainingSeconds;
    }
}

void ACPGameMode::EndMatchPhase()
{
    if (!HasAuthority()) return;
    MatchPhase = ECPMatchPhase::PostMatch;
    if (ACPGameState* State = GetGameState<ACPGameState>())
    {
        State->MatchPhase = static_cast<uint8>(MatchPhase);
        State->RemainingSeconds = RemainingSeconds;
    }
    // Production: freeze score, submit signed result, and begin result grace period.
}

void ACPGameMode::EvaluateWinCondition()
{
    // Production: aggregate team score from PlayerState and resolve target score.
    if (TargetScore <= 0) EndMatchPhase();
}
