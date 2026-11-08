#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "AttachmentData.h"
#include "CombatWeaponComponent.generated.h"

class UCPAttachmentDefinition;

USTRUCT(BlueprintType)
struct FCPWeaponRuntimeStats
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) float Damage = 26.0f;
    UPROPERTY(BlueprintReadOnly) float RPM = 620.0f;
    UPROPERTY(BlueprintReadOnly) float Spread = 0.009f;
    UPROPERTY(BlueprintReadOnly) float Recoil = 1.0f;
    UPROPERTY(BlueprintReadOnly) float ADS = 1.0f;
    UPROPERTY(BlueprintReadOnly) float Range = 1.0f;
    UPROPERTY(BlueprintReadOnly) int32 Magazine = 30;
    UPROPERTY(BlueprintReadOnly) float ReloadTime = 2.05f;
};

UCLASS(ClassGroup=(CombatProtocol), meta=(BlueprintSpawnableComponent))
class UCombatWeaponComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UCombatWeaponComponent();

    UFUNCTION(Server, Reliable)
    void ServerRequestFire(FVector_NetQuantize10 Origin, FVector_NetQuantizeNormal Direction, uint16 ShotSequence);

    UFUNCTION(BlueprintCallable)
    bool EquipAttachment(const FCPAttachmentData& Attachment);

    UFUNCTION(Server, Reliable)
    void ServerRequestReload();

    UFUNCTION(BlueprintPure)
    bool IsReloading() const { return bReloading; }

    UFUNCTION(BlueprintPure)
    FCPWeaponRuntimeStats GetRuntimeStats() const { return RuntimeStats; }

protected:
    virtual void BeginPlay() override;
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

private:
    UPROPERTY(ReplicatedUsing=OnRep_Attachments)
    TArray<FCPAttachmentData> EquippedAttachments;

    UPROPERTY(Replicated)
    int32 CurrentAmmo = 30;

    UPROPERTY(Replicated)
    uint16 LastAcceptedShotSequence = 0;

    UPROPERTY(Replicated)
    bool bReloading = false;

    UPROPERTY(Replicated)
    float NextAllowedFireServerTime = 0.0f;

    UPROPERTY(EditDefaultsOnly)
    FCPWeaponRuntimeStats BaseStats;

    UPROPERTY(VisibleInstanceOnly)
    FCPWeaponRuntimeStats RuntimeStats;

    UFUNCTION()
    void OnRep_Attachments();

    void RebuildRuntimeStats();
    bool ValidateShot(FVector_NetQuantize10 Origin, FVector_NetQuantizeNormal Direction, uint16 ShotSequence) const;
    void ResolveServerHitscan(const FVector& Origin, const FVector& Direction);
    void FinishReload();
};
