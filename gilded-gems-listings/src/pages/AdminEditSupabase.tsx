import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage, deleteImage } from "@/lib/storage-service";
import { useProperty } from "@/hooks/use-properties";

interface PropertyFormData {
  id: string;
  name: string;
  neighborhood: string;
  subcluster?: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  price: string;
  rentPricePerYear?: string;
  priceDetails?: string;
  labels: string[];
  description: string;
  amenities: string[];
  features: string[];
  locationDescription?: string;
  videoUrl?: string;
  floorplanDescription?: string;
  visible: boolean;
  availability?: string;
  maidsRoom?: boolean;
}

const AdminEditSupabase = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === "new";
  
  const { property: existingProperty, loading: loadingProperty } = useProperty(isNew ? undefined : id);

  const [formData, setFormData] = useState<PropertyFormData>({
    id: "",
    name: "",
    neighborhood: "",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    price: "",
    labels: [],
    description: "",
    amenities: [],
    features: [],
    visible: true,
  });

  const [mainImage, setMainImage] = useState<string>("");
  const [floorplanImage, setFloorplanImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existingProperty && !isNew) {
      setFormData({
        id: existingProperty.id,
        name: existingProperty.name,
        neighborhood: existingProperty.neighborhood,
        subcluster: existingProperty.subcluster,
        bedrooms: existingProperty.bedrooms,
        bathrooms: existingProperty.bathrooms,
        sqft: existingProperty.sqft,
        price: existingProperty.price,
        rentPricePerYear: existingProperty.rentPricePerYear,
        priceDetails: existingProperty.priceDetails,
        labels: existingProperty.labels || [],
        description: existingProperty.description,
        amenities: existingProperty.amenities || [],
        features: existingProperty.features || [],
        locationDescription: existingProperty.locationDescription,
        videoUrl: existingProperty.videoUrl,
        floorplanDescription: existingProperty.floorplanDescription,
        visible: existingProperty.visible !== false,
        availability: existingProperty.availability,
        maidsRoom: existingProperty.maidsRoom,
      });
      setMainImage(existingProperty.image || "");
      setFloorplanImage(existingProperty.floorplanImage || "");
    }
  }, [existingProperty, isNew]);

  const handleMainImageUpload = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);

      try {
        const uploaded = await uploadImage(file, `properties/${formData.id || 'temp'}/main`);
        setMainImage(uploaded.publicUrl);
        toast({
          title: "Image uploaded",
          description: "Main image uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload image",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [formData.id, toast]
  );

  const handleFloorplanUpload = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);

      try {
        const uploaded = await uploadImage(file, `properties/${formData.id || 'temp'}/floorplan`);
        setFloorplanImage(uploaded.publicUrl);
        toast({
          title: "Floorplan uploaded",
          description: "Floorplan uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload floorplan",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [formData.id, toast]
  );

  const mainImageDropzone = useDropzone({
    onDrop: handleMainImageUpload,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
    disabled: uploading,
  });

  const floorplanDropzone = useDropzone({
    onDrop: handleFloorplanUpload,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
    disabled: uploading,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.neighborhood || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (isNew && !formData.id) {
      toast({
        title: "Error",
        description: "Please provide a property ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        id: formData.id,
        name: formData.name,
        neighborhood: formData.neighborhood,
        subcluster: formData.subcluster,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        sqft: formData.sqft,
        maids_room: formData.maidsRoom || false,
        price: formData.price,
        rent_price_per_year: formData.rentPricePerYear,
        price_details: formData.priceDetails,
        image_url: mainImage,
        floorplan_url: floorplanImage,
        floorplan_description: formData.floorplanDescription,
        video_url: formData.videoUrl,
        description: formData.description,
        location_description: formData.locationDescription,
        labels: formData.labels,
        amenities: formData.amenities,
        features: formData.features,
        availability: formData.availability || 'available',
        visible: formData.visible,
      };

      const { error } = await supabase
        .from("properties")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      toast({
        title: isNew ? "Property Created" : "Property Updated",
        description: `${formData.name} has been ${isNew ? "created" : "updated"} successfully.`,
      });

      navigate("/admin");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save property",
        variant: "destructive",
      });
    }
  };

  const updateArrayField = (field: "labels" | "amenities" | "features", value: string) => {
    const items = value.split("\n").filter((item) => item.trim());
    setFormData((prev) => ({ ...prev, [field]: items }));
  };

  if (loadingProperty && !isNew) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/admin")} variant="ghost">
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
            disabled={uploading}
          >
            {isNew ? "Create Property" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="lists">Lists</TabsTrigger>
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

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms</Label>
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
                        placeholder="AED 450,000"
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
                  <CardTitle>Main Property Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    {...mainImageDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      mainImageDropzone.isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input {...mainImageDropzone.getInputProps()} />
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    {mainImage ? (
                      <div className="space-y-2">
                        <img src={mainImage} alt="Preview" className="max-h-48 mx-auto rounded" />
                        <p className="text-sm text-foreground">Click or drag to replace image</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        {uploading ? "Uploading..." : "Drop main image here or click to upload"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Floor Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    {...floorplanDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      floorplanDropzone.isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input {...floorplanDropzone.getInputProps()} />
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    {floorplanImage ? (
                      <div className="space-y-2">
                        <img src={floorplanImage} alt="Floorplan" className="max-h-48 mx-auto rounded" />
                        <p className="text-sm text-foreground">Click or drag to replace floorplan</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        {uploading ? "Uploading..." : "Drop floorplan here or click to upload"}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="floorplanDescription">Floorplan Description</Label>
                    <Input
                      id="floorplanDescription"
                      value={formData.floorplanDescription || ""}
                      onChange={(e) => setFormData({ ...formData, floorplanDescription: e.target.value })}
                      placeholder="Spacious 4-bedroom layout..."
                    />
                  </div>
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
                </CardHeader>
                <CardContent>
                  <Label htmlFor="labels">Labels (one per line)</Label>
                  <Textarea
                    id="labels"
                    value={formData.labels?.join("\n") || ""}
                    onChange={(e) => updateArrayField("labels", e.target.value)}
                    placeholder="Luxury Amenities&#10;City View"
                    rows={3}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="features">Features (one per line)</Label>
                  <Textarea
                    id="features"
                    value={formData.features?.join("\n") || ""}
                    onChange={(e) => updateArrayField("features", e.target.value)}
                    placeholder="Smart Home Technology&#10;Italian Marble Flooring"
                    rows={6}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="amenities">Amenities (one per line)</Label>
                  <Textarea
                    id="amenities"
                    value={formData.amenities?.join("\n") || ""}
                    onChange={(e) => updateArrayField("amenities", e.target.value)}
                    placeholder="24/7 Concierge Service&#10;Infinity Pool"
                    rows={6}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
};

export default AdminEditSupabase;

