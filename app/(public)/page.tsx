import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import ServicesSection from "@/components/home/ServicesSection";
import CountersSection from "@/components/home/CountersSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "SHIFT UP | Excellence • Innovation • Performance",
  description:
    "Cabinet de conseil stratégique et solutions numériques basé à Abomey-Calavi, Bénin. Transforming Business, Shaping Future.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <CountersSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
