import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LanguageGate } from "@/components/LanguageGate";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";

import OperationsPage from "@/pages/OperationsPage";
import BrewPage from "@/pages/BrewPage";
import BatchesPage from "@/pages/BatchesPage";
import BatchDetailPage from "@/pages/BatchDetailPage";
import RecipesPage from "@/pages/RecipesPage";
import RecipeDetailPage from "@/pages/RecipeDetailPage";
import RecipeNewPage from "@/pages/RecipeNewPage";
import SettingsPage from "@/pages/SettingsPage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppProvider>
          <LanguageGate>
            <AuthGate>
              <Routes>
                {/* Auth routes — no shell */}
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                {/* App routes — wrapped in shell */}
                <Route element={<AppShell />}>
                  <Route path="/" element={<OperationsPage />} />
                  <Route path="/brew" element={<BrewPage />} />
                  <Route path="/batches" element={<BatchesPage />} />
                  <Route path="/batches/:id" element={<BatchDetailPage />} />
                  <Route path="/recipes" element={<RecipesPage />} />
                  <Route path="/recipes/new" element={<RecipeNewPage />} />
                  <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Routes>
            </AuthGate>
          </LanguageGate>
        </AppProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}
