import Hero from "@/components/Hero";
import RentalBenefits from "@/components/RentalBenefits";
import PropertyGrid from "@/components/PropertyGrid";
import PropertyGridSupabase from "@/components/PropertyGridSupabase";
import ContactForm from "@/components/ContactForm";

const isSupabaseConfigured = 
  Boolean(import.meta.env.VITE_SUPABASE_URL) && 
  Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <RentalBenefits />
      {isSupabaseConfigured ? <PropertyGridSupabase /> : <PropertyGrid />}
      <ContactForm />
    </div>
  );
};

export default Index;
