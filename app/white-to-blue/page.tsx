import { auth } from "@clerk/nextjs/server";
import TechniqueTracker from "../components/TechniqueTracker";

export default async function Home() {
  // Protect this page with Clerk authentication
  await auth.protect();

  return <TechniqueTracker />;
}
  