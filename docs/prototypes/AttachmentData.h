#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "AttachmentData.generated.h"

UENUM(BlueprintType)
enum class ECPAttachmentSlot : uint8
{
    Optic,
    Barrel,
    Muzzle,
    Magazine,
    Underbarrel,
    Stock,
    Special
};

USTRUCT(BlueprintType)
struct FCPWeaponModifiers
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) float DamageMultiplier = 1.0f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float RPMMultiplier = 1.0f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float SpreadMultiplier = 1.0f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float RecoilMultiplier = 1.0f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float ADSMultiplier = 1.0f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float RangeMultiplier = 1.0f;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 MagazineDelta = 0;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) float ReloadMultiplier = 1.0f;
};

USTRUCT(BlueprintType)
struct FCPAttachmentData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FName Id;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FText DisplayName;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) ECPAttachmentSlot Slot = ECPAttachmentSlot::Optic;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 UnlockWeaponLevel = 1;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FCPWeaponModifiers Modifiers;
};

UCLASS(BlueprintType)
class COMBATPROTOCOL_API UCPAttachmentDefinition : public UPrimaryDataAsset
{
    GENERATED_BODY()

public:
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category="Attachment") FCPAttachmentData Data;

    virtual FPrimaryAssetId GetPrimaryAssetId() const override
    {
        return FPrimaryAssetId(TEXT("CPAttachment"), GetFName());
    }
};
