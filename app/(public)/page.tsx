import type { Metadata } from "next";
import HeroCercle from "@/components/home/HeroCercle";
import EspaceClientSection from "@/components/home/EspaceClientSection";
import { EngagementsSection, DomainesSection } from "@/components/home/EngagementsDomaines";
import EquipeSection from "@/components/home/EquipeSection";
import RendezVousSection from "@/components/home/RendezVousSection";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "SHIFT UP | Excellence • Innovation • Performance" },
  description:
    "Cabinet de conseil stratégique et solutions numériques basé à Abomey-Calavi, Bénin. Transforming Business, Shaping Future.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "SHIFT UP",
  description:
    "Cabinet de conseil stratégique et solutions numériques. Excellence, Innovation, Performance.",
  url: "https://www.shiftup.bj",
  logo: "https://www.shiftup.bj/assets/logo.png",
  image: "https://www.shiftup.bj/assets/og-image.png",
  telephone: "+2290195035099",
  email: "contact@shiftup.bj",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Abomey-Calavi",
    addressLocality: "Abomey-Calavi",
    addressRegion: "Atlantique",
    addressCountry: "BJ",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 6.4487,
    longitude: 2.3396,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
  ],
  sameAs: [
    "https://wa.me/2290195035099",
  ],
  priceRange: "XOF",
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: { "@type": "GeoCoordinates", latitude: 6.4487, longitude: 2.3396 },
    geoRadius: "2000000",
  },
  serviceType: [
    "Conseil Stratégique", "Transformation Digitale", "Marketing Digital",
    "Juridique & Comptabilité", "BTP & Génie Civil", "Formation Professionnelle",
    "Solutions Numériques", "Finance & Investissement",
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroCercle />
      <EspaceClientSection />
      <EngagementsSection />
      <DomainesSection />
      <EquipeSection />
      <RendezVousSection />
    </>
  );
}
