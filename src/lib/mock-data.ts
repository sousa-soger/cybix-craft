export type RepoProvider = "github" | "gitlab" | "local-pc" | "company-server";
export type Environment = "DEV" | "QA" | "PROD";
export type PackageStatus = "queued" | "running" | "success" | "failed" | "cancelled";
export type DeploymentStatus = "queued" | "running" | "success" | "failed" | "cancelled";

export type RepoAuthMethod = "oauth" | "pat" | "ssh" | "userpass";

export type TeamRole = "owner" | "maintainer" | "creator" | "deployer" | "viewer";
export type MemberStatus = "active" | "pending";

export interface RepoMember {
  id: string;
  name: string;
  email: string;
  username?: string;
  initials: string;
  role: TeamRole;
  status: MemberStatus;
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  provider: RepoProvider;
  defaultBranch: string;
  branches: string[];
  tags: string[];
  status: "connected" | "expired" | "needs-auth";
  authMethod: RepoAuthMethod;
  lastSyncedAt: string;
  lastVerifiedAt: string;
  ownerId: string;
  members: RepoMember[];
}

export interface PackageItem {
  id: string;
  name: string;
  repositoryId: string;
  baseVersion: string;
  targetVersion: string;
  environment: Environment;
  status: PackageStatus;
  sizeMB: number;
  filesAdded: number;
  filesModified: number;
  filesDeleted: number;
  hasRollback: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Deployment {
  id: string;
  packageId: string;
  packageName: string;
  serverName: string;
  environment: Environment;
  status: DeploymentStatus;
  duration: string;
  deployedBy: string;
  deployedAt: string;
}

export interface Server {
  id: string;
  name: string;
  environment: Environment;
  host: string;
  protocol: "SSH" | "SFTP";
  path: string;
  status: "online" | "offline";
}

const sampleMembers = (overrides: Partial<RepoMember>[] = []): RepoMember[] => {
  const base: RepoMember[] = [
    { id: "m1", name: "Aaron Voon Wu Chun",  email: "aaronvwc@sains.com.my", username: "aaronvwc", initials: "AV", role: "owner",      status: "active" },
    { id: "m2", name: "Audry Mayla Anak Meeta", email: "audrymm@sains.com.my", username: "audrymm",  initials: "AM", role: "maintainer", status: "active" },
    { id: "m3", name: "Goh Ee Cheng",       email: "gohec@sains.com.my",   username: "gohec",   initials: "GE", role: "creator",    status: "active" },
    { id: "m4", name: "Justin Chieng Zen Yue", email: "justinczy@sains.com.my", username: "justinczy", initials: "JC", role: "deployer",  status: "active" },
  ];
  if (!overrides.length) return base;
  return overrides.map((o, i) => ({ ...base[i % base.length], ...o }));
};

export const repositories: Repository[] = [
  {
    id: "r1",
    name: "atlas/web-storefront",
    url: "https://github.com/atlas/web-storefront",
    provider: "github",
    defaultBranch: "main",
    branches: ["main", "develop", "release/4.2", "feature/checkout-v2"],
    tags: ["v4.2.0", "v4.1.3", "v4.1.2", "v4.1.1", "v4.0.0"],
    status: "connected",
    authMethod: "oauth",
    lastSyncedAt: "2h ago",
    lastVerifiedAt: "2h ago",
    ownerId: "m1",
    members: sampleMembers(),
  },
  {
    id: "r2",
    name: "atlas/marketing-site",
    url: "https://gitlab.com/atlas/marketing-site",
    provider: "gitlab",
    defaultBranch: "main",
    branches: ["main", "staging"],
    tags: ["v2.7.0", "v2.6.4"],
    status: "connected",
    authMethod: "pat",
    lastSyncedAt: "1d ago",
    lastVerifiedAt: "1d ago",
    ownerId: "m1",
    members: sampleMembers([{}, {}, {}]),
  },
  {
    id: "r3",
    name: "helios/core-api",
    url: "https://github.com/helios/core-api",
    provider: "github",
    defaultBranch: "main",
    branches: ["main", "develop", "hotfix/auth"],
    tags: ["v8.1.0", "v8.0.2", "v8.0.1"],
    status: "connected",
    authMethod: "oauth",
    lastSyncedAt: "3h ago",
    lastVerifiedAt: "3h ago",
    ownerId: "m2",
    members: sampleMembers(),
  },
  {
    id: "r4",
    name: "helios/graph-gateway",
    url: "git@git.company.internal:helios/graph-gateway.git",
    provider: "company-server",
    defaultBranch: "main",
    branches: ["main", "develop"],
    tags: ["v3.4.0", "v3.3.1"],
    status: "connected",
    authMethod: "ssh",
    lastSyncedAt: "5d ago",
    lastVerifiedAt: "5d ago",
    ownerId: "m1",
    members: sampleMembers([{}, {}]),
  },
  {
    id: "r5",
    name: "nimbus/mobile-client",
    url: "https://gitlab.sains.com.my/soger/test-1",
    provider: "gitlab",
    defaultBranch: "main",
    branches: ["main", "release/ios-7", "release/android-7"],
    tags: ["v7.0.0", "v6.9.2"],
    status: "needs-auth",
    authMethod: "pat",
    lastSyncedAt: "—",
    lastVerifiedAt: "—",
    ownerId: "m3",
    members: sampleMembers([{}, {}, {}]),
  },
  {
    id: "r6",
    name: "orion/admin-dashboard",
    url: "/Users/dana/code/orion-admin",
    provider: "local-pc",
    defaultBranch: "main",
    branches: ["main"],
    tags: ["v1.2.0"],
    status: "expired",
    authMethod: "userpass",
    lastSyncedAt: "12d ago",
    lastVerifiedAt: "12d ago",
    ownerId: "m4",
    members: sampleMembers([{}, {}]),
  },
];

export const packages: PackageItem[] = [
  {
    id: "pkg-001",
    name: "PROD-atlas-web-v4.1.3-to-v4.2.0-20251024-1430",
    repositoryId: "r1",
    baseVersion: "v4.1.3",
    targetVersion: "v4.2.0",
    environment: "PROD",
    status: "success",
    sizeMB: 24.6,
    filesAdded: 18,
    filesModified: 47,
    filesDeleted: 3,
    hasRollback: true,
    createdBy: "Aaron V.",
    createdAt: "2h ago",
  },
  {
    id: "pkg-002",
    name: "QA-helios-api-v8.0.2-to-main-20251024-1112",
    repositoryId: "r3",
    baseVersion: "v8.0.2",
    targetVersion: "main",
    environment: "QA",
    status: "running",
    sizeMB: 0,
    filesAdded: 0,
    filesModified: 0,
    filesDeleted: 0,
    hasRollback: true,
    createdBy: "Audry M.",
    createdAt: "12m ago",
  },
  {
    id: "pkg-003",
    name: "DEV-atlas-web-develop-to-feature-checkout-v2",
    repositoryId: "r1",
    baseVersion: "develop",
    targetVersion: "feature/checkout-v2",
    environment: "DEV",
    status: "success",
    sizeMB: 8.2,
    filesAdded: 12,
    filesModified: 9,
    filesDeleted: 0,
    hasRollback: false,
    createdBy: "Goh E.",
    createdAt: "Yesterday",
  },
  {
    id: "pkg-004",
    name: "PROD-helios-graph-v3.3.1-to-v3.4.0",
    repositoryId: "r4",
    baseVersion: "v3.3.1",
    targetVersion: "v3.4.0",
    environment: "PROD",
    status: "failed",
    sizeMB: 16.1,
    filesAdded: 6,
    filesModified: 22,
    filesDeleted: 1,
    hasRollback: true,
    createdBy: "Justin C.",
    createdAt: "Yesterday",
  },
  {
    id: "pkg-005",
    name: "QA-nimbus-mobile-v6.9.2-to-v7.0.0",
    repositoryId: "r5",
    baseVersion: "v6.9.2",
    targetVersion: "v7.0.0",
    environment: "QA",
    status: "queued",
    sizeMB: 0,
    filesAdded: 0,
    filesModified: 0,
    filesDeleted: 0,
    hasRollback: true,
    createdBy: "Aaron V.",
    createdAt: "3m ago",
  },
  {
    id: "pkg-006",
    name: "DEV-atlas-web-v4.2.0-to-main-20251025-0902",
    repositoryId: "r1",
    baseVersion: "v4.2.0",
    targetVersion: "main",
    environment: "DEV",
    status: "success",
    sizeMB: 5.4,
    filesAdded: 2,
    filesModified: 11,
    filesDeleted: 0,
    hasRollback: true,
    createdBy: "Audry M.",
    createdAt: "1h ago",
  },
  {
    id: "pkg-007",
    name: "QA-atlas-web-release-4.2-hotfix",
    repositoryId: "r1",
    baseVersion: "release/4.2",
    targetVersion: "main",
    environment: "QA",
    status: "running",
    sizeMB: 0,
    filesAdded: 0,
    filesModified: 0,
    filesDeleted: 0,
    hasRollback: true,
    createdBy: "Goh E.",
    createdAt: "20m ago",
  },
  {
    id: "pkg-008",
    name: "DEV-helios-api-hotfix-auth-to-main",
    repositoryId: "r3",
    baseVersion: "hotfix/auth",
    targetVersion: "main",
    environment: "DEV",
    status: "success",
    sizeMB: 3.1,
    filesAdded: 1,
    filesModified: 7,
    filesDeleted: 0,
    hasRollback: false,
    createdBy: "Justin C.",
    createdAt: "4h ago",
  },
  {
    id: "pkg-009",
    name: "PROD-helios-api-v8.0.1-to-v8.1.0",
    repositoryId: "r3",
    baseVersion: "v8.0.1",
    targetVersion: "v8.1.0",
    environment: "PROD",
    status: "success",
    sizeMB: 19.8,
    filesAdded: 9,
    filesModified: 31,
    filesDeleted: 2,
    hasRollback: true,
    createdBy: "Aaron V.",
    createdAt: "2d ago",
  },
];

export const deployments: Deployment[] = [
  { id: "d-401", packageId: "pkg-001", packageName: "PROD-atlas-web-v4.1.3-to-v4.2.0", serverName: "atlas-prod-eu-1", environment: "PROD", status: "success", duration: "1m 42s", deployedBy: "Aaron V.", deployedAt: "1h ago" },
  { id: "d-400", packageId: "pkg-002", packageName: "QA-helios-api-main", serverName: "helios-qa-1", environment: "QA", status: "running", duration: "—", deployedBy: "Audry M.", deployedAt: "Just now" },
  { id: "d-399", packageId: "pkg-003", packageName: "DEV-atlas-web-checkout", serverName: "atlas-dev-1", environment: "DEV", status: "success", duration: "38s", deployedBy: "Goh E.", deployedAt: "Yesterday" },
  { id: "d-398", packageId: "pkg-004", packageName: "PROD-helios-graph-v3.4.0", serverName: "helios-prod-eu-1", environment: "PROD", status: "failed", duration: "2m 14s", deployedBy: "Justin C.", deployedAt: "Yesterday" },
];

export const servers: Server[] = [
  { id: "s1", name: "atlas-prod-eu-1", environment: "PROD", host: "10.20.4.11", protocol: "SSH", path: "/var/www/atlas", status: "online" },
  { id: "s2", name: "atlas-dev-1", environment: "DEV", host: "10.20.4.12", protocol: "SSH", path: "/srv/atlas", status: "online" },
  { id: "s3", name: "helios-qa-1", environment: "QA", host: "10.20.5.21", protocol: "SFTP", path: "/srv/helios", status: "online" },
  { id: "s4", name: "helios-prod-eu-1", environment: "PROD", host: "10.20.5.22", protocol: "SSH", path: "/var/www/helios", status: "offline" },
  { id: "s5", name: "nimbus-stage", environment: "QA", host: "10.20.6.30", protocol: "SSH", path: "/srv/nimbus", status: "online" },
];

// Mock changeset for live intelligence
export interface ChangeSet {
  added: string[];
  modified: string[];
  deleted: string[];
  estimatedSizeMB: number;
}

export function mockChangeset(base: string, target: string): ChangeSet | null {
  if (!base || !target || base === target) return null;
  const seed = (base.length * 7 + target.length * 13) % 60;
  const added = Array.from({ length: 6 + (seed % 12) }, (_, i) => `src/feature-${i + 1}/index.ts`);
  const modified = Array.from({ length: 12 + (seed % 25) }, (_, i) => `src/components/Component${i + 1}.tsx`);
  const deleted = Array.from({ length: seed % 5 }, (_, i) => `src/legacy/old-${i + 1}.ts`);
  const sizeMB = +(8 + (seed % 30) + Math.random() * 4).toFixed(1);
  return { added, modified, deleted, estimatedSizeMB: sizeMB };
}

export const ROLE_META: Record<TeamRole, { label: string; desc: string; color: string }> = {
  owner:      { label: "Owner",           desc: "Full control, billing, role configuration",         color: "from-brand-rose to-brand-iris" },
  maintainer: { label: "Maintainer",      desc: "Configure repository and policies",                 color: "from-brand-iris to-brand-teal" },
  creator:    { label: "Package Creator", desc: "Create packages, cannot deploy to PROD",            color: "from-brand-teal to-brand-iris" },
  deployer:   { label: "Deployer",        desc: "Deploy approved packages to permitted environments", color: "from-brand-rose to-brand-teal" },
  viewer:     { label: "Viewer",          desc: "Read-only access to packages and deployments",      color: "from-brand-iris to-brand-rose" },
};

export const CURRENT_USER_ID = "m1";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string; // tailwind gradient classes
  repositoryIds: string[];
  serverIds: string[];
  memberIds: string[];
  ownerId: string;
  createdAt: string;
}

export const projects: Project[] = [
  {
    id: "p1",
    name: "Atlas",
    description: "Commerce platform — storefront, marketing site and supporting services.",
    color: "from-brand-rose to-brand-iris",
    repositoryIds: ["r1", "r2"],
    serverIds: ["s1", "s2"],
    memberIds: ["m1", "m2", "m3", "m4"],
    ownerId: "m1",
    createdAt: "2025-01-12",
  },
  {
    id: "p2",
    name: "Helios",
    description: "Core API and graph gateway powering internal product suite.",
    color: "from-brand-iris to-brand-teal",
    repositoryIds: ["r3", "r4"],
    serverIds: ["s3", "s4"],
    memberIds: ["m1", "m2", "m3"],
    ownerId: "m2",
    createdAt: "2024-09-03",
  },
  {
    id: "p3",
    name: "Nimbus",
    description: "Mobile client and supporting release pipelines.",
    color: "from-brand-teal to-brand-iris",
    repositoryIds: ["r5"],
    serverIds: ["s5"],
    memberIds: ["m1", "m3", "m4"],
    ownerId: "m3",
    createdAt: "2025-03-21",
  },
  {
    id: "p4",
    name: "Orion",
    description: "Internal admin dashboard and tooling.",
    color: "from-brand-rose to-brand-teal",
    repositoryIds: ["r6"],
    serverIds: [],
    memberIds: ["m1", "m4"],
    ownerId: "m4",
    createdAt: "2025-05-08",
  },
];
