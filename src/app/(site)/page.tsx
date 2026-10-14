import { Hero } from "@/components/site/Hero";
import { VideoShowcase } from "@/components/site/VideoShowcase";
import { Program } from "@/components/site/Program";
import { Hadith } from "@/components/site/Hadith";
import { GallerySection } from "@/components/site/GallerySection";
import { LatestPosts } from "@/components/site/LatestPosts";
import { Contact } from "@/components/site/Contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <VideoShowcase />
      <Program />
      <Hadith />
      <GallerySection />
      <LatestPosts />
      <Contact />
    </>
  );
}
