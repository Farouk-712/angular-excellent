import {
  AuditCriterionKey,
  AuditCriterionScore,
  AuditFinding,
  AuditSeverity,
  AuditSession,
  AuditSummary,
} from '../models/quality-audit.models';

const severityWeight: Record<AuditSeverity, number> = {
  [AuditSeverity.Low]: 1,
  [AuditSeverity.Medium]: 2,
  [AuditSeverity.High]: 4,
  [AuditSeverity.Critical]: 7,
};

const criterionLabels: Record<AuditCriterionKey, string> = {
  [AuditCriterionKey.Structure]: 'Architecture Angular',
  [AuditCriterionKey.TemplateQuality]: 'Qualité des templates',
  [AuditCriterionKey.RoutingRendering]: 'Routing et rendu',
  [AuditCriterionKey.StateManagement]: 'Gestion d état',
  [AuditCriterionKey.BackendIntegration]: 'Intégration backend',
  [AuditCriterionKey.Forms]: 'Formulaires',
  [AuditCriterionKey.BusinessLogic]: 'Logique métier',
  [AuditCriterionKey.Crud]: 'CRUD',
  [AuditCriterionKey.Rxjs]: 'RxJS',
  [AuditCriterionKey.DependencyInjection]: 'Injection de dépendances',
  [AuditCriterionKey.CodeHygiene]: 'Hygiène du code',
  [AuditCriterionKey.Maintainability]: 'Maintenabilité',
};

export function clampScore(score: number): number {
  if (Number.isNaN(score)) {
    return 0;
  }

  if (score < 0) {
    return 0;
  }

  if (score > 1) {
    return 1;
  }

  return Math.round(score * 1000) / 1000;
}

export function getSeverityFromScore(score: number): AuditSeverity {
  if (score >= 0.82) {
    return AuditSeverity.Low;
  }

  if (score >= 0.64) {
    return AuditSeverity.Medium;
  }

  if (score >= 0.42) {
    return AuditSeverity.High;
  }

  return AuditSeverity.Critical;
}

export function calculateWeightedGlobalScore(criteria: ReadonlyArray<AuditCriterionScore>): number {
  const totals = criteria.reduce(
    (accumulator, criterion) => {
      const safeWeight = Math.max(0.01, criterion.weight);

      return {
        score: accumulator.score + criterion.score * safeWeight,
        weight: accumulator.weight + safeWeight,
      };
    },
    { score: 0, weight: 0 },
  );

  if (totals.weight <= 0) {
    return 0;
  }

  return clampScore(totals.score / totals.weight);
}

export function calculateTechnicalDebtHours(findings: ReadonlyArray<AuditFinding>): number {
  const unresolvedDebt = findings
    .filter((finding) => !finding.resolved)
    .reduce((total, finding) => {
      const lineSpan = Math.max(1, finding.lineEnd - finding.lineStart + 1);
      const severityImpact = severityWeight[finding.severity];
      const filePenalty = finding.filePath.includes('/shared/') ? 1.2 : 1;

      return total + Math.ceil((lineSpan * severityImpact * filePenalty) / 2);
    }, 0);

  return Math.min(unresolvedDebt, 160);
}

export function buildAuditSummary(session: Pick<AuditSession, 'criteria' | 'findings'>): AuditSummary {
  const globalScore = calculateWeightedGlobalScore(session.criteria);
  const debtHours = calculateTechnicalDebtHours(session.findings);
  const totalFindings = session.findings.length;
  const completedFindings = session.findings.filter((finding) => finding.resolved).length;
  const criticalFindings = session.findings.filter(
    (finding) => finding.severity === AuditSeverity.Critical && !finding.resolved,
  ).length;

  const maintainabilityCriterion = session.criteria.find(
    (criterion) => criterion.key === AuditCriterionKey.Maintainability,
  );

  const maintainabilityIndex = clampScore(
    ((maintainabilityCriterion?.score ?? globalScore) * 0.72) + ((1 - debtHours / 160) * 0.28),
  );

  return {
    globalScore,
    maintainabilityIndex,
    technicalDebtHours: debtHours,
    criticalFindings,
    completedFindings,
    totalFindings,
    generatedAt: new Date().toISOString(),
  };
}

export function groupFindingsByCriterion(
  findings: ReadonlyArray<AuditFinding>,
): Record<AuditCriterionKey, ReadonlyArray<AuditFinding>> {
  return Object.values(AuditCriterionKey).reduce((groups, criterion) => {
    groups[criterion] = findings.filter((finding) => finding.criterion === criterion);
    return groups;
  }, {} as Record<AuditCriterionKey, ReadonlyArray<AuditFinding>>);
}

export function rebuildCriteriaWithFindings(
  criteria: ReadonlyArray<AuditCriterionScore>,
  findings: ReadonlyArray<AuditFinding>,
): ReadonlyArray<AuditCriterionScore> {
  const grouped = groupFindingsByCriterion(findings);

  return criteria.map((criterion) => {
    const relatedFindings = grouped[criterion.key] ?? [];
    const unresolvedPenalty = relatedFindings
      .filter((finding) => !finding.resolved)
      .reduce((penalty, finding) => penalty + severityWeight[finding.severity] * 0.012, 0);

    const resolvedBonus = relatedFindings.some((finding) => finding.resolved) ? 0.018 : 0;
    const score = clampScore(criterion.score - unresolvedPenalty + resolvedBonus);

    return {
      ...criterion,
      score,
      severity: getSeverityFromScore(score),
      explanation: buildCriterionExplanation(criterion.key, score, relatedFindings),
    };
  });
}

export function buildCriterionExplanation(
  key: AuditCriterionKey,
  score: number,
  findings: ReadonlyArray<AuditFinding>,
): string {
  const label = criterionLabels[key];
  const unresolvedCount = findings.filter((finding) => !finding.resolved).length;

  if (score >= 0.82 && unresolvedCount === 0) {
    return `${label} solide avec des signaux Angular cohérents et peu de dette visible.`;
  }

  if (score >= 0.64) {
    return `${label} correct, avec ${unresolvedCount} point(s) à surveiller avant validation finale.`;
  }

  if (score >= 0.42) {
    return `${label} fragile, car plusieurs décisions techniques doivent être stabilisées.`;
  }

  return `${label} prioritaire, car les signaux détectés restent insuffisants pour une revue fiable.`;
}

export function sortFindingsByRisk(findings: ReadonlyArray<AuditFinding>): ReadonlyArray<AuditFinding> {
  return [...findings].sort((left, right) => {
    const severityDelta = severityWeight[right.severity] - severityWeight[left.severity];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    if (left.resolved !== right.resolved) {
      return left.resolved ? 1 : -1;
    }

    return left.filePath.localeCompare(right.filePath);
  });
}

export function filterSessions(
  sessions: ReadonlyArray<AuditSession>,
  text: string,
): ReadonlyArray<AuditSession> {
  const normalizedText = text.trim().toLowerCase();

  if (!normalizedText) {
    return sessions;
  }

  return sessions.filter((session) => {
    const criteriaLabels = session.criteria.map((criterion) => criterion.label.toLowerCase());
    const findingMessages = session.findings.map((finding) => finding.message.toLowerCase());

    return [
      session.repositoryName.toLowerCase(),
      session.branchName.toLowerCase(),
      session.owner.fullName.toLowerCase(),
      ...criteriaLabels,
      ...findingMessages,
    ].some((value) => value.includes(normalizedText));
  });
}

export function createExcellentCriteria(): ReadonlyArray<AuditCriterionScore> {
  return Object.values(AuditCriterionKey).map((key, index) => {
    const baseScore = 0.88 + ((index % 4) * 0.025);
    const score = clampScore(baseScore);

    return {
      key,
      label: criterionLabels[key],
      score,
      weight: key === AuditCriterionKey.BackendIntegration || key === AuditCriterionKey.BusinessLogic ? 0.13 : 0.1,
      severity: getSeverityFromScore(score),
      explanation: buildCriterionExplanation(key, score, []),
      signals: ['standalone: true', 'inject(', 'readonly ', 'ChangeDetectionStrategy.OnPush'],
      recommendations: ['Conserver cette séparation entre la logique métier, le state et le rendu.'],
    };
  });
}
