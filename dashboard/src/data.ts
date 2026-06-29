import {
  Activity,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Code2,
  Database,
  FileClock,
  GitBranch,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Package,
  Settings,
  ShieldAlert,
  Workflow,
} from 'lucide-react';

export const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Engineering', icon: Code2 },
  { label: 'Migration', icon: ClipboardList },
  { label: 'Products', icon: Package },
  { label: 'Integrations', icon: Link2 },
  { label: 'Workflows', icon: Workflow },
  { label: 'Agent Memory', icon: BrainCircuit },
  { label: 'Audit Logs', icon: FileClock },
  { label: 'Settings', icon: Settings },
];

export const systemHealth = [
  { label: 'Overall', value: 'Healthy', tone: 'good' },
  { label: 'Warnings', value: '2', tone: 'warn' },
  { label: 'Critical', value: '0', tone: 'good' },
];

export const agents = [
  { name: 'Executive Agent', status: 'Ready', detail: 'Ecosystem rollups prepared' },
  { name: 'Engineering Agent', status: 'Ready', detail: 'Repository checks staged' },
  { name: 'Migration Agent', status: 'Ready', detail: 'Gym import rules documented' },
  { name: 'Products Agent', status: 'Ready', detail: 'Surface map initialized' },
  { name: 'Operations Agent', status: 'Ready', detail: 'Workflow queue mocked' },
  { name: 'Support Agent', status: 'Planned', detail: 'Awaiting support channels' },
  { name: 'Sales Agent', status: 'Planned', detail: 'Awaiting CRM scope' },
  { name: 'Marketing Agent', status: 'Planned', detail: 'Awaiting campaign sources' },
  { name: 'Finance Agent', status: 'Planned', detail: 'Awaiting reporting rules' },
  { name: 'Analytics Agent', status: 'Planned', detail: 'Awaiting event taxonomy' },
];

export const repositories = [
  { name: 'Vyra-Part-1', state: 'Needs audit', branch: 'main', signal: 'warn' },
  { name: 'Vyra-Software', state: 'Ready to connect', branch: 'main', signal: 'good' },
  { name: 'vyra-website', state: 'Docs pending', branch: 'main', signal: 'warn' },
  { name: 'vyra-agents', state: 'MVP initializing', branch: 'main', signal: 'good' },
];

export const integrations = [
  ['GitHub', 'Ready to connect'],
  ['Supabase', 'Planned read-only'],
  ['Stripe', 'Planned'],
  ['Apple App Store', 'Planned'],
  ['Google Play', 'Planned'],
  ['SendGrid', 'Planned'],
  ['Slack', 'Planned'],
  ['Discord', 'Planned'],
  ['Sentry', 'Planned'],
  ['Apple Health', 'Planned'],
  ['WHOOP', 'Planned'],
  ['Oura', 'Planned'],
];

export const migrationStatus = [
  { label: 'Staged Members', value: '1,284' },
  { label: 'Pending Profiles', value: '938' },
  { label: 'Existing User Matches', value: '214' },
  { label: 'Offline Members', value: '132' },
  { label: 'Warnings', value: '18' },
  { label: 'Ready for Review', value: '86%' },
];

export const workflows = [
  { name: 'daily-ecosystem-audit', status: 'Drafted', owner: 'Executive Agent' },
  { name: 'repo-health-check', status: 'Drafted', owner: 'Engineering Agent' },
  { name: 'migration-import-review', status: 'Drafted', owner: 'Migration Agent' },
  { name: 'migration-validation', status: 'Drafted', owner: 'Migration Agent' },
  { name: 'approval-queue', status: 'Drafted', owner: 'Operations Agent' },
  { name: 'integration-status-check', status: 'Drafted', owner: 'Operations Agent' },
];

export const priorities = [
  'Finalize read-only GitHub integration plan',
  'Define Supabase memory table ownership',
  'Design migration staging import screens',
  'Create approval queue criteria for risky actions',
];

export const recentActivity = [
  'Migration Agent charter created with offline member rules',
  'Supabase memory table stubs prepared',
  'Workflow engine contract documented',
  'Dashboard shell populated with mock command-center data',
];

export const approvals = [
  { item: 'Production deploys', required: 'Future approval required', icon: ShieldAlert },
  { item: 'Database migrations', required: 'Future approval required', icon: Database },
  { item: 'Billing changes', required: 'Future approval required', icon: LockKeyhole },
  { item: 'Customer emails', required: 'Future approval required', icon: Activity },
];

export const ecosystemNodes = [
  'Executive Agent',
  'Engineering Agent',
  'Migration Agent',
  'Supabase',
  'GitHub',
  'Stripe',
  'Mobile App',
  'Desktop Software',
  'Website',
  'Gym Dashboard',
  'Member App',
];

export const summaryStats = [
  { label: 'Agents Prepared', value: '10', icon: CheckCircle2 },
  { label: 'Workflows Drafted', value: '6', icon: Workflow },
  { label: 'Repos Tracked', value: '4', icon: GitBranch },
  { label: 'Integrations Mapped', value: '12', icon: BarChart3 },
];

