import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bed, Maximize, ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Property,
  getPropertyAvailabilityInfo,
  getPropertyAvailabilityBadgeClasses,
  formatBedroomLabel,
  DEFAULT_PROPERTY_IMAGE,
} from "@/data/properties";
import { formatCurrencyAED } from "@/lib/formatters";

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const rentDisplay = formatCurrencyAED(property.rentPricePerYear ?? property.price);

  const navigate = useNavigate();
  const { id, name, neighborhood, bedrooms, sqft, labels } = property;
  const availabilityInfo = getPropertyAvailabilityInfo(property.availability);
  const primaryImage = property.image || DEFAULT_PROPERTY_IMAGE;

  return (
    <Card className="overflow-hidden hover:shadow-luxury transition-all duration-300 bg-gradient-to-b from-card to-secondary/20">
      <div className="grid md:grid-cols-2 gap-0">
        <div className="relative h-96 md:h-full overflow-hidden">
          <img 
            src={primaryImage} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {labels.map((label, index) => (
              <Badge 
                key={index}
                className="bg-primary text-primary-foreground font-medium shadow-lg"
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
        
        <CardContent className="p-8 md:p-12 flex flex-col justify-center">
          <h3 className="text-3xl md:text-4xl font-bold text-card-foreground mb-3">
            {name}
          </h3>
          <p className="text-xl text-muted-foreground mb-2">
            {neighborhood}
          </p>
          
          {rentDisplay && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">Annual Rent</p>
              <p className="text-2xl font-bold text-primary">{rentDisplay}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getPropertyAvailabilityBadgeClasses(availabilityInfo.type)}`}>
              {availabilityInfo.label}
            </span>
          </div>
          
          <div className="flex items-center gap-8 mb-8">
            <div className="flex items-center gap-3">
              <Bed className="w-6 h-6 text-primary" />
              <span className="text-lg font-medium text-foreground">
                {formatBedroomLabel(bedrooms, property.maidsRoom)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Maximize className="w-6 h-6 text-primary" />
              <span className="text-lg font-medium text-foreground">{sqft.toLocaleString()} sqft</span>
            </div>
          </div>

          <Button 
            onClick={() => navigate(`/property/${id}`)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground group"
            size="lg"
          >
            View Details
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardContent>
      </div>
    </Card>
  );
};

export default PropertyCard;




