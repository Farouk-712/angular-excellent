import { createBalancedCapacityPlan, summarizeSprintCapacity } from './capacity-planning';

describe('capacity planning', () => {
  it('calculates adjusted capacity with availability and focus factor', () => {
    const summary = summarizeSprintCapacity(
      createBalancedCapacityPlan({
        plannedHours: 80,
        focusFactor: 0.8,
        members: [
          { id: '1', fullName: 'Nour', role: 'lead', weeklyCapacityHours: 40, availabilityRate: 1 },
          { id: '2', fullName: 'Farouk', role: 'frontend', weeklyCapacityHours: 40, availabilityRate: 0.5 },
        ],
      }),
    );

    expect(summary.totalCapacity).toBe(80);
    expect(summary.availableCapacity).toBe(48);
    expect(summary.plannedHours).toBe(80);
    expect(summary.isOverloaded).toBeTrue();
  });
});
