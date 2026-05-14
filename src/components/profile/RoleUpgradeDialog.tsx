import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/hooks/useChat";
import { useRequestRoleUpgrade } from "@/hooks/useProfile";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, ShieldCheck, Truck, Upload, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLE_OPTIONS = [
  {
    value: "farmer",
    label: "Farmer",
    description:
      "Sell produce, manage your farm, and grow your business on PhyhanAgro.",
    icon: Users,
  },
  {
    value: "rider",
    label: "Rider",
    description:
      "Deliver orders, earn delivery fees, and stay available for new routes.",
    icon: Truck,
  },
];

const DOCUMENT_TYPES = [
  { value: "nin", label: "National ID (NIN)" },
  { value: "passport", label: "International Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voters_card", label: "Voter's Card" },
];

const roleTerms = (role: "farmer" | "rider") =>
  role === "farmer"
    ? [
        "I confirm the farm details I provide are accurate and up to date.",
        "I will comply with PhyhanAgro's quality, pricing, and delivery expectations.",
        "I understand that my farmer application and documents will be reviewed before approval.",
      ]
    : [
        "I will deliver orders safely, on time, and according to PhyhanAgro guidelines.",
        "I confirm my vehicle details are accurate and that I hold a valid driver's license.",
        "I understand that my rider application and documents will be reviewed before approval.",
      ];

interface RoleUpgradePayload {
  role: "farmer" | "rider";
  termsAccepted: boolean;
  farmerProfile?: {
    farmName: string;
    farmAddress: string;
    farmState?: string;
    farmLga?: string;
    farmLandmark?: string;
    farmPhone?: string;
  };
  riderProfile?: {
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber?: string;
  };
  documentType: string;
  documentNumber?: string;
  documentUrl: string;
  selfieUrl?: string;
  note?: string;
}

interface Props {
  trigger: React.ReactNode;
}

export const RoleUpgradeDialog = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"farmer" | "rider">("farmer");
  const [farmName, setFarmName] = useState("");
  const [farmAddress, setFarmAddress] = useState("");
  const [farmState, setFarmState] = useState("");
  const [farmLga, setFarmLga] = useState("");
  const [farmLandmark, setFarmLandmark] = useState("");
  const [farmPhone, setFarmPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [docType, setDocType] = useState("nin");
  const [docNumber, setDocNumber] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [uploading, setUploading] = useState<"doc" | "selfie" | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [note, setNote] = useState("");
  const requestUpgrade = useRequestRoleUpgrade();

  const handleUpload = async (
    file: File | undefined,
    kind: "doc" | "selfie",
  ) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Max file size is 10MB");
      return;
    }
    setUploading(kind);
    try {
      const url = await uploadFile(file, file.name);
      if (!url) throw new Error("Upload failed");
      if (kind === "doc") setDocUrl(url);
      else setSelfieUrl(url);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setUploading(null);
    }
  };

  const onSubmit = async () => {
    if (!termsAccepted) {
      toast.error("Accept the terms and conditions to continue");
      return;
    }
    if (!docUrl) {
      toast.error("Upload a verification document to continue");
      return;
    }
    if (role === "farmer" && (!farmName.trim() || !farmAddress.trim())) {
      toast.error("Provide your farm name and address");
      return;
    }
    if (role === "rider" && (!vehicleType.trim() || !vehicleNumber.trim())) {
      toast.error("Provide vehicle type and number");
      return;
    }

    const payload: RoleUpgradePayload = {
      role,
      termsAccepted,
      documentType: docType,
      documentNumber: docNumber || undefined,
      documentUrl: docUrl,
      selfieUrl: selfieUrl || undefined,
      note: note || undefined,
    };

    if (role === "farmer") {
      payload.farmerProfile = {
        farmName: farmName.trim(),
        farmAddress: farmAddress.trim(),
        farmState: farmState.trim() || undefined,
        farmLga: farmLga.trim() || undefined,
        farmLandmark: farmLandmark.trim() || undefined,
        farmPhone: farmPhone.trim() || undefined,
      };
    } else {
      payload.riderProfile = {
        vehicleType: vehicleType.trim(),
        vehicleNumber: vehicleNumber.trim(),
        licenseNumber: licenseNumber.trim() || undefined,
      };
    }

    try {
      await requestUpgrade.mutateAsync(payload);
      toast.success("Role upgrade request submitted successfully");
      setOpen(false);
      setTermsAccepted(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="  w-[95vw]
    max-w-2xl
    max-h-[90vh]
    overflow-y-auto
    rounded-xl
    p-4
    sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Apply for role
            upgrade
          </DialogTitle>
          <DialogDescription>
            Choose the role you want to upgrade to, fill the required details,
            accept terms, and submit verification documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Desired role</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as "farmer" | "rider")}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              {ROLE_OPTIONS.map((option) => {
                const SelectedIcon = option.icon;
                const active = role === option.value;
                const id = `role-${option.value}`;

                return (
                  <Label
                    key={option.value}
                    htmlFor={id}
                    className={cn(
                      "flex w-full items-start gap-3",
                      "rounded-xl border border-dashed p-4",
                      "cursor-pointer transition-colors",
                      "break-words",
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background",
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={id}
                      className="mt-1"
                    />

                    <div className="flex flex-1 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <SelectedIcon className="h-5 w-5" />
                      </span>

                      <div className="flex-1">
                        <p className="text-sm font-semibold sm:text-base">
                          {option.label}
                        </p>

                        <p className="text-xs break-words text-muted-foreground sm:text-sm">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {role === "farmer" ? (
            <div className="grid gap-4 sm:grid-cols-2 transition-all duration-300">
              <div className="space-y-1.5">
                <Label htmlFor="farmName">Farm name</Label>
                <Input
                  id="farmName"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="farmAddress">Farm address</Label>
                <Input
                  id="farmAddress"
                  value={farmAddress}
                  onChange={(e) => setFarmAddress(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="farmState">State</Label>
                <Input
                  id="farmState"
                  value={farmState}
                  onChange={(e) => setFarmState(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="farmLga">LGA</Label>
                <Input
                  id="farmLga"
                  value={farmLga}
                  onChange={(e) => setFarmLga(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="farmLandmark">Landmark</Label>
                <Input
                  id="farmLandmark"
                  value={farmLandmark}
                  onChange={(e) => setFarmLandmark(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="farmPhone">Farm phone</Label>
                <Input
                  id="farmPhone"
                  value={farmPhone}
                  onChange={(e) => setFarmPhone(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vehicleType">Vehicle type</Label>
                <Input
                  id="vehicleType"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vehicleNumber">Vehicle number</Label>
                <Input
                  id="vehicleNumber"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="licenseNumber">License number (optional)</Label>
                <Input
                  id="licenseNumber"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-3xl border border-border bg-muted p-4">
            <p className="font-semibold">Verification documents</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Document type</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="docNumber">Document number</Label>
                <Input
                  id="docNumber"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Document upload</Label>
              <label
                className=" flex flex-col gap-3
    rounded-xl border border-dashed border-border
    p-3
    hover:border-primary
    sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-muted-foreground break-words">
                  {docUrl
                    ? "Document uploaded"
                    : "Upload an ID image or PDF (≤10MB)"}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  {uploading === "doc" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {docUrl ? "Replace" : "Upload"}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0], "doc")}
                />
              </label>
            </div>
            <div className="space-y-1.5">
              <Label>Optional selfie / license image</Label>
              <label
                className=" flex flex-col gap-3
    rounded-xl border border-dashed border-border
    p-3
    hover:border-primary
    sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-muted-foreground break-words">
                  {selfieUrl
                    ? "File uploaded"
                    : "Upload a selfie or driver license image"}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  {uploading === "selfie" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {selfieUrl ? "Replace" : "Upload"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0], "selfie")}
                />
              </label>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-border bg-background p-4">
            <p className="font-semibold">Terms and conditions</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              {roleTerms(role).map((item) => (
                <p key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  {item}
                </p>
              ))}
            </div>
            <label className="inline-flex items-center gap-2">
              <Checkbox
                checked={termsAccepted}
                onCheckedChange={(value) => setTermsAccepted(Boolean(value))}
              />
              <span className="text-sm text-muted-foreground">
                I agree to the terms and conditions for this role upgrade
                request.
              </span>
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Additional note (optional)</Label>
            <Textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={requestUpgrade.isPending || !docUrl}
          >
            {requestUpgrade.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
