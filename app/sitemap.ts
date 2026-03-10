import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shiftup.bj";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/a-propos`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/connexion`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/inscription`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];
}
