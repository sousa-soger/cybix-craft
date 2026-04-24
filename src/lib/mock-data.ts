export type RepoProvider = "github" | "gitlab" | "local-pc" | "company-server";
export type Environment = "DEV" | "QA" | "PROD";
export type PackageStatus = "queued" | "running" | "success" | "failed" | "cancelled";
export type DeploymentStatus = "queued" | "running" | "success" | "failed" | "cancelled";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  repoCount: number;
  lastDeployedAt: string;
}

export interface Repository {
  id: string;
  projectId: string;
  name: string;
  provider: RepoProvider;
  defaultBranch: string;
  branches: string[];
  tags: string[];
  status: "connected" | "expired" | "needs-auth";
}

export interface PackageItem {
  id: string;
  name: string;
  projectId: string;
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

export const projects: Project[] = [
  {
    id: "p1",
    name: "Atlas Web",
    description: "Customer-facing storefront and marketing site",
    color: "from-brand-rose to-brand-iris",
    repoCount: 4,
    lastDeployedAt: "2h ago",
  },
  {
    id: "p2",
    name: "Helios API",
    description: "Core platform REST + GraphQL services",
    color: "from-brand-teal to-brand-iris",
    repoCount: 6,
    lastDeployedAt: "Yesterday",
  },
  {
    id: "p3",
    name: "Nimbus Mobile",
    description: "iOS / Android client release pipelines",
    color: "from-brand-iris to-brand-teal",
    repoCount: 2,
    lastDeployedAt: "3d ago",
  },
  {
    id: "p4",
    name: "Orion Internal",
    description: "Internal tooling & admin dashboards",
    color: "from-brand-rose to-brand-teal",
    repoCount: 3,
    lastDeployedAt: "1w ago",
  },
];

export const repositories: Repository[] = [
  {
    id: "r1",
    projectId: "p1",
    name: "atlas/web-storefront",
    provider: "github",
    defaultBranch: "main",
    branches: ["main", "develop", "release/4.2", "feature/checkout-v2"],
    tags: ["v4.2.0", "v4.1.3", "v4.1.2", "v4.1.1", "v4.0.0"],
    status: "connected",
  },
  {
    id: "r2",
    projectId: "p1",
    name: "atlas/marketing-site",
    provider: "gitlab",
    defaultBranch: "main",
    branches: ["main", "staging"],
    tags: ["v2.7.0", "v2.6.4"],
    status: "connected",
  },
  {
    id: "r3",
    projectId: "p2",
    name: "helios/core-api",
    provider: "github",
    defaultBranch: "main",
    branches: ["main", "develop", "hotfix/auth"],
    tags: ["v8.1.0", "v8.0.2", "v8.0.1"],
    status: "connected",
  },
  {
    id: "r4",
    projectId: "p2",
    name: "helios/graph-gateway",
    provider: "company-server",
    defaultBranch: "main",
    branches: ["main", "develop"],
    tags: ["v3.4.0", "v3.3.1"],
    status: "connected",
  },
  {
    id: "r5",
    projectId: "p3",
    name: "nimbus/mobile-client",
    provider: "gitlab",
    defaultBranch: "main",
    branches: ["main", "release/ios-7", "release/android-7"],
    tags: ["v7.0.0", "v6.9.2"],
    status: "needs-auth",
  },
  {
    id: "r6",
    projectId: "p4",
    name: "orion/admin-dashboard",
    provider: "local-pc",
    defaultBranch: "main",
    branches: ["main"],
    tags: ["v1.2.0"],
    status: "expired",
  },
];

export const packages: PackageItem[] = [
  {
    id: "pkg-001",
    name: "PROD-atlas-web-v4.1.3-to-v4.2.0-20251024-1430",
    projectId: "p1",
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
    createdBy: "Demir A.",
    createdAt: "2h ago",
  },
  {
    id: "pkg-002",
    name: "QA-helios-api-v8.0.2-to-main-20251024-1112",
    projectId: "p2",
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
    createdBy: "Selin K.",
    createdAt: "12m ago",
  },
  {
    id: "pkg-003",
    name: "DEV-atlas-web-develop-to-feature-checkout-v2",
    projectId: "p1",
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
    createdBy: "Mert O.",
    createdAt: "Yesterday",
  },
  {
    id: "pkg-004",
    name: "PROD-helios-graph-v3.3.1-to-v3.4.0",
    projectId: "p2",
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
    createdBy: "Ayşe T.",
    createdAt: "Yesterday",
  },
  {
    id: "pkg-005",
    name: "QA-nimbus-mobile-v6.9.2-to-v7.0.0",
    projectId: "p3",
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
    createdBy: "Demir A.",
    createdAt: "3m ago",
  },
];

export const deployments: Deployment[] = [
  {
    id: "d-401",
    packageId: "pkg-001",
    packageName: "PROD-atlas-web-v4.1.3-to-v4.2.0",
    serverName: "atlas-prod-eu-1",
    environment: "PROD",
    status: "success",
    duration: "1m 42s",
    deployedBy: "Demir A.",
    deployedAt: "1h ago",
  },
  {
    id: "d-400",
    packageId: "pkg-002",
    packageName: "QA-helios-api-main",
    serverName: "helios-qa-1",
    environment: "QA",
    status: "running",
    duration: "—",
    deployedBy: "Selin K.",
    deployedAt: "Just now",
  },
  {
    id: "d-399",
    packageId: "pkg-003",
    packageName: "DEV-atlas-web-checkout",
    serverName: "atlas-dev-1",
    environment: "DEV",
    status: "success",
    duration: "38s",
    deployedBy: "Mert O.",
    deployedAt: "Yesterday",
  },
  {
    id: "d-398",
    packageId: "pkg-004",
    packageName: "PROD-helios-graph-v3.4.0",
    serverName: "helios-prod-eu-1",
    environment: "PROD",
    status: "failed",
    duration: "2m 14s",
    deployedBy: "Ayşe T.",
    deployedAt: "Yesterday",
  },
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
  // Deterministic-ish mock based on string lengths
  const seed = (base.length * 7 + target.length * 13) % 60;
  const added = Array.from({ length: 6 + (seed % 12) }, (_, i) => `src/feature-${i + 1}/index.ts`);
  const modified = Array.from({ length: 12 + (seed % 25) }, (_, i) => `src/components/Component${i + 1}.tsx`);
  const deleted = Array.from({ length: seed % 5 }, (_, i) => `src/legacy/old-${i + 1}.ts`);
  const sizeMB = +(8 + (seed % 30) + Math.random() * 4).toFixed(1);
  return { added, modified, deleted, estimatedSizeMB: sizeMB };
}
