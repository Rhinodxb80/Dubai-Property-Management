import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { properties, formatBedroomLabel } from "@/data/properties";
import { formatCurrencyAED } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Home, Bed, Bath, Ruler, MapPin, ExternalLink } from "lucide-react";

const TenantPropertyView = () => {
  const { id } = useParams();
  const property = useMemo(() => properties.find((p) => p.id === id), [id]);

  const priceDisplay = formatCurrencyAED(property?.price);
  const rentDisplay = formatCurrencyAED(property?.rentPricePerYear ?? property?.price);
  const priceText = rentDisplay || priceDisplay;
  const defaultPriceText = priceText || property?.price || "Price on request";
  const showPerYear = !!priceText && /\d/.test(priceText);

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <p className="text-muted-foreground">Property not found</p>
      </div>
    );
  }

  const mapQuery = encodeURIComponent(
    `${property.name} ${property.neighborhood} ${property.subcluster ?? ""} Dubai`.trim(),
  );
  const searchMapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const googleMapUrl = property.googleMapUrl?.trim();
  const externalMapUrl = googleMapUrl || searchMapUrl;
  const locationLabel = property.subcluster
    ? `${property.neighborhood} - ${property.subcluster}`
    : property.neighborhood;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="md:w-1/2">
                <div className="h-48 overflow-hidden rounded-lg border border-border bg-muted md:h-full">
                  <img
                    src={property.image}
                    alt={property.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{property.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reference ID:&nbsp;
                    <span className="font-medium text-foreground">{property.id}</span>
                  </p>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-1 h-4 w-4" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{locationLabel}</p>
                    <p className="text-sm">Dubai, United Arab Emirates</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open(externalMapUrl, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Google Maps
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{formatBedroomLabel(property.bedrooms, property.maidsRoom)}</Badge>
                    <Badge variant="secondary">{property.bathrooms} Bathrooms</Badge>
                    <Badge variant="secondary">{property.sqft.toLocaleString()} sqft</Badge>
                  </div>
                </div>
                {property.priceDetails && (
                  <p className="text-sm text-muted-foreground">
                    Rental terms: {property.priceDetails}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Bed className="mb-2 h-8 w-8 text-primary" />
              <p className="text-2xl font-bold">{formatBedroomLabel(property.bedrooms, property.maidsRoom)}</p>
              <p className="text-sm text-muted-foreground">Bedrooms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Bath className="mb-2 h-8 w-8 text-primary" />
              <p className="text-2xl font-bold">{property.bathrooms}</p>
              <p className="text-sm text-muted-foreground">Bathrooms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Ruler className="mb-2 h-8 w-8 text-primary" />
              <p className="text-2xl font-bold">{property.sqft.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Sqft</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Home className="mb-2 h-8 w-8 text-primary" />
              <p className="text-2xl font-bold">{defaultPriceText}</p>
              <p className="text-sm text-muted-foreground">Price</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Property Name</TableCell>
                  <TableCell>{property.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Location</TableCell>
                  <TableCell>{locationLabel}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bedrooms</TableCell>
                  <TableCell>{formatBedroomLabel(property.bedrooms, property.maidsRoom)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bathrooms</TableCell>
                  <TableCell>{property.bathrooms}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Size</TableCell>
                  <TableCell>{property.sqft.toLocaleString()} sqft</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Price</TableCell>
                  <TableCell>{defaultPriceText}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Property Type</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {property.labels.map((label) => (
                        <Badge key={label} variant="secondary">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{property.description}</p>
            {property.locationDescription && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  About the Location
                </h3>
                <p className="text-muted-foreground leading-relaxed">{property.locationDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Features</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {property.features.map((feature) => (
                  <TableRow key={feature}>
                    <TableCell>{feature}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-700">
                        Yes
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Building Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amenity</TableHead>
                  <TableHead>Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {property.amenities.map((amenity) => (
                  <TableRow key={amenity}>
                    <TableCell>{amenity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-700">
                        Yes
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rental Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Monthly Rent</TableCell>
                  <TableCell>{defaultPriceText}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Rental Terms</TableCell>
                  <TableCell>{property.priceDetails || "Standard tenancy contract"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Security Deposit</TableCell>
                  <TableCell>As per Dubai rental laws</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Utilities</TableCell>
                  <TableCell>DEWA to be paid separately by tenant</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Parking</TableCell>
                  <TableCell>Included</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantPropertyView;









