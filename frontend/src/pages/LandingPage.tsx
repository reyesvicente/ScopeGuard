import { FinalCta } from "../features/landing/components/FinalCta";
import { Guardrails } from "../features/landing/components/Guardrails";
import { Hero } from "../features/landing/components/Hero";
import { HowItWorks } from "../features/landing/components/HowItWorks";
import { LandingFooter } from "../features/landing/components/LandingFooter";
import { LandingHeader } from "../features/landing/components/LandingHeader";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Guardrails />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
