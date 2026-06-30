import { pipelineStageLabels } from './salesPipeline';
import type { LeadPriority, LeadStatus, LeadType, PipelineStage, SalesImportResult, SalesLead } from './salesTypes';

const leadTypes: LeadType[] = ['gym', 'coach', 'organization', 'referral'];
const priorities: LeadPriority[] = ['low', 'medium', 'high'];
const statuses: LeadStatus[] = ['active', 'won', 'lost', 'paused'];
const stages = Object.keys(pipelineStageLabels) as PipelineStage[];

export function emptySalesImportResult(): SalesImportResult {
  return { errors: [], importedCount: 0, skippedCount: 0, status: 'idle', warnings: [] };
}

export function parseSalesLeadJson(content: string, existingLeadIds: string[] = []): { leads: SalesLead[]; result: SalesImportResult } {
  try {
    const parsed = JSON.parse(content) as unknown;
    const rows = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.leads) ? parsed.leads : null;
    if (!rows) {
      return errorResult('JSON must be an array of leads or an object with a leads array.');
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const seen = new Set(existingLeadIds);
    const leads: SalesLead[] = [];

    rows.forEach((row, index) => {
      const normalized = normalizeLead(row, index, seen);
      if (normalized.errors.length) {
        errors.push(...normalized.errors);
        return;
      }
      warnings.push(...normalized.warnings);
      if (normalized.lead) {
        seen.add(normalized.lead.id);
        leads.push(normalized.lead);
      }
    });

    if (errors.length) {
      return { leads: [], result: { errors, importedCount: 0, skippedCount: rows.length, status: 'error', warnings } };
    }

    return {
      leads,
      result: { errors: [], importedCount: leads.length, skippedCount: rows.length - leads.length, status: 'success', warnings },
    };
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : 'Invalid JSON import file.');
  }
}

function normalizeLead(row: unknown, index: number, seen: Set<string>): { errors: string[]; lead?: SalesLead; warnings: string[] } {
  const label = `Row ${index + 1}`;
  if (!isRecord(row)) return { errors: [`${label}: lead must be an object.`], warnings: [] };

  const errors: string[] = [];
  const warnings: string[] = [];
  const now = new Date().toISOString();
  const id = stringValue(row.id) || `imported_sales_lead_${Date.now()}_${index}`;
  if (seen.has(id)) errors.push(`${label}: duplicate lead id ${id}.`);

  const leadType = enumValue(row.leadType, leadTypes, 'referral');
  const priority = enumValue(row.priority, priorities, 'medium');
  const status = enumValue(row.status, statuses, 'active');
  const pipelineStage = enumValue(row.pipelineStage, stages, 'new');
  const estimatedValue = numberValue(row.estimatedValue, 0);
  const name = stringValue(row.name);
  const businessName = stringValue(row.businessName) || name;
  const contactName = stringValue(row.contactName);
  const email = stringValue(row.email);
  const phone = stringValue(row.phone);

  if (!name) errors.push(`${label}: name is required.`);
  if (!businessName) errors.push(`${label}: businessName is required.`);
  if (!contactName) warnings.push(`${label}: contactName missing; using business name.`);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(`${label}: email is invalid.`);
  if (estimatedValue < 0) errors.push(`${label}: estimatedValue cannot be negative.`);

  if (errors.length) return { errors, warnings };

  return {
    errors: [],
    warnings,
    lead: {
      businessName,
      contactName: contactName || businessName,
      createdAt: stringValue(row.createdAt) || now,
      currentClients: optionalNumber(row.currentClients),
      email,
      estimatedValue,
      id,
      leadType,
      likelyProductFit: stringValue(row.likelyProductFit),
      location: stringValue(row.location) || 'Unknown',
      memberCount: optionalNumber(row.memberCount),
      name,
      nextAction: stringValue(row.nextAction) || 'Review imported lead',
      nextFollowUpDate: stringValue(row.nextFollowUpDate) || null,
      niche: stringValue(row.niche),
      notes: stringValue(row.notes),
      phone,
      pipelineStage,
      priority,
      source: stringValue(row.source) || 'JSON import',
      status,
      updatedAt: stringValue(row.updatedAt) || now,
    },
  };
}

function errorResult(message: string): { leads: SalesLead[]; result: SalesImportResult } {
  return { leads: [], result: { errors: [message], importedCount: 0, skippedCount: 0, status: 'error', warnings: [] } };
}

function enumValue<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function numberValue(value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(number) ? number : fallback;
}

function optionalNumber(value: unknown): number | undefined {
  const number = numberValue(value, NaN);
  return Number.isFinite(number) ? number : undefined;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
