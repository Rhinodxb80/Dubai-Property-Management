import { useState, useCallback, useRef } from "react";
import type { DragEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DEFAULT_PROPERTY_IMAGE, type Property, type PropertyAvailabilityStatus } from "@/data/properties";
import { findPropertyById, getMergedProperties, upsertProperty } from "@/lib/property-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, Image as ImageIcon, FileText, Eye, Calendar } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const compressImageFile = (file: File, maxDimension = 900, quality = 0.68): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Unable to read file content"));
      };
      reader.onerror = () => reject(reader.error ?? new Error("Unable to read file content"));
      reader.readAsDataURL(file);
      return;
    }

    const readBlobAsDataUrl = (blob: Blob) =>
      new Promise<string>((blobResolve, blobReject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") blobResolve(reader.result);
          else blobReject(new Error("Unable to read image blob"));
        };
        reader.onerror = () => blobReject(reader.error ?? new Error("Unable to read image blob"));
        reader.readAsDataURL(blob);
      });

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const preferredTypes = ["image/webp", file.type.includes("png") ? "image/png" : "image/jpeg"];
      const minDimension = 480;
      const minQuality = 0.35;
      const maxDataUrlLength = 60_000;

      const encode = async (targetType: string, targetQuality: number, targetDimension: number) => {
        const scale = Math.min(1, targetDimension / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas not supported");
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const blob = await new Promise<Blob | null>((resolveBlob) =>
          canvas.toBlob(
            resolveBlob,
            targetType,
            targetType === "image/png" ? undefined : targetQuality,
          ),
        );
        if (!blob) throw new Error("ENCODE_FAILED");
        return readBlobAsDataUrl(blob);
      };

      for (const mime of preferredTypes) {
        let targetQuality = quality;
        let targetDimension = maxDimension;
        for (let attempt = 0; attempt < 8; attempt += 1) {
          try {
            const dataUrl = await encode(mime, targetQuality, targetDimension);
            if (
              dataUrl.length <= maxDataUrlLength ||
              (targetQuality <= minQuality && targetDimension <= minDimension)
            ) {
              resolve(dataUrl);
              return;
            }
            if (mime !== "image/png" && targetQuality > minQuality) {
              targetQuality = Math.max(minQuality, targetQuality - 0.1);
            } else {
              targetDimension = Math.max(minDimension, Math.round(targetDimension * 0.8));
            }
          } catch (error) {
            if (error instanceof Error && error.message === "ENCODE_FAILED") {
              break;
            }
            if (attempt === 7) {
              reject(error instanceof Error ? error : new Error("Unable to process image"));
              return;
            }
            // If our last attempt failed, continue reducing quality/dimension before retrying.
            if (mime !== "image/png" && targetQuality > minQuality) {
              targetQuality = Math.max(minQuality, targetQuality - 0.12);
            } else {
              targetDimension = Math.max(minDimension, Math.round(targetDimension * 0.8));
            }
          }
        }
      }

      try {
        const fallback = await encode("image/jpeg", minQuality, minDimension);
        resolve(fallback);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Unable to process image"));
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to load image for compression"));
    };
    image.src = objectUrl;
  });

const naturalMediaSort = (a: ManagedMediaEntry, b: ManagedMediaEntry) => {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  const nameA = a.originalName || a.title;
  const nameB = b.originalName || b.title;
  return collator.compare(nameA, nameB);
};

const MultiValueField = ({
  id,
  label,
  values,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) => {
  const [draft, setDraft] = useState("");

  const addValues = useCallback(() => {
    const parts = draft
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const unique = [...values];
    for (const item of parts) {
      if (!unique.includes(item)) unique.push(item);
    }
    onChange(unique);
    setDraft("");
  }, [draft, values, onChange]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addValues();
    }
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <Button type="button" onClick={addValues}>
          Add
        </Button>
      </div>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((item, index) => (
            <Badge
              key={`${id}-${item}-${index}`}
              variant="secondary"
              className="flex items-center gap-2 px-3 py-1"
            >
              <span>{item}</span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => removeValue(index)}
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No entries yet.</p>
      )}
    </div>
  );
};

const AdminEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === "new";

  const existingProperty = id ? findPropertyById(id) : undefined;

  const emptyProperty: Partial<Property> = {
    id: "",
    name: "",
    neighborhood: "",
    subcluster: "",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    googleMapUrl: "",
    price: "",
    priceDetails: "",
    labels: [],
    description: "",
    amenities: [],
    features: [],
    locationDescription: "",
    videoUrl: "",
    visible: true,
    availability: { type: "available-now" },
    maidsRoom: false,
  };

  const [formData, setFormData] = useState<Partial<Property>>(
    existingProperty
      ? {
          ...existingProperty,
          availability: existingProperty.availability ?? { type: "available-now" },
          maidsRoom: existingProperty.maidsRoom ?? false,
          googleMapUrl: existingProperty.googleMapUrl ?? "",
        }
      : { ...emptyProperty }
  );

  const [images, setImages] = useState<ManagedMediaEntry[]>(() => {
    if (existingProperty?.galleryImages?.length) {
      return existingProperty.galleryImages.map((image, index) => ({
        url: image.url,
        title: image.title ?? `Gallery Image ${index + 1}`,
        originalName: image.title ?? image.url,
      }));
    }
    if (existingProperty) {
      return [{ url: existingProperty.image, title: existingProperty.name, originalName: existingProperty.name }];
    }
    return [];
  });
  const [floorplans, setFloorplans] = useState<ManagedMediaEntry[]>(
    () =>
      existingProperty?.floorplans?.map((plan, index) => ({
        url: plan.url,
        title: plan.title ?? `Floor Plan ${index + 1}`,
        originalName: plan.title ?? plan.url,
      })) ?? []
  );
  const [developmentImages, setDevelopmentImages] = useState<ManagedMediaEntry[]>(
    () =>
      existingProperty?.developmentImages?.map((image, index) => ({
        url: image.url,
        title: image.title ?? `Development Image ${index + 1}`,
        originalName: image.title ?? image.url,
      })) ?? []
  );
  
  type UploadEntry = {
    file?: File;
    url: string;
    name: string;
  };

  type ManagedMediaEntry = {
    url: string;
    title: string;
    originalName?: string;
  };

  const [titleDeedDocument, setTitleDeedDocument] = useState<UploadEntry | null>(null);
  const [insuranceDocument, setInsuranceDocument] = useState<UploadEntry | null>(null);
  const [insuranceValidFrom, setInsuranceValidFrom] = useState("");
  const [insuranceValidTo, setInsuranceValidTo] = useState("");
  const [insuranceNotes, setInsuranceNotes] = useState("");
  const [manualDocuments, setManualDocuments] = useState<UploadEntry[]>([]);
  const appendMediaEntries = useCallback(
    (files: File[], setter: React.Dispatch<React.SetStateAction<ManagedMediaEntry[]>>) => {
      if (!files.length) return;
      Promise.all(
        files.map(async (file) => ({
          url: await compressImageFile(file),
          title: file.name.replace(/\.[^/.]+$/, ""),
          originalName: file.name,
        })),
      )
        .then((entries) => {
          const sortedEntries = [...entries].sort(naturalMediaSort);
          setter((prev) => [...prev, ...sortedEntries]);
        })
        .catch((error) => {
          console.error("Failed to process media files", error);
          toast({
            title: "Upload failed",
            description: "The media files could not be processed. Please try again.",
            variant: "destructive",
          });
        });
    },
    [toast],
  );

  type MediaType = "images" | "development" | "floorplans";
  const dragItemRef = useRef<{ type: MediaType; index: number } | null>(null);

  const reorderList = <T,>(list: T[], from: number, to: number) => {
    if (from === to) return list;
    const updated = [...list];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    return updated;
  };

  const applyReorder = (type: MediaType, from: number, to: number) => {
    switch (type) {
      case "images":
        setImages((prev) => reorderList(prev, from, to));
        break;
      case "development":
        setDevelopmentImages((prev) => reorderList(prev, from, to));
        break;
      case "floorplans":
        setFloorplans((prev) => reorderList(prev, from, to));
        break;
    }
  };

  const handleDragStart =
    (type: MediaType, index: number) => (event: DragEvent<HTMLDivElement>) => {
      dragItemRef.current = { type, index };
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        try {
          event.dataTransfer.setData("application/x-admin-media-index", String(index));
        } catch {
          // Some browsers throw when using custom MIME types; ignore silently.
        }
      }
    };

  const handleDragEnter =
    (type: MediaType, index: number) => (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const dragged = dragItemRef.current;
      if (!dragged || dragged.type !== type || dragged.index === index) {
        return;
      }
      applyReorder(type, dragged.index, index);
      dragItemRef.current = { type, index };
    };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop =
    (type: MediaType, index: number) => (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const dragged = dragItemRef.current;
      if (dragged && dragged.type === type && dragged.index !== index) {
        applyReorder(type, dragged.index, index);
      }
      dragItemRef.current = null;
    };

  const handleDragEnd = () => {
    dragItemRef.current = null;
  };
  
  // Preview state
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      appendMediaEntries(acceptedFiles, setImages);
    },
    [appendMediaEntries],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });

  const onDevelopmentDrop = useCallback(
    (acceptedFiles: File[]) => {
      appendMediaEntries(acceptedFiles, setDevelopmentImages);
    },
    [appendMediaEntries],
  );

  const developmentDropzone = useDropzone({
    onDrop: onDevelopmentDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });

  const onFloorplanDrop = useCallback(
    (acceptedFiles: File[]) => {
      appendMediaEntries(acceptedFiles, setFloorplans);
    },
    [appendMediaEntries],
  );

  const floorplanDropzone = useDropzone({
    onDrop: onFloorplanDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });

  const handleAvailabilityTypeChange = (type: PropertyAvailabilityStatus) => {
    setFormData(prev => ({
      ...prev,
      availability:
        type === "date"
          ? {
              type,
              date: prev.availability?.type === "date" ? prev.availability.date ?? "" : "",
            }
          : { type },
    }));
  };

  const handleAvailabilityDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      availability: date ? { type: "date", date } : { type: "date" },
    }));
  };

  const formatAvailabilityHelperText = () => {
    const availability = formData.availability;
    if (!availability || availability.type === "available-now") {
      return "Listing is marked as available immediately.";
    }

    if (availability.type === "not-available") {
      return "Listing will be shown as not available on public pages.";
    }

    if (availability.type === "date") {
      if (availability.date) {
        const parsed = new Date(`${availability.date}T00:00:00`);
        const formatted = Number.isNaN(parsed.getTime()) ? availability.date : parsed.toLocaleDateString();
        return `Listing will be available from ${formatted}.`;
      }
      return "Select the earliest date when the unit becomes available.";
    }

    return "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeDevelopmentImage = (index: number) => {
    setDevelopmentImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeFloorplan = (index: number) => {
    setFloorplans((prev) => prev.filter((_, i) => i !== index));
  };

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = formData.name?.trim() ?? "";
    const rawId = formData.id?.trim() ?? "";

    if (!trimmedName || !rawId) {
      toast({
        title: "Missing information",
        description: "Please provide at least a property name and an ID.",
        variant: "destructive",
      });
      return;
    }

    const slug = slugify(rawId);
    if (!slug) {
      toast({
        title: "Invalid property ID",
        description: "Use letters and numbers for the property ID.",
        variant: "destructive",
      });
      return;
    }

    if (formData.availability?.type === "date" && !formData.availability.date) {
      toast({
        title: "Availability date required",
        description: "Please choose a start date or use one of the other availability options.",
        variant: "destructive",
      });
      return;
    }

    const mergedProperties = getMergedProperties();
    const conflictingProperty = mergedProperties.find((property) => property.id === slug);
    if (isNew && conflictingProperty) {
      toast({
        title: "Duplicate ID",
        description: "A property with this ID already exists. Please choose another one.",
        variant: "destructive",
      });
      return;
    }

    const galleryMedia = images.map((image, index) => ({
      url: image.url,
      title: image.title || `Gallery Image ${index + 1}`,
    }));

    const developmentMedia = developmentImages.map((image, index) => ({
      url: image.url,
      title: image.title || `Development Image ${index + 1}`,
    }));

    const floorplanMedia = floorplans.map((plan, index) => ({
      url: plan.url,
      title: plan.title || `Floor Plan ${index + 1}`,
    }));

    const now = new Date().toISOString();

    const payload: Property = {
      id: slug,
      name: trimmedName,
      image: galleryMedia[0]?.url ?? existingProperty?.image ?? DEFAULT_PROPERTY_IMAGE,
      neighborhood: formData.neighborhood?.trim() ?? existingProperty?.neighborhood ?? "",
      subcluster: formData.subcluster?.trim() || existingProperty?.subcluster || undefined,
      bedrooms: formData.bedrooms ?? existingProperty?.bedrooms ?? 0,
      bathrooms: formData.bathrooms ?? existingProperty?.bathrooms ?? 0,
      sqft: formData.sqft ?? existingProperty?.sqft ?? 0,
      price: formData.price?.trim() || existingProperty?.price || "Price on request",
      rentPricePerYear: formData.price?.trim() || existingProperty?.rentPricePerYear,
      priceDetails: formData.priceDetails?.trim() || existingProperty?.priceDetails,
      labels: formData.labels ?? existingProperty?.labels ?? [],
      description: formData.description?.trim() ?? existingProperty?.description ?? "",
      amenities: formData.amenities ?? existingProperty?.amenities ?? [],
      features: formData.features ?? existingProperty?.features ?? [],
    locationDescription: formData.locationDescription?.trim() || existingProperty?.locationDescription,
    googleMapUrl: formData.googleMapUrl?.trim() || existingProperty?.googleMapUrl,
      videoUrl: formData.videoUrl?.trim() || existingProperty?.videoUrl,
      visible: formData.visible ?? existingProperty?.visible ?? true,
      availability: formData.availability ?? existingProperty?.availability,
      maidsRoom: formData.maidsRoom ?? existingProperty?.maidsRoom ?? false,
      developmentImages: developmentMedia.length ? developmentMedia : existingProperty?.developmentImages,
      galleryImages: galleryMedia.length ? galleryMedia : existingProperty?.galleryImages,
      floorplans: floorplanMedia.length ? floorplanMedia : existingProperty?.floorplans,
      source: "custom",
      createdAt: existingProperty?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      upsertProperty(payload);
      toast({
        title: isNew ? "Property Created" : "Property Updated",
        description: `${payload.name} has been ${isNew ? "created" : "updated"} successfully.`,
      });
      navigate("/admin", { state: { focusPropertyId: payload.id } });
    } catch (error) {
      console.error("Failed to persist property:", error);
      toast({
        title: "Storage limit reached",
        description:
          "We couldn't save the property data. Please remove a few media files or clear older custom listings and try again.",
        variant: "destructive",
      });
    }
  };

  const createUploadEntry = (file: File): UploadEntry => ({
    file,
    url: URL.createObjectURL(file),
    name: file.name,
  });

  const handleTitleDeedUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (titleDeedDocument) {
      URL.revokeObjectURL(titleDeedDocument.url);
    }
    setTitleDeedDocument(createUploadEntry(file));
    toast({
      title: "Title Deed uploaded",
      description: file.name,
    });
  };

  const removeTitleDeed = () => {
    if (titleDeedDocument) {
      URL.revokeObjectURL(titleDeedDocument.url);
    }
    setTitleDeedDocument(null);
    toast({
      title: "Title Deed removed",
      description: "Document has been cleared.",
    });
  };

  const handleInsuranceUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (insuranceDocument) {
      URL.revokeObjectURL(insuranceDocument.url);
    }
    setInsuranceDocument(createUploadEntry(file));
    toast({
      title: "Insurance uploaded",
      description: file.name,
    });
  };

  const removeInsurance = () => {
    if (insuranceDocument) {
      URL.revokeObjectURL(insuranceDocument.url);
    }
    setInsuranceDocument(null);
    setInsuranceValidFrom("");
    setInsuranceValidTo("");
    setInsuranceNotes("");
    toast({
      title: "Insurance removed",
      description: "Insurance document and details cleared.",
    });
  };

  const handleManualUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newEntries = Array.from(fileList).map(createUploadEntry);
    setManualDocuments((prev) => [...prev, ...newEntries]);
    toast({
      title: "Manuals uploaded",
      description: `${newEntries.length} file(s) added.`,
    });
  };

  const removeManual = (index: number) => {
    setManualDocuments((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const openPreview = (doc: UploadEntry) => {
    setPreviewDoc({
      url: doc.url,
      name: doc.name,
      type: doc.file.type,
    });
  };

  const handleTitleDeedView = () => {
    if (!titleDeedDocument) {
      toast({
        title: "No document available",
        description: "Upload the title deed first.",
        variant: "destructive",
      });
      return;
    }
    openPreview(titleDeedDocument);
  };

  const handleInsuranceView = () => {
    if (!insuranceDocument) {
      toast({
        title: "No document available",
        description: "Upload the insurance certificate first.",
        variant: "destructive",
      });
      return;
    }
    openPreview(insuranceDocument);
  };

  const handleManualView = (entry: UploadEntry) => {
    openPreview(entry);
  };

  const renderDocumentOverview = () => {
    return (
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <Card
          className={`transition-shadow ${titleDeedDocument ? "cursor-pointer hover:shadow-lg" : ""}`}
          onClick={titleDeedDocument ? handleTitleDeedView : undefined}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Title Deed</p>
                {titleDeedDocument ? (
                  <p className="text-sm text-muted-foreground truncate">{titleDeedDocument.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not uploaded</p>
                )}
              </div>
              {titleDeedDocument && <Eye className="w-5 h-5 text-primary" />}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`transition-shadow ${insuranceDocument ? "cursor-pointer hover:shadow-lg" : ""}`}
          onClick={insuranceDocument ? handleInsuranceView : undefined}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Insurance</p>
                {insuranceDocument ? (
                  <>
                    <p className="text-sm text-muted-foreground truncate">{insuranceDocument.name}</p>
                    {(insuranceValidFrom || insuranceValidTo) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {insuranceValidFrom ? new Date(insuranceValidFrom).toLocaleDateString() : "-"}{" "}-
                          {insuranceValidTo ? new Date(insuranceValidTo).toLocaleDateString() : "-"}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not uploaded</p>
                )}
              </div>
              {insuranceDocument && <Eye className="w-5 h-5 text-primary" />}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`transition-shadow ${manualDocuments.length ? "cursor-pointer hover:shadow-lg" : ""}`}
          onClick={manualDocuments.length ? () => handleManualView(manualDocuments[0]) : undefined}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Manuals</p>
                <p className="text-sm text-muted-foreground">
                  {manualDocuments.length
                    ? `${manualDocuments.length} document${manualDocuments.length > 1 ? "s" : ""}`
                    : "Not uploaded"}
                </p>
              </div>
              {manualDocuments.length > 0 && <Eye className="w-5 h-5 text-primary" />}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/admin")}
              variant="ghost"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Admin
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? "Add New Property" : `Edit: ${formData.name}`}
            </h1>
          </div>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isNew ? "Create Property" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="lists">Lists</TabsTrigger>
              <TabsTrigger value="documents">Internal Documents</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Property Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Sky Tower Penthouse"
                      />
                    </div>
                    <div>
                      <Label htmlFor="id">Property ID *</Label>
                      <Input
                        id="id"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        placeholder="sky-tower-penthouse"
                        disabled={!isNew}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="neighborhood">Neighborhood *</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        placeholder="Downtown Dubai"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subcluster">Subcluster</Label>
                      <Input
                        id="subcluster"
                        value={formData.subcluster || ""}
                        onChange={(e) => setFormData({ ...formData, subcluster: e.target.value })}
                        placeholder="Business Bay"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="google-map-url">Google Maps Link</Label>
                    <Input
                      id="google-map-url"
                      type="url"
                      placeholder="https://www.google.com/maps/place/..."
                      value={formData.googleMapUrl || ""}
                      onChange={(event) => setFormData({ ...formData, googleMapUrl: event.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: paste the Google Maps sharing link for this property.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Checkbox
                            id="maids-room-checkbox"
                            checked={Boolean(formData.maidsRoom)}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, maidsRoom: Boolean(checked) })
                            }
                          />
                          <Label
                            htmlFor="maids-room-checkbox"
                            className="cursor-pointer select-none text-xs font-medium text-muted-foreground"
                          >
                            Maids Room
                          </Label>
                        </div>
                      </div>
                      <Input
                        id="bedrooms"
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sqft">Square Feet</Label>
                      <Input
                        id="sqft"
                        type="number"
                        value={formData.sqft}
                        onChange={(e) => setFormData({ ...formData, sqft: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Rent per year *</Label>
                      <Input
                        id="price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="AED 15,000,000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="priceDetails">Price Details</Label>
                      <Input
                        id="priceDetails"
                        value={formData.priceDetails || ""}
                        onChange={(e) => setFormData({ ...formData, priceDetails: e.target.value })}
                        placeholder="Long term rent, usual tenancy contract"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="availability-status">Availability</Label>
                      <Select
                        value={formData.availability?.type ?? "available-now"}
                        onValueChange={(value) =>
                          handleAvailabilityTypeChange(value as PropertyAvailabilityStatus)
                        }
                      >
                        <SelectTrigger id="availability-status">
                          <SelectValue placeholder="Select availability status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available-now">Available Now</SelectItem>
                          <SelectItem value="not-available">Not Available</SelectItem>
                          <SelectItem value="date">Specific Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-2 text-xs text-muted-foreground">{formatAvailabilityHelperText()}</p>
                    </div>
                    {formData.availability?.type === "date" && (
                      <div>
                        <Label htmlFor="availability-date">Available From</Label>
                        <Input
                          id="availability-date"
                          type="date"
                          value={formData.availability?.date ?? ""}
                          onChange={(event) => handleAvailabilityDateChange(event.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the property..."
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="locationDescription">Location Description</Label>
                    <Textarea
                      id="locationDescription"
                      value={formData.locationDescription || ""}
                      onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                      placeholder="Describe the location and neighborhood..."
                      rows={4}
                    />
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    {isDragActive ? (
                      <p className="text-lg text-foreground">Drop images here...</p>
                    ) : (
                      <div>
                        <p className="text-lg text-foreground mb-2">
                          Drag & drop images here, or click to select
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports: JPG, PNG, WEBP
                        </p>
                      </div>
                    )}
                  </div>

                  {images.length > 0 && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((img, index) => (
                          <div
                            key={`${img.url}-${index}`}
                            className="relative group cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={handleDragStart("images", index)}
                            onDragEnter={handleDragEnter("images", index)}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop("images", index)}
                            onDragEnd={handleDragEnd}
                          >
                            <img
                              src={img.url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Input
                              placeholder="Image title..."
                              className="mt-2"
                              value={img.title}
                              onChange={(e) => {
                                const newImages = [...images];
                                newImages[index].title = e.target.value;
                                setImages(newImages);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Drag images to reorder. The first image appears as the primary photo.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Floor Plans</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div
                    {...floorplanDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      floorplanDropzone.isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input {...floorplanDropzone.getInputProps()} />
                    <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    {floorplanDropzone.isDragActive ? (
                      <p className="text-foreground font-medium">Drop floor plans here...</p>
                    ) : (
                      <div>
                        <p className="text-foreground font-medium mb-1">Upload floor plans</p>
                        <p className="text-sm text-muted-foreground">
                          Drag & drop files or click to browse. Supports JPG, PNG, WEBP.
                        </p>
                      </div>
                    )}
                  </div>

                  {floorplans.length > 0 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {floorplans.map((plan, index) => (
                          <div
                            key={`${plan.url}-${index}`}
                            className="relative group cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={handleDragStart("floorplans", index)}
                            onDragEnter={handleDragEnter("floorplans", index)}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop("floorplans", index)}
                            onDragEnd={handleDragEnd}
                          >
                            <img
                              src={plan.url}
                              alt={`Floor plan ${index + 1}`}
                              className="w-full h-56 object-cover rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFloorplan(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Input
                              placeholder="Floor plan title..."
                              className="mt-2"
                              value={plan.title}
                              onChange={(e) => {
                                const updated = [...floorplans];
                                updated[index].title = e.target.value;
                                setFloorplans(updated);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Drag floor plans to reorder. The first plan is displayed first on the property page.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Development Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div
                    {...developmentDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                      developmentDropzone.isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input {...developmentDropzone.getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    {developmentDropzone.isDragActive ? (
                      <p className="text-lg text-foreground">Drop images here...</p>
                    ) : (
                      <div>
                        <p className="text-lg text-foreground mb-2">
                          Drag & drop development images here, or click to select
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports: JPG, PNG, WEBP
                        </p>
                      </div>
                    )}
                  </div>

                  {developmentImages.length > 0 && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {developmentImages.map((img, index) => (
                          <div
                            key={`${img.url}-${index}`}
                            className="relative group cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={handleDragStart("development", index)}
                            onDragEnter={handleDragEnter("development", index)}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop("development", index)}
                            onDragEnd={handleDragEnd}
                          >
                            <img
                              src={img.url}
                              alt={`Development Preview ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeDevelopmentImage(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Input
                              placeholder="Image title..."
                              className="mt-2"
                              value={img.title}
                              onChange={(e) => {
                                const newImages = [...developmentImages];
                                newImages[index].title = e.target.value;
                                setDevelopmentImages(newImages);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Drag images to reorder for the development gallery.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Video URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="videoUrl">YouTube Embed URL</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl || ""}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lists Tab */}
            <TabsContent value="lists" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Labels</CardTitle>
                  <CardDescription>Add descriptive highlights for marketing cards.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MultiValueField
                    id="labels"
                    label="Label"
                    values={formData.labels ?? []}
                    onChange={(next) => setFormData((prev) => ({ ...prev, labels: next }))}
                    placeholder="City View"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                  <CardDescription>Key selling points of the property.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MultiValueField
                    id="features"
                    label="Feature"
                    values={formData.features ?? []}
                    onChange={(next) => setFormData((prev) => ({ ...prev, features: next }))}
                    placeholder="Smart Home Technology"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                  <CardDescription>Services and facilities available to tenants.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MultiValueField
                    id="amenities"
                    label="Amenity"
                    values={formData.amenities ?? []}
                    onChange={(next) => setFormData((prev) => ({ ...prev, amenities: next }))}
                    placeholder="24/7 Concierge Service"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Internal Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              {renderDocumentOverview()}

              <Card>
                <CardHeader>
                  <CardTitle>Title Deed</CardTitle>
                  <CardDescription>Upload the property's title deed document.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(event) => handleTitleDeedUpload(event.target.files)}
                      className="md:w-auto"
                    />
                    {titleDeedDocument && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={handleTitleDeedView}>
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={removeTitleDeed}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {titleDeedDocument
                      ? `Uploaded: ${titleDeedDocument.name}`
                      : "Supports PDF or image files up to 10 MB."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Insurance</CardTitle>
                  <CardDescription>Attach the insurance certificate and capture validity details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(event) => handleInsuranceUpload(event.target.files)}
                      className="md:w-auto"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleInsuranceView}
                        disabled={!insuranceDocument}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={removeInsurance}
                        disabled={!insuranceDocument}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="insurance-valid-from">Valid From</Label>
                      <Input
                        id="insurance-valid-from"
                        type="date"
                        value={insuranceValidFrom}
                        onChange={(event) => setInsuranceValidFrom(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance-valid-to">Valid Until</Label>
                      <Input
                        id="insurance-valid-to"
                        type="date"
                        value={insuranceValidTo}
                        onChange={(event) => setInsuranceValidTo(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance-notes">Insurance Notes</Label>
                    <Textarea
                      id="insurance-notes"
                      value={insuranceNotes}
                      onChange={(event) => setInsuranceNotes(event.target.value)}
                      placeholder="Add policy number, provider, or coverage notes."
                      className="min-h-[90px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manuals</CardTitle>
                  <CardDescription>Upload device manuals or instructions for this property.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-uploads">Upload manuals</Label>
                    <Input
                      id="manual-uploads"
                      type="file"
                      accept=".pdf,image/*"
                      multiple
                      onChange={(event) => handleManualUpload(event.target.files)}
                    />
                    <p className="text-xs text-muted-foreground">
                      You can upload multiple manuals; supported formats: PDF, JPG, PNG, WEBP.
                    </p>
                  </div>
                  {manualDocuments.length > 0 && (
                    <div className="space-y-3">
                      {manualDocuments.map((doc, index) => (
                        <div
                          key={doc.url}
                          className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(doc.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleManualView(doc)}>
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeManual(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-100px)]">
            {previewDoc?.type.startsWith('image/') ? (
              <img src={previewDoc.url} alt={previewDoc.name} className="w-full h-auto" />
            ) : previewDoc?.type === 'application/pdf' ? (
              <iframe src={previewDoc.url} className="w-full h-[70vh]" title={previewDoc.name} />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Preview not available for this file type</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEdit;




