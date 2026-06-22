import { useReveal } from "@/hooks/use-reveal";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import Services from "@/components/site/Services";
import Doctors from "@/components/site/Doctors";
import LabTests from "@/components/site/LabTests";
import Deals from "@/components/site/Deals";
import PriorityBanner from "@/components/site/PriorityBanner";
import Features from "@/components/site/Features";
import Reviews from "@/components/site/Reviews";
import AppDownload from "@/components/site/AppDownload";
import Footer from "@/components/site/Footer";

const Index = () => {
  useReveal();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Services />
        <Doctors />
        <LabTests />
        <Deals />
        <PriorityBanner />
        <Features />
        <Reviews />
        <AppDownload />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
