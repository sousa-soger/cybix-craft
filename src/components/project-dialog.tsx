import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRAND_GRADIENT_OPTIONS, type Project } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project | null;
  onSubmit: (p: { name: string; description: string; color: string }) => void;
}

export const ProjectDialog = ({ open, onOpenChange, project, onSubmit }: ProjectDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(BRAND_GRADIENT_OPTIONS[0].value);

  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setColor(project?.color ?? BRAND_GRADIENT_OPTIONS[0].value);
    }
  }, [open, project]);

  const isEdit = !!project;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="brand-soft-bg px-6 py-5 border-b border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl">{isEdit ? "Edit project" : "Create project"}</DialogTitle>
            <DialogDescription>
              Projects group related repositories and deployments under one umbrella.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label>Project name</Label>
            <Input placeholder="e.g. Atlas Web" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="What does this project ship?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Accent gradient</Label>
            <div className="flex flex-wrap gap-2">
              {BRAND_GRADIENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setColor(opt.value)}
                  className={cn(
                    "h-10 w-10 rounded-lg bg-gradient-to-br transition-base ring-offset-background",
                    opt.value,
                    color === opt.value
                      ? "ring-2 ring-primary ring-offset-2 scale-105"
                      : "hover:scale-105 opacity-80",
                  )}
                  aria-label={opt.id}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/30">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            disabled={!name.trim()}
            onClick={() => {
              onSubmit({ name: name.trim(), description: description.trim(), color });
              onOpenChange(false);
            }}
          >
            {isEdit ? "Save changes" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
