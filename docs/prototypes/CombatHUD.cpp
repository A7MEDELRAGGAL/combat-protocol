#include "CombatHUD.h"

#include "Blueprint/UserWidget.h"

void ACPHUD::BeginPlay()
{
    Super::BeginPlay();
    if (HUDWidgetClass)
    {
        HUDWidget = CreateWidget<UUserWidget>(GetWorld(), HUDWidgetClass);
        if (HUDWidget) HUDWidget->AddToViewport(0);
    }
}

void ACPHUD::DrawHUD()
{
    Super::DrawHUD();
    // Keep gameplay HUD in UMG. DrawHUD is reserved for debug/profiling overlays.
}

void ACPHUD::ShowHitMarker(bool bHeadshot)
{
    // Production: call a typed UMG interface with headshot style and duration.
}

void ACPHUD::PushKillFeed(FText Message)
{
    // Production: route through a bounded kill-feed widget, not unbounded children.
}
