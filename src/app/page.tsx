import { AppShell } from "@/components/AppShell";
import { HomeExperience } from "@/components/home/HomeExperience";
import { getHomeTravelData } from "@/lib/services/travelHomeService";

export default async function HomePage() {
  const home = await getHomeTravelData();

  return (
    <AppShell active="home" header={false} compact>
      <HomeExperience home={home} />
    </AppShell>
  );
}
