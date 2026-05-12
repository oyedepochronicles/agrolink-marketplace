import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  variant?: "default" | "ghost" | "outline";
  compact?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
}

export const LanguageSwitcher = ({
  variant = "ghost",
  compact = true,
  align = "end",
  className,
}: Props) => {
  const { i18n, t } = useTranslation();
  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ??
    SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={compact ? "icon" : "sm"}
          className={cn("gap-2  hover:bg-secondary r", className)}
          aria-label={t("common.language")}
        >
          <Globe className="h-4 w-4 round-full hover:bg-secondary" />
          {!compact && (
            <span className="text-sm font-medium">{current.native}</span>
          )}
          {compact && <span className="sr-only">{current.native}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44 rounded-xl">
        <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => i18n.changeLanguage(l.code)}
            className={cn(
              current.code === l.code &&
                "bg-secondary font-semibold text-primary",
            )}
          >
            {l.native}
            <span className="ml-auto text-xs uppercase text-muted-foreground">
              {l.code}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
