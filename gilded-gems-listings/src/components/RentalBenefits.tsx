import { Wrench, Building, Shield, Smartphone } from "lucide-react";

const rentalBenefits = [
  {
    icon: Wrench,
    title: "Full Maintenance Service",
    description: "We take care of all maintenance and repairs – hassle-free for you"
  },
  {
    icon: Building,
    title: "Modern Properties Only",
    description: "Our portfolio features almost exclusively new or recently renovated properties"
  },
  {
    icon: Shield,
    title: "Comprehensive Insurance",
    description: "All properties are fully insured for your peace of mind"
  },
  {
    icon: Smartphone,
    title: "Easy Property Management",
    description: "Access everything you need through our user-friendly tenant portal"
  }
];

const RentalBenefits = () => {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Rent With Us?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience hassle-free living with our comprehensive rental services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rentalBenefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="text-center p-6 rounded-xl bg-card hover:shadow-card transition-all duration-300 hover:-translate-y-1"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RentalBenefits;


