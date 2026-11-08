#include "CombatPlayerCharacter.h"

#include "AbilitySystemComponent.h"
#include "CombatAttributeSet.h"
#include "CombatWeaponComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Net/UnrealNetwork.h"

ACPPlayerCharacter::ACPPlayerCharacter()
{
    bReplicates = true;
    AbilitySystem = CreateDefaultSubobject<UAbilitySystemComponent>(TEXT("AbilitySystem"));
    AbilitySystem->SetIsReplicated(true);
    AbilitySystem->SetReplicationMode(EGameplayEffectReplicationMode::Mixed);
    Attributes = CreateDefaultSubobject<UCombatAttributeSet>(TEXT("Attributes"));
    Weapon = CreateDefaultSubobject<UCombatWeaponComponent>(TEXT("Weapon"));
    GetCharacterMovement()->MaxWalkSpeed = 600.0f;
    GetCharacterMovement()->MaxWalkSpeedCrouched = 320.0f;
}

UAbilitySystemComponent* ACPPlayerCharacter::GetAbilitySystemComponent() const
{
    return AbilitySystem;
}

void ACPPlayerCharacter::PossessedBy(AController* NewController)
{
    Super::PossessedBy(NewController);
    InitializeAbilityActorInfo();
}

void ACPPlayerCharacter::OnRep_PlayerState()
{
    Super::OnRep_PlayerState();
    InitializeAbilityActorInfo();
}

void ACPPlayerCharacter::InitializeAbilityActorInfo()
{
    if (AbilitySystem)
    {
        AbilitySystem->InitAbilityActorInfo(this, this);
    }
}

void ACPPlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);
    PlayerInputComponent->BindAxis(TEXT("MoveForward"), this, &ACPPlayerCharacter::MoveForward);
    PlayerInputComponent->BindAxis(TEXT("MoveRight"), this, &ACPPlayerCharacter::MoveRight);
    PlayerInputComponent->BindAxis(TEXT("LookUp"), this, &ACPPlayerCharacter::LookUp);
    PlayerInputComponent->BindAxis(TEXT("Turn"), this, &ACPPlayerCharacter::Turn);
}

void ACPPlayerCharacter::MoveForward(float Value)
{
    if (FMath::Abs(Value) > KINDA_SMALL_NUMBER) AddMovementInput(GetActorForwardVector(), Value);
}

void ACPPlayerCharacter::MoveRight(float Value)
{
    if (FMath::Abs(Value) > KINDA_SMALL_NUMBER) AddMovementInput(GetActorRightVector(), Value);
}

void ACPPlayerCharacter::LookUp(float Value) { AddControllerPitchInput(Value); }
void ACPPlayerCharacter::Turn(float Value) { AddControllerYawInput(Value); }
void ACPPlayerCharacter::BeginAim() {}
void ACPPlayerCharacter::EndAim() {}

void ACPPlayerCharacter::StartSprint(bool bWantsSprint)
{
    if (!HasAuthority()) return;
    bSprinting = bWantsSprint;
    GetCharacterMovement()->MaxWalkSpeed = bSprinting ? 820.0f : 600.0f;
}

void ACPPlayerCharacter::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(ACPPlayerCharacter, bSprinting);
}
