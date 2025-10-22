import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPropertyAvailabilityInfo,
  getPropertyAvailabilityBadgeClasses,
  formatBedroomLabel,
  DEFAULT_PROPERTY_IMAGE,
} from "@/data/properties";
import { formatCurrencyAED } from "@/lib/formatters";
import { findPropertyById } from "@/lib/property-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PropertyImageGallery from "@/components/PropertyImageGallery";
import {
  ArrowLeft,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Check,
  Phone,
  Mail,
  MessageCircle,
  DollarSign,
  Building2,
  Calendar,
  ExternalLink,
} from "lucide-react";

import property1Main from "@/assets/property-1.jpg";
import property1Bedroom from "@/assets/property-1-bedroom.jpg";
import property1Kitchen from "@/assets/property-1-kitchen.jpg";
import property1Bathroom from "@/assets/property-1-bathroom.jpg";
import buildingLobby from "@/assets/building-lobby.jpg";
import buildingPool from "@/assets/building-pool.jpg";
import buildingGym from "@/assets/building-gym.jpg";
import floorplanPlaceholder from "@/assets/property-1-floorplan.jpg";

const galleryFallback = [
  { url: property1Main, title: "Living Room", description: "Open-plan area with skyline views" },
  { url: property1Bedroom, title: "Master Suite", description: "Luxurious bedroom with walk-in closet" },
  { url: property1Kitchen, title: "Gourmet Kitchen", description: "State-of-the-art appliances and finishes" },
  { url: property1Bathroom, title: "Spa Bathroom", description: "Marble finishes and rainfall shower" },
];

const developmentFallback = [
  { url: buildingLobby, title: "Lobby", description: "Grand entrance with concierge service" },
  { url: buildingPool, title: "Rooftop Pool", description: "Infinity pool overlooking the city" },
  { url: buildingGym, title: "Fitness Center", description: "Fully equipped residents gym" },
];

const floorplanFallback = [
  {
    url: floorplanPlaceholder,
    title: "Illustrative Floor Plan",
    description: "Representative layout for the property.",
  },
];

const PropertyDetailEnhanced = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const property = id ? findPropertyById(id) : undefined;

  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    contactMethod: "email",
  });

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Property Not Found</h1>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const availabilityInfo = getPropertyAvailabilityInfo(property.availability);
  const priceDisplay = formatCurrencyAED(property.price);
  const rentDisplay = formatCurrencyAED(property.rentPricePerYear ?? property.price);
  const priceText = rentDisplay || priceDisplay;
  const defaultPriceText = priceText || property.price || "Price on request";
  const showPerYear = !!priceText && /\d/.test(priceText);

  const galleryImages = property.galleryImages?.length
    ? property.galleryImages.map((image, index) => ({
        url: image.url,
        title: image.title || `${property.name} – Gallery ${index + 1}`,
        description: image.description,
      }))
    : galleryFallback;

  const developmentImages = property.developmentImages?.length ? property.developmentImages : developmentFallback;
  const floorplans = property.floorplans?.length ? property.floorplans : floorplanFallback;
  const mapUrl = property.googleMapUrl?.trim();
  const embedMapUrl = mapUrl && mapUrl.includes("embed") ? mapUrl : undefined;

  const videoTabs = property.videoUrl ? (
    <TabsContent value="video" className="space-y-4">
      <div className="aspect-video overflow-hidden rounded-lg border border-border">
        <iframe
          width="100%"
          height="100%"
          src={property.videoUrl}
          title="Property Tour"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </TabsContent>
  ) : null;

  const handleContactSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!contactForm.name || !contactForm.phone || !contactForm.email) {
      toast({
        title: "Error",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Contact Request Sent!",
      description: `We will contact you via ${contactForm.contactMethod}.`,
    });

    setContactForm({ name: "", phone: "", email: "", contactMethod: "email" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button onClick={() => navigate("/")} variant="ghost">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Properties
          </Button>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">{property.neighborhood}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">{property.name}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {property.labels.map((label) => (
              <Badge key={label} className="bg-primary text-primary-foreground font-medium text-sm px-3 py-1">
                {label}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="text-3xl font-bold text-primary text-foreground">
              {defaultPriceText}
              {showPerYear && <span className="ml-2 text-lg text-muted-foreground">per year</span>}
            </span>
            <span>•</span>
            <span>{formatBedroomLabel(property.bedrooms, property.maidsRoom)}</span>
            <span>•</span>
            <span>{property.sqft.toLocaleString()} sqft</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Apartment Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyImageGallery images={galleryImages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Building & Amenities Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyImageGallery images={developmentImages} />
              </CardContent>
            </Card>

            {videoTabs && (
              <Card>
                <CardHeader>
                  <CardTitle>Video Tour</CardTitle>
                </CardHeader>
                <CardContent>{videoTabs}</CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Floor Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {floorplans.map((plan) => (
                    <div key={plan.url} className="space-y-2">
                      <img src={plan.url} alt={plan.title || "Floor Plan"} className="w-full rounded-lg border border-border" />
                      <p className="text-sm font-semibold text-foreground">{plan.title}</p>
                      {plan.description && <p className="text-xs text-muted-foreground">{plan.description}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg overflow-hidden">
                  <iframe
                    src={embedMapUrl ?? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3613.0739583905945!2d55.17045!3d25.09702!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b26b3d0b5a5%3A0x5f5c3e5f5c3e5f5c!2sDubai%2C%20United%20Arab%20Emirates!5e0!3m2!1sen!2s!4v1234567890"}
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground mb-1">{property.neighborhood}</p>
                    {mapUrl ? null : <p className="text-sm text-muted-foreground">Dubai, United Arab Emirates</p>}
                  </div>
                </div>
                {property.locationDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{property.locationDescription}</p>
                )}
                {mapUrl && !embedMapUrl && (
                  <p className="text-xs text-muted-foreground">Embed view unavailable for this link. Using default map.</p>
                )}
                {mapUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open(mapUrl, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Google Maps
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Contact Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
                      placeholder="Your Name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })}
                      placeholder="+971 50 123 4567"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Preferred contact method</Label>
                    <RadioGroup
                      value={contactForm.contactMethod}
                      onValueChange={(value) => setContactForm({ ...contactForm, contactMethod: value })}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="email" id="email-method" />
                        <Label htmlFor="email-method" className="flex items-center gap-2 cursor-pointer">
                          <Mail className="w-4 h-4 text-primary" />
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="call" id="call-method" />
                        <Label htmlFor="call-method" className="flex items-center gap-2 cursor-pointer">
                          <Phone className="w-4 h-4 text-primary" />
                          Call
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="whatsapp" id="whatsapp-method" />
                        <Label htmlFor="whatsapp-method" className="flex items-center gap-2 cursor-pointer">
                          <MessageCircle className="w-4 h-4 text-primary" />
                          WhatsApp
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Request Contact
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-5 h-5" />
                      <span>Availability</span>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getPropertyAvailabilityBadgeClasses(availabilityInfo.type)}`}>
                      {availabilityInfo.label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{availabilityInfo.description}</p>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-5 h-5" />
                    <span>Price</span>
                  </div>
                  <span className="font-bold text-lg text-primary">
                    {defaultPriceText}
                    {showPerYear && <span className="ml-2 text-xs text-muted-foreground">per year</span>}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bed className="w-5 h-5" />
                    <span>Bedrooms</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatBedroomLabel(property.bedrooms, property.maidsRoom)}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bath className="w-5 h-5" />
                    <span>Bathrooms</span>
                  </div>
                  <span className="font-semibold text-foreground">{property.bathrooms}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Maximize className="w-5 h-5" />
                    <span>Area</span>
                  </div>
                  <span className="font-semibold text-foreground">{property.sqft.toLocaleString()} sqft</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-5 h-5" />
                    <span>Type</span>
                  </div>
                  <span className="font-semibold text-foreground">Penthouse</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {property.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailEnhanced;
