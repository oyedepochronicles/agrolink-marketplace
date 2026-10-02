import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePreferences, type ThemeChoice } from "@/hooks/usePreferences";
import { cn } from "@/lib/utils";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  variant?: "default" | "ghost" | "outline";
  align?: "start" | "center" | "end";
  className?: string;
}

const OPTIONS: { value: ThemeChoice; icon: typeof Sun; labelKey: string }[] = [
  { value: "light", icon: Sun, labelKey: "theme.light" },
  { value: "dark", icon: Moon, labelKey: "theme.dark" },
  { value: "system", icon: Monitor, labelKey: "theme.system" },
];

/**
 * Accessible Light / Dark / System selector. Persistence (localStorage) and
 * `.dark` toggling are handled by the next-themes provider; authenticated
 * account sync is layered on by `usePreferences` (the shared control used
 * here). Active state is shown with a check icon (not color alone) for a11y.
 */
export const ThemeToggle = ({
  variant = "ghost",
  align = "end",
  className,
}: Props) => {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme } = usePreferences();
  // next-themes is not hydration-safe until mounted; avoid rendering a wrong
  // icon on first paint.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = theme ?? "system";
  const ActiveIcon = !mounted || resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={cn("hover:bg-secondary", className)}
          aria-label={t("theme.label")}
        >
          <ActiveIcon className="h-4 w-4" />
          <span className="sr-only">{t("theme.label")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44 rounded-xl">
        <DropdownMenuLabel>{t("theme.label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map(({ value, icon: Icon, labelKey }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "gap-2",
              mounted &&
                active === value &&
                "bg-secondary font-semibold text-primary",
            )}
          >
            <Icon className="h-4 w-4" />
            {t(labelKey)}
            {mounted && active === value && (
              <Check className="ml-auto h-4 w-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
