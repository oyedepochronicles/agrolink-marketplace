import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: Props) => (
  <Card className="flex flex-col items-center justify-center gap-3 rounded-2xl p-12 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow">
      {icon}
    </span>
    <p className="font-semibold">{title}</p>
    {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
    {action}
  </Card>
);
