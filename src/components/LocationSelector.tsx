import {
  citiesForLga,
  lgasForState,
  locationError,
  NIGERIAN_STATES,
  type NigerianLocationValue,
} from "@/lib/nigerianLocations";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMemo } from "react";

interface LocationSelectorProps {
  value: NigerianLocationValue;
  onChange: (value: NigerianLocationValue) => void;
  label?: string;
  addressLabel?: string;
  required?: boolean;
  showLandmark?: boolean;
  className?: string;
  errors?: Partial<Record<keyof NigerianLocationValue | "root", string>>;
}

const EMPTY = "__empty__";

export const LocationSelector = ({
  value,
  onChange,
  label = "Location",
  addressLabel = "Detailed address",
  required = true,
  showLandmark = true,
  className,
  errors = {},
}: LocationSelectorProps) => {
  const lgas = useMemo(() => lgasForState(value.state), [value.state]);
  const cities = useMemo(
    () => citiesForLga(value.state, value.lga),
    [value.state, value.lga],
  );
  const inferredError = required ? locationError(value) : undefined;

  const setState = (state: string) => {
    onChange({
      ...value,
      state,
      lga: "",
      city: "",
    });
  };

  const setLga = (lga: string) => {
    onChange({
      ...value,
      lga,
      city: "",
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <Label>{label}</Label>
        {(errors.root || inferredError) && (
          <p className="mt-1 text-xs text-destructive">
            {errors.root || inferredError}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">State{required ? " *" : ""}</Label>
          <Select value={value.state || undefined} onValueChange={setState}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {NIGERIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-xs text-destructive">{errors.state}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">LGA{required ? " *" : ""}</Label>
          <Select
            value={value.lga || undefined}
            onValueChange={setLga}
            disabled={!value.state}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={value.state ? "Select LGA" : "Select state first"}
              />
            </SelectTrigger>
            <SelectContent>
              {lgas.map((lga) => (
                <SelectItem key={lga} value={lga}>
                  {lga}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.lga && <p className="text-xs text-destructive">{errors.lga}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">City/Town</Label>
          {cities.length ? (
            <Select
              value={value.city || EMPTY}
              onValueChange={(city) =>
                onChange({ ...value, city: city === EMPTY ? "" : city })
              }
              disabled={!value.lga}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city/town" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY}>No city/town selected</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={value.city ?? ""}
              onChange={(event) =>
                onChange({ ...value, city: event.target.value })
              }
              disabled={!value.lga}
              placeholder={value.lga ? "Optional" : "Select LGA first"}
            />
          )}
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city}</p>
          )}
        </div>
      </div>

      {showLandmark && (
        <div className="space-y-1.5">
          <Label className="text-xs">Landmark</Label>
          <Input
            value={value.landmark ?? ""}
            onChange={(event) =>
              onChange({ ...value, landmark: event.target.value })
            }
            placeholder="Nearest market, junction, gate, or notable place"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">
          {addressLabel}
          {required ? " *" : ""}
        </Label>
        <Textarea
          rows={2}
          value={value.fullAddress ?? ""}
          onChange={(event) =>
            onChange({ ...value, fullAddress: event.target.value })
          }
          placeholder="House number, street, farm settlement, warehouse, or pickup point"
        />
        {errors.fullAddress && (
          <p className="text-xs text-destructive">{errors.fullAddress}</p>
        )}
      </div>
    </div>
  );
};
