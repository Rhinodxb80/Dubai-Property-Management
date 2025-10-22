import PropertyCard from "./PropertyCard";
import { useMergedProperties } from "@/lib/property-service";

const PropertyGrid = () => {
  const properties = useMergedProperties();
  const visibleProperties = properties.filter((property) => property.visible !== false);

  return (
    <section id="properties" className="py-20 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Available Properties
          </h2>
          <p className="text-xl text-muted-foreground">
            Discover our exclusive collection
          </p>
        </div>

        <div className="space-y-8">
          {visibleProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertyGrid;
