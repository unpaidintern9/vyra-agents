import type {
  SalesBuyingCommittee,
  SalesBuyingCommitteeRole,
  SalesContactIntelligence,
  SalesExplainableEvaluation,
  SalesOpportunity,
  SalesOrganizationDuplicateCandidate,
  SalesOrganizationIntelligence,
  SalesOrganizationIntelligenceStore,
  SalesOrganizationIntelligenceSummary,
  SalesRelationshipEdge,
  SalesResearchIntakeItem,
  SalesWorkflowRecord,
} from './salesTypes';

const requiredRoles: SalesBuyingCommitteeRole[] = ['Owner', 'Decision Maker', 'Operations', 'Finance'];

export function buildSalesOrganizationIntelligence(input: {
  opportunities: SalesOpportunity[];
  researchIntake: SalesResearchIntakeItem[];
  workflows: SalesWorkflowRecord[];
}): SalesOrganizationIntelligenceStore {
  const contacts = input.opportunities.flatMap((opportunity) => contactsForOpportunity(opportunity));
  const organizations = input.opportunities.map((opportunity) => organizationForOpportunity(opportunity, contacts, input.researchIntake, input.workflows));
  const buyingCommittees = organizations.map((organization) => committeeForOrganization(organization, contacts));
  const relationshipEdges = buildRelationshipEdges(organizations, contacts, input.researchIntake, input.workflows);
  const organizationDuplicateCandidates = detectOrganizationDuplicates(organizations);
  const contactDuplicateCandidates = detectContactDuplicates(contacts);
  const summary = summarizeOrganizationIntelligence(organizations, contacts, buyingCommittees, organizationDuplicateCandidates, contactDuplicateCandidates);
  return {
    buyingCommittees,
    contactDuplicateCandidates,
    contacts,
    generatedAt: new Date().toISOString(),
    localOnly: true,
    organizationDuplicateCandidates,
    organizations,
    relationshipEdges,
    summary,
  };
}

function organizationForOpportunity(
  opportunity: SalesOpportunity,
  contacts: SalesContactIntelligence[],
  researchIntake: SalesResearchIntakeItem[],
  workflows: SalesWorkflowRecord[],
): SalesOrganizationIntelligence {
  const organizationId = `org:${opportunity.id}`;
  const orgContacts = contacts.filter((contact) => contact.organizationId === organizationId);
  const intake = researchIntake.filter((item) => item.opportunityId === opportunity.id);
  const relatedWorkflows = workflows.filter((workflow) => workflow.opportunityId === opportunity.id);
  const relationshipHealth = orgContacts.length ? average(orgContacts.map((contact) => contact.relationshipStrength)) : 25;
  const buyingReadiness = clamp((opportunity.icpScore + opportunity.score.overallScore + opportunity.proposalPreparationStatus.readinessPercent) / 3);
  const confidence = clamp((opportunity.score.confidence + average(intake.map((item) => item.confidence)) + (orgContacts.length ? 80 : 35)) / (intake.length ? 3 : 2));
  const riskRating = relatedWorkflows.some((workflow) => workflow.status === 'blocked') || !orgContacts.length ? 'high' : confidence < 70 ? 'medium' : 'low';
  const domain = primaryDomain(opportunity.website);
  const timeline = [
    event(organizationId, 'created', 'Organization created', 'Derived from local opportunity record.', opportunity.createdAt),
    event(organizationId, 'opportunity_created', 'Opportunity linked', `${opportunity.company} linked to ${opportunity.stage.replace(/_/g, ' ')} stage.`, opportunity.createdAt),
    ...orgContacts.map((contact) => event(organizationId, 'contact_added', 'Contact added', contact.preferredName || `${contact.firstName} ${contact.lastName}`.trim(), opportunity.createdAt)),
    ...intake.map((item) => event(organizationId, 'research_imported', 'Research imported', item.summary, item.date)),
    ...relatedWorkflows.map((workflow) => event(organizationId, 'workflow_update', workflow.type.replace(/_/g, ' '), workflow.requestedAction, workflow.updatedAt)),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    additionalLocations: [],
    buyingReadiness,
    businessType: opportunity.companySizeEstimate,
    confidence,
    contacts: orgContacts,
    currentSalesStage: opportunity.stage,
    dbaNames: [],
    description: opportunity.notes[0] ?? 'Local organization intelligence record.',
    duplicateCandidateIds: [],
    estimatedEmployeeRange: opportunity.companySizeEstimate,
    estimatedRevenueRange: `$${Math.max(25_000, opportunity.score.overallScore * 1000).toLocaleString()} - $${Math.max(50_000, opportunity.score.overallScore * 1750).toLocaleString()}`,
    evaluations: evaluationsFor(opportunity, relationshipHealth, confidence, orgContacts, relatedWorkflows),
    foundedYear: null,
    headquarters: opportunity.location,
    icpScore: opportunity.icpScore,
    industry: opportunity.industry,
    internalNotes: opportunity.notes,
    legalName: opportunity.company,
    naics: opportunity.naics,
    opportunityIds: [opportunity.id],
    opportunityScore: opportunity.score.overallScore,
    organizationId,
    ownershipType: 'Manual verification required',
    primaryDomain: domain,
    priority: opportunity.priority,
    relationshipGraphNodeIds: [`organization:${organizationId}`, ...orgContacts.map((contact) => `contact:${contact.contactId}`), ...relatedWorkflows.map((workflow) => `workflow:${workflow.id}`)],
    relationshipHealth,
    reports: opportunity.generatedReports,
    riskRating,
    serviceAreas: [opportunity.city, opportunity.state].filter(Boolean),
    sic: '',
    subIndustry: opportunity.industry,
    technologyProfile: {
      analytics: 'manual',
      crm: 'manual',
      fitnessSoftware: 'manual',
      marketingPlatform: 'manual',
      otherTechnologies: 'manual',
      paymentPlatform: 'manual',
      schedulingPlatform: 'manual',
      websitePlatform: domain ? 'public website present' : 'manual',
    },
    timeline,
    website: opportunity.website,
  };
}

function contactsForOpportunity(opportunity: SalesOpportunity): SalesContactIntelligence[] {
  const organizationId = `org:${opportunity.id}`;
  const sourceContacts = opportunity.contacts.length ? opportunity.contacts : [{ name: 'Owner/operator TBD', role: 'Decision Maker', email: opportunity.email, phone: opportunity.phone }];
  return sourceContacts.map((contact, index) => {
    const parts = contact.name && contact.name !== 'Owner/operator TBD' ? contact.name.split(/\s+/) : ['Unknown', 'Contact'];
    const confidence = contact.email || contact.phone ? 76 : 35;
    const decisionAuthority = /owner|ceo|president|decision/i.test(contact.role) ? 'high' : contact.role ? 'medium' : 'unknown';
    const contactId = `contact:${opportunity.id}:${index}`;
    return {
      buyingInfluence: decisionAuthority === 'high' ? 85 : 55,
      championScore: contact.email || contact.phone ? 62 : 25,
      confidence,
      contactId,
      decisionAuthority,
      department: /coach|gym/i.test(contact.role) ? 'Operations' : 'Executive',
      email: contact.email,
      firstName: parts[0] ?? 'Unknown',
      lastInteraction: null,
      lastName: parts.slice(1).join(' '),
      linkedin: '',
      nextFollowUp: opportunity.followUpPlan.recommendedTimeframe,
      notes: ['Manual contact verification required before outreach.'],
      organizationId,
      phone: contact.phone,
      preferredCommunication: contact.email ? 'email' : contact.phone ? 'phone' : 'unknown',
      preferredName: contact.name,
      relationshipStrength: contact.email || contact.phone ? 58 : 20,
      riskScore: contact.email || contact.phone ? 30 : 78,
      timeline: [
        {
          contactId,
          detail: `Contact record derived from ${opportunity.company}.`,
          id: `contact-created:${contactId}`,
          timestamp: opportunity.createdAt,
          title: 'Contact created',
          type: 'created',
        },
      ],
      title: contact.role,
    };
  });
}

function committeeForOrganization(organization: SalesOrganizationIntelligence, contacts: SalesContactIntelligence[]): SalesBuyingCommittee {
  const orgContacts = contacts.filter((contact) => contact.organizationId === organization.organizationId);
  const roles = orgContacts.flatMap((contact) => rolesForContact(contact).map((role) => ({ contactId: contact.contactId, confidence: contact.confidence, evidence: contact.title || 'Derived from local opportunity contact role.', role })));
  const filled = new Set(roles.map((role) => role.role));
  const missingRoles = requiredRoles.filter((role) => !filled.has(role));
  return {
    completenessScore: clamp(((requiredRoles.length - missingRoles.length) / requiredRoles.length) * 100),
    missingRoles,
    organizationId: organization.organizationId,
    roles,
  };
}

function rolesForContact(contact: SalesContactIntelligence): SalesBuyingCommitteeRole[] {
  const roles: SalesBuyingCommitteeRole[] = [];
  if (/owner/i.test(contact.title) || contact.decisionAuthority === 'high') roles.push('Owner', 'Decision Maker');
  if (/manager|operations/i.test(contact.title)) roles.push('Operations', 'Gym Manager');
  if (!roles.length) roles.push('Influencer');
  if (contact.championScore >= 60) roles.push('Champion');
  return Array.from(new Set(roles));
}

function buildRelationshipEdges(
  organizations: SalesOrganizationIntelligence[],
  contacts: SalesContactIntelligence[],
  researchIntake: SalesResearchIntakeItem[],
  workflows: SalesWorkflowRecord[],
): SalesRelationshipEdge[] {
  return [
    ...contacts.map((contact) => edge(contact.organizationId, contact.contactId, 'has_contact', `${contact.preferredName || contact.firstName} belongs to this organization.`)),
    ...organizations.flatMap((organization) => organization.opportunityIds.map((id) => edge(organization.organizationId, id, 'has_opportunity', 'Organization owns this local opportunity.'))),
    ...researchIntake.map((item) => edge(`org:${item.opportunityId}`, item.id, 'has_research', item.summary)),
    ...workflows.map((workflow) => edge(`org:${workflow.opportunityId}`, workflow.id, 'has_workflow', workflow.requestedAction)),
  ];
}

function evaluationsFor(opportunity: SalesOpportunity, relationshipHealth: number, confidence: number, contacts: SalesContactIntelligence[], workflows: SalesWorkflowRecord[]): SalesOrganizationIntelligence['evaluations'] {
  const committee = contacts.length ? 50 + Math.min(50, contacts.length * 20) : 15;
  const decisionMaker = contacts.some((contact) => contact.decisionAuthority === 'high') ? 85 : contacts.length ? 45 : 10;
  const proposal = opportunity.proposalPreparationStatus.readinessPercent;
  const blocked = workflows.some((workflow) => workflow.status === 'blocked');
  return {
    buyingCommitteeCompleteness: evaluation(committee, confidence, ['Committee inferred from local contacts.'], contacts.length ? [] : ['No verified contacts yet.'], ['Add owner, operations, and finance roles.']),
    decisionMakerCoverage: evaluation(decisionMaker, confidence, ['Decision authority is inferred from contact title/role.'], decisionMaker < 70 ? ['Decision maker not verified.'] : [], ['Verify owner/operator contact path.']),
    organizationHealth: evaluation(clamp((opportunity.icpScore + relationshipHealth + confidence) / 3), confidence, ['Strong local ICP and opportunity signals.'], blocked ? ['Blocked workflow exists.'] : [], ['Resolve blocked handoffs before external action.']),
    proposalReadiness: evaluation(proposal, confidence, [`Proposal readiness is ${proposal}%.`], proposal < 70 ? ['Proposal inputs incomplete.'] : [], ['Complete missing proposal requirements.']),
    relationshipHealth: evaluation(relationshipHealth, confidence, ['Relationship strength is based on verified contact paths and follow-up state.'], relationshipHealth < 50 ? ['Relationship is thin.'] : [], ['Add decision maker and next interaction notes.']),
    salesReadiness: evaluation(clamp((opportunity.score.overallScore + proposal + decisionMaker) / 3), confidence, ['Sales readiness combines opportunity score, proposal readiness, and decision maker coverage.'], blocked ? ['Manual gate blocks progress.'] : [], ['Use local workflow handoff before any external action.']),
  };
}

function evaluation(score: number, confidence: number, reasons: string[], risks: string[], recommendations: string[]): SalesExplainableEvaluation {
  return { confidence, nextActions: recommendations, recommendations, reasons, risks, score: clamp(score) };
}

function summarizeOrganizationIntelligence(
  organizations: SalesOrganizationIntelligence[],
  contacts: SalesContactIntelligence[],
  committees: SalesBuyingCommittee[],
  orgDuplicates: SalesOrganizationDuplicateCandidate[],
  contactDuplicates: SalesOrganizationDuplicateCandidate[],
): SalesOrganizationIntelligenceSummary {
  return {
    averageBuyingCommitteeCompleteness: average(committees.map((committee) => committee.completenessScore)),
    averageRelationshipHealth: average(organizations.map((organization) => organization.relationshipHealth)),
    contactMaintenanceQueue: contacts.filter((contact) => contact.confidence < 60 || !contact.email || !contact.phone).length,
    decisionMakerCoverage: average(organizations.map((organization) => organization.evaluations.decisionMakerCoverage.score)),
    duplicateContactCandidates: contactDuplicates.length,
    duplicateOrganizationCandidates: orgDuplicates.length,
    executiveRelationshipRisks: organizations.filter((organization) => organization.riskRating === 'high').length,
    highValueOrganizations: organizations.filter((organization) => organization.opportunityScore >= 85 || organization.icpScore >= 85).length,
    incompleteBuyingCommittees: committees.filter((committee) => committee.completenessScore < 75).length,
    largestOpportunityValue: Math.max(0, ...organizations.map((organization) => organization.opportunityScore * 125)),
    missingDecisionMakers: organizations.filter((organization) => organization.evaluations.decisionMakerCoverage.score < 70).length,
    organizationsMissingContacts: organizations.filter((organization) => !organization.contacts.length || organization.contacts.every((contact) => !contact.email && !contact.phone)).length,
    organizationsTracked: organizations.length,
    relationshipFollowUps: contacts.filter((contact) => contact.nextFollowUp).length,
    totalContacts: contacts.length,
  };
}

function detectOrganizationDuplicates(organizations: SalesOrganizationIntelligence[]): SalesOrganizationDuplicateCandidate[] {
  const candidates: SalesOrganizationDuplicateCandidate[] = [];
  for (let i = 0; i < organizations.length; i += 1) {
    for (let j = i + 1; j < organizations.length; j += 1) {
      const left = organizations[i];
      const right = organizations[j];
      const fields = [normalize(left.legalName) === normalize(right.legalName) ? 'company name' : null, left.primaryDomain && left.primaryDomain === right.primaryDomain ? 'domain' : null].filter(Boolean) as string[];
      if (fields.length) candidates.push(duplicate('organization', left.organizationId, left.legalName, right.organizationId, right.legalName, fields));
    }
  }
  return candidates;
}

function detectContactDuplicates(contacts: SalesContactIntelligence[]): SalesOrganizationDuplicateCandidate[] {
  const candidates: SalesOrganizationDuplicateCandidate[] = [];
  for (let i = 0; i < contacts.length; i += 1) {
    for (let j = i + 1; j < contacts.length; j += 1) {
      const left = contacts[i];
      const right = contacts[j];
      const fields = [left.email && left.email === right.email ? 'email' : null, left.phone && left.phone === right.phone ? 'phone' : null, normalize(`${left.firstName}${left.lastName}`) === normalize(`${right.firstName}${right.lastName}`) ? 'name' : null].filter(Boolean) as string[];
      if (fields.length) candidates.push(duplicate('contact', left.contactId, left.preferredName, right.contactId, right.preferredName, fields));
    }
  }
  return candidates;
}

function duplicate(type: 'organization' | 'contact', leftId: string, leftLabel: string, rightId: string, rightLabel: string, fields: string[]): SalesOrganizationDuplicateCandidate {
  return { confidence: Math.min(95, 55 + fields.length * 20), fields, id: `duplicate:${type}:${leftId}:${rightId}`, leftId, leftLabel, reason: `Shared ${fields.join(', ')} requires manual review.`, reviewAction: 'Review Duplicate', rightId, rightLabel, type };
}

function event(organizationId: string, type: SalesOrganizationIntelligence['timeline'][number]['type'], title: string, detail: string, timestamp: string) {
  return { detail, id: `${type}:${organizationId}:${timestamp}`, organizationId, timestamp, title, type };
}

function edge(from: string, to: string, relationship: string, explanation: string): SalesRelationshipEdge {
  return { explanation, from, id: `${relationship}:${from}->${to}`, relationship, to };
}

function primaryDomain(value: string) {
  return value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}
