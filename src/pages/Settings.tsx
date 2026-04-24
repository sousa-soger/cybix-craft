import { AppShell } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Settings = () => (
  <AppShell title="Settings" subtitle="Workspace and security preferences.">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
      <section className="section-card p-6">
        <h3 className="text-sm font-semibold mb-1">Deployment policies</h3>
        <p className="text-xs text-muted-foreground mb-5">Configure who can deploy and where one-click is allowed.</p>
        <div className="space-y-4">
          {[
            { label: "Allow one-click deploy in DEV", desc: "Skip confirmation for development environments", on: true },
            { label: "Allow one-click deploy in QA", desc: "Skip confirmation for QA environments", on: false },
            { label: "Require confirmation for PROD", desc: "Always require explicit confirmation", on: true },
            { label: "Auto-generate rollback packages", desc: "Always create reverse packages", on: true },
          ].map((opt) => (
            <div key={opt.label} className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">{opt.label}</Label>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <Switch defaultChecked={opt.on} />
            </div>
          ))}
        </div>
      </section>

      <section className="section-card p-6">
        <h3 className="text-sm font-semibold mb-1">Security</h3>
        <p className="text-xs text-muted-foreground mb-5">Credential and session controls. Server credentials are stored on the backend only.</p>
        <div className="space-y-4">
          {[
            { label: "Enforce SSO for all members", desc: "Single sign-on via your IdP", on: true },
            { label: "Require MFA for PROD deploys", desc: "Step-up authentication for production", on: true },
            { label: "Rotate service account keys monthly", desc: "Automatic rotation of backend credentials", on: false },
          ].map((opt) => (
            <div key={opt.label} className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">{opt.label}</Label>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <Switch defaultChecked={opt.on} />
            </div>
          ))}
        </div>
      </section>
    </div>
  </AppShell>
);

export default Settings;
