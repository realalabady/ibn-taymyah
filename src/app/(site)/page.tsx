import { Hero } from "@/components/site/Hero";
import { Program } from "@/components/site/Program";
import { Hadith } from "@/components/site/Hadith";
import { Journey } from "@/components/site/Journey";
import { GallerySection } from "@/components/site/GallerySection";
import { LatestPosts } from "@/components/site/LatestPosts";
import { RegisterCTA } from "@/components/site/RegisterCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Program />
      <Hadith />
      <Journey />
      <GallerySection />
      <LatestPosts />
      <RegisterCTA />
    </>
  );
}
