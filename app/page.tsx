import { AuditExperienceLoader } from "./components/AuditExperienceLoader";
import { Header, Hero, OperatorPromises, TopBanner } from "./components/homeSections";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-[#f8f7f2] text-[#111111]">
      <TopBanner />
      <Header />
      <Hero />
      <OperatorPromises />
      <AuditExperienceLoader />
    </main>
  );
}
