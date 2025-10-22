import heroImage from "@/assets/hero-dubai.jpg";
import { Button } from "@/components/ui/button";

const Hero = () => {
  const scrollToProperties = () => {
    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[220px] h-[260px] sm:h-[300px] lg:h-[340px] flex items-center justify-center overflow-hidden bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center lg:text-left">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white animate-fade-in">
            Luxury Properties in Dubai
          </h1>
          <p
            className="text-lg md:text-xl text-white/85 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Discover exclusive properties in one of the world's most fascinating cities
          </p>
          <Button
            size="lg"
            onClick={scrollToProperties}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-6 py-5 shadow-luxury animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            View Properties
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
