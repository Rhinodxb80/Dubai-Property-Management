import { useState, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import PropertyImageGallery from "@/components/PropertyImageGallery";
import {
  ArrowLeft,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Check,
  Mail,
  Phone,
  X,
  Calendar,
  User,
  ExternalLink,
} from "lucide-react";
import property2Main from "@/assets/property-2.jpg";
import property3Main from "@/assets/property-3.jpg";

const fallbackGallery = [
  { url: property2Main, title: "Property View", description: "Luxury property in prime location" },
  { url: property2Main, title: "Garden View", description: "Beautifully manicured gardens" },
  { url: property3Main, title: "Interior", description: "Spacious living area with natural light" },
];

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const property = id ? findPropertyById(id) : undefined;
  const contactFormRef = useRef<HTMLDivElement>(null);
  const [activeFloorplanIndex, setActiveFloorplanIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

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
        title: image.title || `${property.name} ? Image ${index + 1}`,
        description: image.description,
      }))
    : fallbackGallery;

  const developmentImages = property.developmentImages ?? [];
  const floorplans = property.floorplans ?? [];
  const mapUrl = property.googleMapUrl?.trim();
  const embedMapUrl = mapUrl && mapUrl.includes("embed") ? mapUrl : undefined;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you as soon as possible.",
    });
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const scrollToContact = () => {
    contactFormRef.current?.scrollIntoView({ behavior: "smooth" });
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">{property.name}</h1>
            <Button onClick={scrollToContact} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Contact Us
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {property.labels.map((label) => (
              <Badge key={label} className="bg-primary text-primary-foreground font-medium text-sm px-3 py-1">
                {label}
              </Badge>
            ))}
          </div>
          <p className="text-3xl font-bold text-primary">
            {defaultPriceText}
            {showPerYear && <span className="text-lg font-normal text-muted-foreground ml-2">per year</span>}
          </p>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getPropertyAvailabilityBadgeClasses(availabilityInfo.type)}`}>
              {availabilityInfo.label}
            </span>
          </div>
        </div>

        <div className="mb-12">
          <PropertyImageGallery images={galleryImages} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-card p-8 rounded-xl text-center shadow-card">
            <Bed className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-3xl font-bold text-card-foreground mb-2">{formatBedroomLabel(property.bedrooms, property.maidsRoom)}</p>
          </div>
          <div className="bg-card p-8 rounded-xl text-center shadow-card">
            <Bath className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-3xl font-bold text-card-foreground mb-2">{property.bathrooms}</p>
            <p className="text-muted-foreground">Bathrooms</p>
          </div>
          <div className="bg-card p-8 rounded-xl text-center shadow-card">
            <Maximize className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-3xl font-bold text-card-foreground mb-2">{property.sqft.toLocaleString()}</p>
            <p className="text-muted-foreground">Square Feet</p>
          </div>
          <div className="bg-card p-8 rounded-xl text-center shadow-card">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-xl font-bold text-card-foreground mb-1">{property.neighborhood}</p>
            {property.subcluster && <p className="text-sm text-muted-foreground">{property.subcluster}</p>}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Pricing</h2>
          <div className="bg-card p-6 rounded-xl shadow-card">
            <p className="text-4xl font-bold text-primary mb-2">
              {defaultPriceText}
              {showPerYear && <span className="text-xl font-normal text-muted-foreground ml-3">per year</span>}
            </p>
            {property.priceDetails && <p className="text-lg text-muted-foreground">{property.priceDetails}</p>}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6">About This Property</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">{property.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Features</h2>
            <ul className="space-y-3">
              {property.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-lg text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Amenities</h2>
            <ul className="space-y-3">
              {property.amenities.map((amenity) => (
                <li key={amenity} className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-lg text-foreground">{amenity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {floorplans.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">Floor Plans</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {floorplans.map((plan, index) => (
                <div
                  key={plan.url}
                  className="bg-card border border-border rounded-xl p-4 hover:shadow-card transition cursor-pointer"
                  onClick={() => setActiveFloorplanIndex(index)}
                >
                  <img
                    src={plan.url}
                    alt={plan.title || `Floor Plan ${index + 1}`}
                    className="w-full rounded-lg border border-border mb-3"
                  />
                  <p className="font-semibold text-foreground">{plan.title || `Floor Plan ${index + 1}`}</p>
                  {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {developmentImages.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">About the Development</h2>
            <PropertyImageGallery images={developmentImages} />
          </div>
        )}

        {floorplans.length > 0 && (
          <Dialog open={activeFloorplanIndex !== null} onOpenChange={(open) => setActiveFloorplanIndex(open ? activeFloorplanIndex : null)}>
            <DialogContent className="max-w-screen-2xl h-screen p-0 bg-white dark:bg-gray-950">
              <div className="relative w-full h-full flex items-center justify-center p-8">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-foreground hover:bg-muted z-50"
                  onClick={() => setActiveFloorplanIndex(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
                {activeFloorplanIndex !== null && (
                  <img
                    src={floorplans[activeFloorplanIndex].url}
                    alt={floorplans[activeFloorplanIndex].title || "Floor Plan"}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6">Location</h2>
          <div className="bg-card rounded-2xl overflow-hidden shadow-card">
            <iframe
              src={embedMapUrl ?? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3613.0739583905945!2d55.17045!3d25.09702!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b26b3d0b5a5%3A0x5f5c3e5f5c3e5f5c!2sDubai%2C%20United%20Arab%20Emirates!5e0!3m2!1sen!2s!4v1234567890"}
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            />
            <div className="p-6 bg-card space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg text-foreground mb-1">{property.neighborhood}</p>
                  {mapUrl ? null : <p className="text-muted-foreground">Dubai, United Arab Emirates</p>}
                </div>
              </div>
              {property.locationDescription && (
                <p className="text-muted-foreground leading-relaxed">{property.locationDescription}</p>
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
            </div>
          </div>
        </div>

        <div ref={contactFormRef} className="bg-card p-8 md:p-12 rounded-2xl shadow-card">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Interested in This Property?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Fill out the form below and we'll get back to you as soon as possible
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="contact-name" className="text-base mb-2 block">
                  <User className="inline w-4 h-4 mr-2" />
                  Name
                </Label>
                <Input
                  id="contact-name"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="Your Name"
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="contact-email" className="text-base mb-2 block">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  placeholder="your@email.com"
                  className="h-12"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contact-phone" className="text-base mb-2 block">
                <Phone className="inline w-4 h-4 mr-2" />
                Phone
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                placeholder="+971 50 123 4567"
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="contact-message" className="text-base mb-2 block">
                Message
              </Label>
              <Textarea
                id="contact-message"
                value={formData.message}
                onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                placeholder="Tell us about your requirements..."
                rows={5}
                className="resize-none"
              />
            </div>

            <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;




