import { HeroSection } from "@/components/home/hero-section";
import { FeatureSection } from "@/components/home/feature-section";
import { PlatformSection } from "@/components/home/platform-section";
import { TemplateSection } from "@/components/home/template-section";
import { TestimonialSection } from "@/components/home/testimonial-section";
import { CTASection } from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeatureSection />
      <PlatformSection />
      <TemplateSection />
      <TestimonialSection />
      <CTASection />
    </div>
  );
}