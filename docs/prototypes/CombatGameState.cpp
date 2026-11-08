#include "CombatGameState.h"

#include "Net/UnrealNetwork.h"

void ACPGameState::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(ACPGameState, MatchPhase);
    DOREPLIFETIME(ACPGameState, RemainingSeconds);
    DOREPLIFETIME(ACPGameState, TeamScore);
}
