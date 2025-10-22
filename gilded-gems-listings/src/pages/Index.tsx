import Hero from "@/components/Hero";
import RentalBenefits from "@/components/RentalBenefits";
import PropertyGrid from "@/components/PropertyGrid";
import ContactForm from "@/components/ContactForm";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <RentalBenefits />
      <PropertyGrid />
      <ContactForm />
    </div>
  );
};

export default Index;
