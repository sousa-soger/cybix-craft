import { AppShell } from "@/components/app-shell";
import { CreatePackage } from "@/components/create-package";

const CreatePage = () => (
  <AppShell
    title="Quick Create Package"
    subtitle="Generate update and rollback packages in one place."
  >
    <CreatePackage />
  </AppShell>
);

export default CreatePage;
