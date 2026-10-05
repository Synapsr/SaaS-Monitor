import * as Haptics from "expo-haptics";
import { isMrrIncrease, momentCelebration, type Moment } from "@/contract/display/moments";

/**
 * What a moment feels like in the hand, where a wall plays its sound: a success for money and
 * milestones (twice), a tap for a new customer, a soft one for a loss.
 */
export function playMomentHaptic(moment: Moment): void {
  const play = (task: Promise<void>) => task.catch(() => {});
  if (moment.kind === "milestone") {
    void play(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    setTimeout(() => void play(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)), 320);
    return;
  }
  if (momentCelebration(moment) !== null) {
    void play(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    return;
  }
  const loss =
    (moment.kind === "movement" && !isMrrIncrease(moment.movement)) ||
    (moment.kind === "summary" && moment.mrrChange < 0);
  void play(Haptics.impactAsync(loss ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Light));
}
