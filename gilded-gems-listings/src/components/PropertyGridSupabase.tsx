import PropertyCard from "./PropertyCard";
import { useProperties } from "@/hooks/use-properties";

const PropertyGridSupabase = () => {
  const { properties, loading } = useProperties();
  const visibleProperties = properties.filter((property) => property.visible !== false);

  if (loading) {
    return (
      <section id="properties" className="py-20 px-6 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-xl text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      </section>
    );
  }

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

        {visibleProperties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No properties available at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertyGridSupabase;

