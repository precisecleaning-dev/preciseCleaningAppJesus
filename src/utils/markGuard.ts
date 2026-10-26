export type MarkDecision = 'apply' | 'alreadyApplied' | 'conflict';

interface MarkDecisionInput {
    isFinishMark: boolean;
    currentValue: unknown;
    desiredValue: string | null;
    expectedValue: string | null;
    hasStart: boolean;
}

export const decideMark = ({ isFinishMark, currentValue, desiredValue, expectedValue, hasStart }: MarkDecisionInput): MarkDecision => {
    if (currentValue === desiredValue) return 'alreadyApplied';
    if (currentValue !== expectedValue) return 'conflict';
    if (isFinishMark && desiredValue && !hasStart) return 'conflict';
    return 'apply';
};
