import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { AccountsListPage } from './pages/AccountsListPage';
import { CreateAccountPage } from './pages/CreateAccountPage';
import { AccountDetailPage } from './pages/AccountDetailPage';
import { RequestSpendPage } from './pages/RequestSpendPage';
import { SpendDetailPage } from './pages/SpendDetailPage';
import { SpendGatePage } from './pages/SpendGatePage';
import { CreditsPage } from './pages/CreditsPage';
import { EvidencePage } from './pages/EvidencePage';
import { LimitsPage } from './pages/LimitsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen flex flex-col bg-parchment-50 text-slate-900 font-sans selection:bg-amber-200 selection:text-slate-950">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/accounts" element={<AccountsListPage />} />
            <Route path="/accounts/new" element={<CreateAccountPage />} />
            <Route path="/accounts/:id" element={<AccountDetailPage />} />
            <Route path="/accounts/:id/spend" element={<RequestSpendPage />} />
            <Route path="/spends/:id" element={<SpendDetailPage />} />
            <Route path="/gate" element={<SpendGatePage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/limits" element={<LimitsPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};
