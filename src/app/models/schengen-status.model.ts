export interface SchengenStatus {
  referenceDate: string;
  usedDays: number;
  remainingDays: number;
  overstayDays: number;
}

export interface TripEvaluation {
  allowed: boolean;
  firstViolationDate: string | null;
  maxUsedDays: number;
}

export interface FutureComplianceCheck {
  willExceedLimit: boolean;
  violationDate: string | null;
  maxUsedDays: number;
}
