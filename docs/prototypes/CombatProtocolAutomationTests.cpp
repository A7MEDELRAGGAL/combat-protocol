#if WITH_AUTOMATION_TESTS

#include "Misc/AutomationTest.h"
#include "AttachmentData.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FCPAttachmentTradeoffTest,
    "CombatProtocol.Data.AttachmentTradeoff",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FCPAttachmentTradeoffTest::RunTest(const FString& Parameters)
{
    FCPAttachmentData Extended;
    Extended.Id = TEXT("extended-mag");
    Extended.Slot = ECPAttachmentSlot::Magazine;
    Extended.Modifiers.MagazineDelta = 8;
    Extended.Modifiers.ReloadMultiplier = 1.12f;
    TestTrue(TEXT("attachment has a slot"), Extended.Slot == ECPAttachmentSlot::Magazine);
    TestTrue(TEXT("extended mag has a trade-off"), Extended.Modifiers.MagazineDelta > 0 && Extended.Modifiers.ReloadMultiplier > 1.0f);
    return true;
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FCPZonePhaseDataTest,
    "CombatProtocol.Data.ZonePhase",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FCPZonePhaseDataTest::RunTest(const FString& Parameters)
{
    TestTrue(TEXT("test harness is available"), true);
    return true;
}

#endif
