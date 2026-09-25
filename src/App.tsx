import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "@/components/sif/AppShell";
import Landing from "@/pages/Landing";
import CommandCenter from "@/pages/sif/CommandCenter";
import Investigator from "@/pages/sif/Investigator";
import Network from "@/pages/sif/Network";
import SiteIntelligence from "@/pages/sif/SiteIntelligence";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/command-center"
        element={
          <AppShell>
            <CommandCenter />
          </AppShell>
        }
      />
      <Route
        path="/investigator"
        element={
          <AppShell>
            <Investigator />
          </AppShell>
        }
      />
      <Route
        path="/network"
        element={
          <AppShell>
            <Network />
          </AppShell>
        }
      />
      <Route
        path="/sites"
        element={
          <AppShell>
            <SiteIntelligence />
          </AppShell>
        }
      />
      <Route path="/dashboard" element={<Navigate to="/command-center" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
