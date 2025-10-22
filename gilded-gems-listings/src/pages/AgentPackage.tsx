import { useParams, useSearchParams } from "react-router-dom";
import { properties } from "@/data/properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const AgentPackage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const property = properties.find(p => p.id === id);
  const includeTitleDeed = searchParams.get('titleDeed') === 'true';
  const includeEid = searchParams.get('eid') === 'true';

  if (!property) {
    return <div className="min-h-screen flex items-center justify-center">Property not found</div>;
  }

  const floorplans = property.floorplans ?? [];

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: "Copied!",
      description: `${fieldName} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadExpose = () => {
    toast({
      title: "Download Started",
      description: "Exposé PDF is being downloaded",
    });
  };

  const handleDownloadAllPhotos = () => {
    toast({
      title: "Download Started",
      description: "All photos are being downloaded as ZIP",
    });
  };

  const googleMapsLocation = `${property.neighborhood}${property.subcluster ? ', ' + property.subcluster : ''}, Dubai`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Agent Package</h1>
          <p className="text-muted-foreground">Marketing materials for {property.name}</p>
        </div>

        {/* Copy-Paste Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Property Information (Click to Copy)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Property Name
              </label>
              <div 
                className="flex items-center justify-between p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleCopy(property.name, "Property Name")}
              >
                <span className="text-foreground">{property.name}</span>
                {copiedField === "Property Name" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Google Maps Location
              </label>
              <div 
                className="flex items-center justify-between p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleCopy(googleMapsLocation, "Google Maps Location")}
              >
                <span className="text-foreground">{googleMapsLocation}</span>
                {copiedField === "Google Maps Location" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Description
              </label>
              <div 
                className="flex items-start justify-between p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleCopy(property.description, "Description")}
              >
                <span className="text-foreground text-sm leading-relaxed flex-1">
                  {property.description}
                </span>
                {copiedField === "Description" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 ml-3 flex-shrink-0" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground ml-3 flex-shrink-0" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Downloads */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Downloads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={handleDownloadAllPhotos}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All Photos (Original Size)
            </Button>

            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={handleDownloadExpose}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Exposé (PDF)
            </Button>

            {includeTitleDeed && (
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => toast({ title: "Download Started", description: "Title Deed is being downloaded" })}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Title Deed
              </Button>
            )}

            {includeEid && (
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => toast({ title: "Download Started", description: "EID is being downloaded" })}
              >
                <Download className="w-4 h-4 mr-2" />
                Download EID
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Property Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(property.galleryImages?.length ? property.galleryImages : [{ url: property.image, title: property.name }]).map((img, idx) => (
                <img 
                  key={idx}
                  src={img.url} 
                  alt={img.title}
                  className="w-full h-48 object-cover rounded-md"
                />
              ))}
              {property.developmentImages?.map((img, idx) => (
                <img
                  key={`development-${idx}`}
                  src={img.url}
                  alt={img.title}
                  className="w-full h-48 object-cover rounded-md"
                />
              ))}
              {floorplans.map((plan, idx) => (
                <img
                  key={`floorplan-${idx}`}
                  src={plan.url}
                  alt={plan.title || `Floor Plan ${idx + 1}`}
                  className="w-full h-48 object-cover rounded-md"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentPackage;
