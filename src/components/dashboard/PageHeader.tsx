import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const PageHeader = ({ title, description, action }: Props) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="font-display text-2xl font-extrabold tracking-tight">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);
