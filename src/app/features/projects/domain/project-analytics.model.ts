import { Project, ProjectPriority, ProjectStatus } from './project.model';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type DeliveryHealth = 'excellent' | 'healthy' | 'attention' | 'risky';

export interface ProjectRiskFactor {
  readonly code: string;
  readonly label: string;
  readonly weight: number;
  readonly active: boolean;
  readonly recommendation: string;
}

export interface ProjectRiskAssessment {
  readonly projectId: string;
  readonly riskLevel: RiskLevel;
  readonly score: number;
  readonly health: DeliveryHealth;
  readonly factors: readonly ProjectRiskFactor[];
  readonly generatedAt: string;
}

export interface SprintCapacityMember {
  readonly id: string;
  readonly fullName: string;
  readonly role: 'frontend' | 'backend' | 'qa' | 'designer' | 'lead';
  readonly weeklyCapacityHours: number;
  readonly availabilityRate: number;
}

export interface SprintCapacityPlan {
  readonly sprintName: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly members: readonly SprintCapacityMember[];
  readonly plannedHours: number;
  readonly focusFactor: number;
}

export interface SprintCapacitySummary {
  readonly totalCapacity: number;
  readonly availableCapacity: number;
  readonly plannedHours: number;
  readonly utilizationRate: number;
  readonly remainingHours: number;
  readonly isOverloaded: boolean;
}

export interface PortfolioSummary {
  readonly totalProjects: number;
  readonly totalBudget: number;
  readonly averageProgress: number;
  readonly blockedProjects: number;
  readonly highPriorityProjects: number;
  readonly statusDistribution: Record<ProjectStatus, number>;
  readonly priorityDistribution: Record<ProjectPriority, number>;
}

export interface ProjectAnalyticsViewModel {
  readonly portfolio: PortfolioSummary;
  readonly risks: readonly ProjectRiskAssessment[];
  readonly capacity: SprintCapacitySummary;
  readonly topRiskProjects: readonly Project[];
  readonly generatedAt: string;
}
