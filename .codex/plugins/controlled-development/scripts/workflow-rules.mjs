const MODERN_PREDECESSORS = new Map([
  ['BOOTSTRAP', [null]],
  ['INTAKE', ['BOOTSTRAP']],
  ['DISCOVER', ['INTAKE']],
  ['TRIAGE', ['DISCOVER']],
  ['DEFINE', ['TRIAGE']],
  ['SPEC APPROVAL', ['DEFINE']],
  ['SOLUTION DESIGN', ['SPEC APPROVAL']],
  ['SOLUTION APPROVAL', ['SOLUTION DESIGN']],
  ['PLAN', ['SOLUTION APPROVAL']],
  ['PLAN APPROVAL', ['PLAN']],
  ['VERIFY', ['BUILD']],
  ['REVIEW', ['VERIFY']],
  ['AUTO-REMEDIATE', ['REVIEW', 'RE-REVIEW']],
  ['RE-VERIFY', ['AUTO-REMEDIATE']],
  ['RE-REVIEW', ['RE-VERIFY']],
  ['LEARNING RETROSPECTIVE', ['REVIEW', 'RE-REVIEW']],
  ['FINAL REPORT', ['BUILD', 'VERIFY', 'REVIEW', 'RE-REVIEW', 'LEARNING RETROSPECTIVE']],
  ['STOP', ['FINAL REPORT']],
]);

const LEGACY_PREDECESSORS = new Map([
  ['BOOTSTRAP', [null]],
  ['INTAKE', ['BOOTSTRAP']],
  ['DISCOVER', ['INTAKE']],
  ['DEFINE', ['DISCOVER']],
  ['SPEC APPROVAL', ['DEFINE']],
  ['PLAN', ['SPEC APPROVAL']],
  ['PLAN APPROVAL', ['PLAN']],
  ['VERIFY', ['BUILD']],
  ['REVIEW', ['VERIFY']],
  ['AUTO-REMEDIATE', ['REVIEW', 'RE-REVIEW']],
  ['RE-VERIFY', ['AUTO-REMEDIATE']],
  ['RE-REVIEW', ['RE-VERIFY']],
  ['LEARNING RETROSPECTIVE', ['REVIEW', 'RE-REVIEW']],
  ['FINAL REPORT', ['BUILD', 'VERIFY', 'REVIEW', 'RE-REVIEW', 'LEARNING RETROSPECTIVE']],
  ['STOP', ['FINAL REPORT']],
]);

const DIRECT_TARGETS = new Map([
  ['BOOTSTRAP', ['INTAKE']],
  ['INTAKE', ['DISCOVER']],
  ['DEFINE', ['SPEC APPROVAL']],
  ['SOLUTION DESIGN', ['SOLUTION APPROVAL']],
  ['SOLUTION APPROVAL', ['PLAN']],
  ['PLAN APPROVAL', ['BUILD']],
  ['BUILD', ['VERIFY', 'FINAL REPORT']],
  ['VERIFY', ['REVIEW', 'FINAL REPORT']],
  ['REVIEW', ['AUTO-REMEDIATE', 'LEARNING RETROSPECTIVE', 'FINAL REPORT']],
  ['AUTO-REMEDIATE', ['RE-VERIFY']],
  ['RE-VERIFY', ['RE-REVIEW']],
  ['RE-REVIEW', ['AUTO-REMEDIATE', 'LEARNING RETROSPECTIVE', 'FINAL REPORT']],
  ['LEARNING RETROSPECTIVE', ['FINAL REPORT']],
  ['FINAL REPORT', ['STOP']],
  ['STOP', []],
]);

export function usesSolutionWorkflow(schemaVersion) {
  return schemaVersion === 2 || schemaVersion === 3;
}

export function planApprovalRequired(state) {
  if (!['quick', 'standard', 'deep'].includes(state.profile) ||
      !['low', 'medium', 'high'].includes(state.riskLevel)) return null;
  if (state.schemaVersion === 1) return state.profile === 'deep' || state.riskLevel !== 'low';
  return state.profile === 'deep' || state.riskLevel === 'high';
}

export function effectivePlanApprovalRequired(state) {
  return planApprovalRequired(state) === true || state.approvals?.plan?.required === true;
}

export function expectedPredecessorsForState(state) {
  if (state.phase === 'BUILD') {
    if (usesSolutionWorkflow(state.schemaVersion) && state.profile === 'quick') return ['TRIAGE'];
    return [effectivePlanApprovalRequired(state) ? 'PLAN APPROVAL' : 'PLAN'];
  }
  const predecessors = state.schemaVersion === 1 ? LEGACY_PREDECESSORS : MODERN_PREDECESSORS;
  return predecessors.get(state.phase) ?? null;
}

export function legalTransitionTargets(state) {
  if (state.phase === 'DISCOVER') return [state.schemaVersion === 1 ? 'DEFINE' : 'TRIAGE'];
  if (state.phase === 'TRIAGE') return state.profile === 'quick' ? ['BUILD'] : ['DEFINE'];
  if (state.phase === 'SPEC APPROVAL') {
    return [usesSolutionWorkflow(state.schemaVersion) ? 'SOLUTION DESIGN' : 'PLAN'];
  }
  if (state.phase === 'PLAN') {
    return [effectivePlanApprovalRequired(state) ? 'PLAN APPROVAL' : 'BUILD'];
  }
  return [...(DIRECT_TARGETS.get(state.phase) ?? [])];
}

export function validateTransitionRequest(state, targetPhase) {
  const targets = legalTransitionTargets(state);
  return targets.includes(targetPhase)
    ? []
    : [`illegal transition from ${state.phase} to ${targetPhase}; expected ${targets.join(' or ') || 'no transition'}`];
}
