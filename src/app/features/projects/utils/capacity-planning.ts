import { SprintCapacityPlan, SprintCapacitySummary } from '../domain/project-analytics.model';

export function summarizeSprintCapacity(plan: SprintCapacityPlan): SprintCapacitySummary {
  const totalCapacity = plan.members.reduce((total, member) => total + member.weeklyCapacityHours, 0);
  const availableCapacity = plan.members.reduce(
    (total, member) => total + member.weeklyCapacityHours * member.availabilityRate,
    0,
  );
  const focusAdjustedCapacity = availableCapacity * plan.focusFactor;
  const utilizationRate = focusAdjustedCapacity === 0 ? 0 : Math.round((plan.plannedHours / focusAdjustedCapacity) * 100);
  const remainingHours = Math.round(focusAdjustedCapacity - plan.plannedHours);

  return {
    totalCapacity: Math.round(totalCapacity),
    availableCapacity: Math.round(focusAdjustedCapacity),
    plannedHours: plan.plannedHours,
    utilizationRate,
    remainingHours,
    isOverloaded: utilizationRate > 92,
  };
}

export function createBalancedCapacityPlan(overrides: Partial<SprintCapacityPlan> = {}): SprintCapacityPlan {
  return {
    sprintName: 'Sprint Excellence Demo',
    startDate: '2026-06-15',
    endDate: '2026-06-28',
    plannedHours: 126,
    focusFactor: 0.82,
    members: [
      { id: 'm-1', fullName: 'Nour Ghouila', role: 'lead', weeklyCapacityHours: 34, availabilityRate: 0.9 },
      { id: 'm-2', fullName: 'Farouk Ben Ali', role: 'frontend', weeklyCapacityHours: 32, availabilityRate: 0.95 },
      { id: 'm-3', fullName: 'Yasmine Trabelsi', role: 'backend', weeklyCapacityHours: 32, availabilityRate: 0.88 },
      { id: 'm-4', fullName: 'Meriem Sassi', role: 'qa', weeklyCapacityHours: 26, availabilityRate: 0.8 },
      { id: 'm-5', fullName: 'Walid Mansouri', role: 'designer', weeklyCapacityHours: 18, availabilityRate: 0.75 },
    ],
    ...overrides,
  };
}
