import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ArkansasDirectory from "./pages/ArkansasDirectory";
import ListingDetail from "./pages/ListingDetail";
import AddListing from "./pages/AddListing";
import ListYourHome from "./pages/ListYourHome";
import FeaturedListingsPage from "./pages/FeaturedListings";
import ImportListings from "./pages/ImportListings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AllListings from "./pages/AllListings";
import Favorites from "./pages/Favorites";
import SoberLivingLittleRock from "./pages/SoberLivingLittleRock";
import SoberLivingFortSmith from "./pages/SoberLivingFortSmith";
import SoberLivingFayetteville from "./pages/SoberLivingFayetteville";
import SoberLivingJonesboro from "./pages/SoberLivingJonesboro";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFacilities from "./pages/admin/AdminFacilities";
import AdminFacilityEdit from "./pages/admin/AdminFacilityEdit";
import AdminImport from "./pages/admin/AdminImport";
import ExportNoPhotos from "./pages/admin/ExportNoPhotos";
import AdminCountyResources from "./pages/admin/AdminCountyResources";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import Directory from "./pages/Directory";
import Counties from "./pages/Counties";
import CountyLanding from "./pages/CountyLanding";
import { TreatmentHub, CountyTreatment, StateTreatmentType } from "./pages/TreatmentCenters";
import { TREATMENT_TYPES } from "./lib/treatmentTypes";
import ForCounselors from "./pages/ForCounselors";
import CounselorCounty from "./pages/CounselorCounty";
import GetListed from "./pages/GetListed";
import GetFeatured from "./pages/GetFeatured";
import RecoveryResources, { GuidePage } from "./pages/RecoveryResources";
import Agents from "./pages/Agents";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/arkansas-directory" element={<ArkansasDirectory />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/add" element={<ProtectedRoute><AddListing /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><ImportListings /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/all-listings" element={<AllListings />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/sober-living-little-rock-arkansas" element={<SoberLivingLittleRock />} />
            <Route path="/sober-living-fort-smith-arkansas" element={<SoberLivingFortSmith />} />
            <Route path="/sober-living-fayetteville-arkansas" element={<SoberLivingFayetteville />} />
            <Route path="/sober-living-jonesboro-arkansas" element={<SoberLivingJonesboro />} />
            <Route path="/list-your-home" element={<ListYourHome />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/counties" element={<Counties />} />
            <Route path="/counties/:slug" element={<CountyLanding />} />
            <Route path="/treatment-centers" element={<TreatmentHub />} />
            <Route path="/treatment-centers/:county" element={<CountyTreatment />} />
            <Route path="/treatment-centers/:county/:type" element={<CountyTreatment />} />
            {TREATMENT_TYPES.map((t) => <Route key={t.path} path={t.path} element={<StateTreatmentType />} />)}
            <Route path="/for-counselors" element={<ForCounselors />} />
            <Route path="/for-counselors/:slug" element={<CounselorCounty />} />
            <Route path="/get-listed" element={<GetListed />} />
            <Route path="/get-featured" element={<GetFeatured />} />
            <Route path="/recovery-resources" element={<RecoveryResources />} />
            <Route path="/recovery-resources/:slug" element={<GuidePage />} />
            <Route path="/featured" element={<FeaturedListingsPage />} />
            <Route path="/agents" element={<Agents />} />
            {/* Admin panel */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="facilities" element={<AdminFacilities />} />
              <Route path="facilities/:id" element={<AdminFacilityEdit />} />
              <Route path="import" element={<AdminImport />} />
              <Route path="county-resources" element={<AdminCountyResources />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="export-no-photos" element={<ExportNoPhotos />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    <Analytics />
  </QueryClientProvider>
);

export default App;
