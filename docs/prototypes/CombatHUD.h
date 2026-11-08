#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "CombatHUD.generated.h"

UCLASS()
class COMBATPROTOCOL_API ACPHUD : public AHUD
{
    GENERATED_BODY()

public:
    virtual void BeginPlay() override;
    virtual void DrawHUD() override;

    UFUNCTION(BlueprintCallable) void ShowHitMarker(bool bHeadshot);
    UFUNCTION(BlueprintCallable) void PushKillFeed(FText Message);

protected:
    UPROPERTY(EditDefaultsOnly) TSubclassOf<UUserWidget> HUDWidgetClass;
    UPROPERTY() TObjectPtr<UUserWidget> HUDWidget;
};
