import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Property, formatBedroomLabel } from "@/data/properties";
import { formatCurrencyAED } from "@/lib/formatters";
import { getMergedProperties } from "@/lib/property-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Share2 } from "lucide-react";
import {
  OWNER_DATA_STORAGE_KEY,
  OWNER_DOCUMENT_LABELS,
  type OwnerContactDetails,
  type OwnerDocumentEntry,
  type OwnerDocumentState,
  type OwnerDocumentType,
  type StoredOwnerData,
  createEmptyOwnerContact,
  createEmptyOwnerDocuments,
} from "@/types/owner";

type LocationState = {
  property?: Property;
};

const OWNER_DOCUMENT_TYPES: OwnerDocumentType[] = ["passport", "eid"];

type InsuranceInfo = {
  document: OwnerDocumentEntry | null;
  validFrom: string;
  validTo: string;
  notes: string;
};

const fallbackPropertyDetails = (id?: string) => {
  if (!id) return undefined;
  return getMergedProperties().find((property) => property.id === id);
};

const AdminPropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const locationState = location.state as LocationState | null;
  const [property, setProperty] = useState<Property | undefined>(locationState?.property);
  const [ownerContact, setOwnerContact] = useState<OwnerContactDetails | null>(null);
  const [ownerDocuments, setOwnerDocuments] = useState<OwnerDocumentState>(createEmptyOwnerDocuments());
  const [documentSelections, setDocumentSelections] = useState<Record<OwnerDocumentType, boolean>>({
    passport: false,
    eid: false,
  });
  const [shareEmail, setShareEmail] = useState("");
  const [sharePhone, setSharePhone] = useState("");
  const [shareNotes, setShareNotes] = useState("");
  const [propertyNotes, setPropertyNotes] = useState("");
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo>({
    document: null,
    validFrom: "",
    validTo: "",
    notes: "",
  });

  useEffect(() => {
    if (!locationState?.property) {
      const resolved = fallbackPropertyDetails(id);
      setProperty(resolved);

      if (!resolved) {
        toast({
          title: "Property not found",
          description: "We couldn't locate the requested property dossier.",
          variant: "destructive",
        });
      }
    }
  }, [id, locationState?.property, toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(OWNER_DATA_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredOwnerData | OwnerContactDetails;
        if ("documents" in (parsed as StoredOwnerData)) {
          const data = parsed as StoredOwnerData;
          setOwnerContact(data.contact);
          setOwnerDocuments({
            passport: data.documents?.passport ?? null,
            eid: data.documents?.eid ?? null,
          });
        } else {
          setOwnerContact(parsed as OwnerContactDetails);
          setOwnerDocuments(createEmptyOwnerDocuments());
        }
      } else {
        setOwnerContact(createEmptyOwnerContact());
      }
    } catch (error) {
      console.error("Failed to load owner data:", error);
      setOwnerContact(createEmptyOwnerContact());
      setOwnerDocuments(createEmptyOwnerDocuments());
    }
  }, []);

  useEffect(() => {
    setDocumentSelections((prev) => ({
      passport: ownerDocuments.passport ? prev.passport : false,
      eid: ownerDocuments.eid ? prev.eid : false,
    }));
  }, [ownerDocuments]);

  useEffect(() => {
    if (!property || typeof window === "undefined") return;
    const notesKey = `adminPropertyNotes:${property.id}`;
    try {
      const storedNotes = window.localStorage.getItem(notesKey);
      if (storedNotes !== null) {
        setPropertyNotes(storedNotes);
      } else {
        setPropertyNotes("");
      }
    } catch (error) {
      console.error("Failed to load property notes:", error);
    }
  }, [property]);

  useEffect(() => {
    if (!property || typeof window === "undefined") return;
    const notesKey = `adminPropertyNotes:${property.id}`;
    try {
      window.localStorage.setItem(notesKey, propertyNotes);
    } catch (error) {
      console.error("Failed to persist property notes:", error);
    }
  }, [property, propertyNotes]);

  useEffect(() => {
    if (!property || typeof window === "undefined") return;
    const insuranceKey = `adminInsurance:${property.id}`;
    try {
      const stored = window.localStorage.getItem(insuranceKey);
      if (stored) {
        const parsed = JSON.parse(stored) as InsuranceInfo;
        setInsuranceInfo({
          document: parsed.document ?? null,
          validFrom: parsed.validFrom ?? "",
          validTo: parsed.validTo ?? "",
          notes: parsed.notes ?? "",
        });
      } else {
        setInsuranceInfo({
          document: null,
          validFrom: "",
          validTo: "",
          notes: "",
        });
      }
    } catch (error) {
      console.error("Failed to load insurance information:", error);
      setInsuranceInfo({
        document: null,
        validFrom: "",
        validTo: "",
        notes: "",
      });
    }
  }, [property]);

  useEffect(() => {
    if (!property || typeof window === "undefined") return;
    const insuranceKey = `adminInsurance:${property.id}`;
    try {
      window.localStorage.setItem(insuranceKey, JSON.stringify(insuranceInfo));
    } catch (error) {
      console.error("Failed to persist insurance information:", error);
    }
  }, [property, insuranceInfo]);

  const propertyLocation = useMemo(() => {
    if (!property) return "";
    return property.subcluster ? `${property.neighborhood} · ${property.subcluster}` : property.neighborhood;
  }, [property]);

  const selectedDocumentEntries = useMemo(
    () =>
      OWNER_DOCUMENT_TYPES.filter((type) => documentSelections[type] && ownerDocuments[type]).map((type) => ({
        type,
        entry: ownerDocuments[type]!,
      })),
    [documentSelections, ownerDocuments],
  );

  const ownerHasContactInfo =
    !!(
      ownerContact &&
      (ownerContact.name || ownerContact.email || ownerContact.phone || ownerContact.company || ownerContact.notes)
    );

  const labels = useMemo(() => property?.labels ?? [], [property?.labels]);
  const amenities = useMemo(() => property?.amenities ?? [], [property?.amenities]);
  const features = useMemo(() => property?.features ?? [], [property?.features]);
  const developmentImages = useMemo(() => property?.developmentImages ?? [], [property?.developmentImages]);
  const priceDisplay = useMemo(() => formatCurrencyAED(property?.price), [property?.price]);
  const rentDisplay = useMemo(
    () => formatCurrencyAED(property?.rentPricePerYear ?? property?.price),
    [property?.rentPricePerYear, property?.price],
  );

  const handleDocumentSelectionChange = (type: OwnerDocumentType, value: boolean) => {
    if (!ownerDocuments[type]) {
      toast({
        title: "Document unavailable",
        description: "Upload the document before including it in a share.",
        variant: "destructive",
      });
      return;
    }
    setDocumentSelections((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleDocumentView = (type: OwnerDocumentType) => {
    const doc = ownerDocuments[type];
    if (!doc) {
      toast({
        title: "Document unavailable",
        description: "No file uploaded yet.",
        variant: "destructive",
      });
      return;
    }
    if (typeof window !== "undefined") {
      window.open(doc.dataUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleInsuranceDocumentUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a document under 10 MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast({
          title: "Upload failed",
          description: "Could not read the insurance document.",
          variant: "destructive",
        });
        return;
      }

      setInsuranceInfo((prev) => ({
        ...prev,
        document: {
          name: file.name,
          dataUrl: reader.result as string,
          uploadedAt: new Date().toISOString(),
        },
      }));

      toast({
        title: "Insurance document uploaded",
        description: "Stored locally for internal use.",
      });
    };
    reader.onerror = () => {
      console.error("Failed to read insurance document:", reader.error);
      toast({
        title: "Upload failed",
        description: "Could not process the insurance file.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInsuranceView = () => {
    if (!insuranceInfo.document) {
      toast({
        title: "Document unavailable",
        description: "Upload the insurance certificate first.",
        variant: "destructive",
      });
      return;
    }

    if (typeof window !== "undefined") {
      window.open(insuranceInfo.document.dataUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleInsuranceRemove = () => {
    setInsuranceInfo((prev) => ({
      ...prev,
      document: null,
    }));
    toast({
      title: "Insurance document removed",
      description: "The file has been cleared from local storage.",
    });
  };

  const buildShareMessage = () => {
    if (!property) return "";

    const documentLines = selectedDocumentEntries.map(
      ({ type, entry }, index) => `${index + 1}. ${OWNER_DOCUMENT_LABELS[type]} — ${entry.name}`,
    );

    const ownerLines: string[] =
      ownerContact && (ownerContact.name || ownerContact.email || ownerContact.phone || ownerContact.company)
        ? [
            ownerContact.name ? `Owner: ${ownerContact.name}` : "",
            ownerContact.company ? `Company: ${ownerContact.company}` : "",
            ownerContact.email ? `Email: ${ownerContact.email}` : "",
            ownerContact.phone ? `Phone: ${ownerContact.phone}` : "",
          ].filter(Boolean)
        : [];

    const lines: string[] = [
      `${property.name} (${property.id})`,
      propertyLocation ? `Location: ${propertyLocation}` : undefined,
      `Price: ${rentDisplay || priceDisplay || property.price}`,
    ].filter((line): line is string => Boolean(line));

    if (ownerLines.length) {
      lines.push("");
      lines.push(...ownerLines);
    }

    lines.push("");
    lines.push("Documents:");
    if (documentLines.length) {
      lines.push(...documentLines);
    } else {
      lines.push("- none selected -");
    }

    if (shareNotes) {
      lines.push("");
      lines.push("Notes:");
      lines.push(shareNotes);
    }

    if (typeof window !== "undefined") {
      lines.push("");
      lines.push(`Review internally: ${window.location.origin}/admin/view/${property.id}`);
    }

    return lines.join("\n");
  };

  const handleShare = (method: "email" | "whatsapp") => {
    if (!property) return;
    if (selectedDocumentEntries.length === 0) {
      toast({
        title: "Select documents",
        description: "Choose at least one document to include.",
        variant: "destructive",
      });
      return;
    }

    const message = buildShareMessage();

    if (method === "email") {
      if (!shareEmail || !shareEmail.includes("@")) {
        toast({
          title: "Invalid email",
          description: "Enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      if (typeof window !== "undefined") {
        const subject = `Property dossier: ${property.name}`;
        const mailtoUrl = `mailto:${encodeURIComponent(shareEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(mailtoUrl, "_blank", "noopener,noreferrer");
      }

      navigator.clipboard?.writeText(message).catch(() => void 0);
      toast({
        title: "Email draft prepared",
        description: "Message copied to clipboard for convenience.",
      });
      return;
    }

    const normalized = sharePhone.replace(/\D/g, "");
    if (!normalized) {
      toast({
        title: "Invalid WhatsApp number",
        description: "Enter a valid number including country code.",
        variant: "destructive",
      });
      return;
    }

    if (typeof window !== "undefined") {
      const whatsappUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
    navigator.clipboard?.writeText(message).catch(() => void 0);
    toast({
      title: "WhatsApp message prepared",
      description: "Message copied to clipboard for convenience.",
    });
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-6">
          <h1 className="text-2xl font-semibold text-foreground">Property dossier unavailable</h1>
          <p className="text-muted-foreground">
            The requested admin dossier could not be loaded. It may have been removed or you opened this page without
            selecting a property first.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => navigate("/admin")} className="bg-primary hover:bg-primary/90">
              Back to Admin Panel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="space-y-1">
            <Button variant="ghost" onClick={() => navigate(-1)} className="px-0 text-sm">
              ← Back to overview
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{property.name}</h1>
              <p className="text-sm text-muted-foreground">
                Internal admin dossier — not shared with applicants or agents
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(`/admin/edit/${property.id}`)}>
            Edit Listing
          </Button>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-10 space-y-10">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden rounded-lg border border-border bg-muted">
                  <img src={property.image} alt={property.name} className="h-full w-full object-cover" />
                </div>
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <Badge key={label} variant="secondary">
                        {label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick Facts</h3>
                  <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between gap-4">
                      <dt>Name</dt>
                      <dd className="font-medium text-foreground text-right">{property.name}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt>Reference ID</dt>
                      <dd className="font-medium text-foreground text-right">{property.id}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt>Location</dt>
                      <dd className="font-medium text-foreground text-right">{propertyLocation || "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt>Rental Price</dt>
                      <dd className="font-medium text-foreground text-right">{rentDisplay || priceDisplay || property.price}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner Overview</CardTitle>
            <CardDescription>Contact details and private documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {ownerHasContactInfo ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {ownerContact?.name && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Name:</span> {ownerContact.name}
                  </p>
                )}
                {ownerContact?.company && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Company:</span> {ownerContact.company}
                  </p>
                )}
                {ownerContact?.email && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Email:</span> {ownerContact.email}
                  </p>
                )}
                {ownerContact?.phone && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Phone:</span> {ownerContact.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No owner contact details stored yet.</p>
            )}
            {ownerContact?.notes && (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">Notes</p>
                <p>{ownerContact.notes}</p>
              </div>
            )}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Documents</h3>
              <div className="space-y-3">
                {OWNER_DOCUMENT_TYPES.map((type) => {
                  const doc = ownerDocuments[type];
                  const isChecked = Boolean(doc && documentSelections[type]);
                  return (
                    <div
                      key={type}
                      className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{OWNER_DOCUMENT_LABELS[type]}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {doc
                            ? `Uploaded ${new Date(doc.uploadedAt).toLocaleDateString()} • ${doc.name}`
                            : "No file uploaded yet."}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`share-doc-${type}`}
                            checked={isChecked}
                            disabled={!doc}
                            onCheckedChange={(checked) => handleDocumentSelectionChange(type, Boolean(checked))}
                          />
                          <Label htmlFor={`share-doc-${type}`} className="text-sm text-muted-foreground">
                            Include
                          </Label>
                        </div>
                        <Button size="sm" variant="outline" disabled={!doc} onClick={() => handleDocumentView(type)}>
                          View
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Internal Documents</CardTitle>
            <CardDescription>Insurance overview for this property.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <Label htmlFor="insurance-upload">Insurance Certificate</Label>
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {insuranceInfo.document ? insuranceInfo.document.name : "No file uploaded"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Accepted: PDF or image · max 10 MB
                    </p>
                    {insuranceInfo.document && (
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(insuranceInfo.document.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      id="insurance-upload"
                      type="file"
                      accept=".pdf,image/*"
                      className="w-full md:w-auto"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          handleInsuranceDocumentUpload(file);
                        }
                        event.target.value = "";
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!insuranceInfo.document}
                      onClick={handleInsuranceView}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={!insuranceInfo.document}
                      onClick={handleInsuranceRemove}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="insurance-valid-from">Valid From</Label>
                  <Input
                    id="insurance-valid-from"
                    type="date"
                    value={insuranceInfo.validFrom}
                    onChange={(event) =>
                      setInsuranceInfo((prev) => ({ ...prev, validFrom: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance-valid-to">Valid Until</Label>
                  <Input
                    id="insurance-valid-to"
                    type="date"
                    value={insuranceInfo.validTo}
                    onChange={(event) =>
                      setInsuranceInfo((prev) => ({ ...prev, validTo: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance-notes">Insurance Notes</Label>
              <Textarea
                id="insurance-notes"
                value={insuranceInfo.notes}
                onChange={(event) =>
                  setInsuranceInfo((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Add policy number, provider, or special coverage notes."
                className="min-h-[90px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
            <CardDescription>Confidential details and internal notes for this unit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Bedrooms</p>
                <p>{formatBedroomLabel(property.bedrooms, property.maidsRoom)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Bathrooms</p>
                <p>{property.bathrooms}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Size</p>
                <p>{property.sqft.toLocaleString()} sqft</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Google Maps</p>
                {property.googleMapUrl ? (
                  <a
                    href={property.googleMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Open in Maps
                  </a>
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="property-notes">Internal Notes</Label>
              <Textarea
                id="property-notes"
                value={propertyNotes}
                onChange={(event) => setPropertyNotes(event.target.value)}
                placeholder="Add confidential notes such as title deed status, viewing feedback, or owner preferences."
                className="min-h-[120px]"
              />
            </div>
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="w-full max-w-xl justify-start">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="media" disabled={!developmentImages.length}>
                  Development
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>{property.description}</p>
                {property.priceDetails && (
                  <div>
                    <p className="font-medium text-foreground">Pricing Notes</p>
                    <p>{property.priceDetails}</p>
                  </div>
                )}
                {property.locationDescription && (
                  <div>
                    <p className="font-medium text-foreground">Location Insight</p>
                    <p>{property.locationDescription}</p>
                  </div>
                )}
                {property.videoUrl && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(property.videoUrl as string, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    Open Video Tour
                  </Button>
                )}
              </TabsContent>
              <TabsContent value="amenities">
                {amenities.length ? (
                  <ul className="grid gap-2 text-sm text-muted-foreground">
                    {amenities.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary/60" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No amenities recorded.</p>
                )}
              </TabsContent>
              <TabsContent value="features">
                {features.length ? (
                  <ul className="grid gap-2 text-sm text-muted-foreground">
                    {features.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary/60" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No features recorded.</p>
                )}
              </TabsContent>
              <TabsContent value="media">
                {developmentImages.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {developmentImages.map((asset) => (
                      <div key={asset.url} className="overflow-hidden rounded-lg border border-border bg-card">
                        <div className="aspect-video bg-muted">
                          <img src={asset.url} alt={asset.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="px-4 py-3 space-y-1">
                          <p className="text-sm font-semibold text-foreground">{asset.title}</p>
                          <p className="text-xs text-muted-foreground">{asset.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No development assets uploaded.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Share Selected Information</CardTitle>
            <CardDescription>Choose documents above and send a prepared summary via email or WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="share-email">Email Address</Label>
                <Input
                  id="share-email"
                  type="email"
                  placeholder="owner@example.com"
                  value={shareEmail}
                  onChange={(event) => setShareEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-phone">WhatsApp Number</Label>
                <Input
                  id="share-phone"
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={sharePhone}
                  onChange={(event) => setSharePhone(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-notes">Additional Message</Label>
              <Textarea
                id="share-notes"
                placeholder="Add a short message that will be included in the email or WhatsApp text."
                value={shareNotes}
                onChange={(event) => setShareNotes(event.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleShare("email")} disabled={!selectedDocumentEntries.length}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare("whatsapp")}
                  disabled={!selectedDocumentEntries.length}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Send via WhatsApp
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedDocumentEntries.length
                  ? `${selectedDocumentEntries.length} document(s) selected for sharing.`
                  : "Select documents above to enable sharing."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPropertyDetail;



