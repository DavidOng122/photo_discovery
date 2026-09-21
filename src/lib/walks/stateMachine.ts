import { WalkStatus } from "@/types/domain";

const validTransitions: Record<WalkStatus, WalkStatus[]> = {
  DRAFT: ["ANALYZING"],
  ANALYZING: ["ANALYZING", "TAG_SELECTION"],
  TAG_SELECTION: ["RECOMMENDING"],
  RECOMMENDING: ["RECOMMENDING", "COMPLETED"],
  COMPLETED: [],
};

export function canTransitionWalkStatus(
  from: WalkStatus,
  to: WalkStatus
): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}
