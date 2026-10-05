/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Academy } from './pages/Academy';
import { Checkout } from './pages/Checkout';
import { Media } from './pages/Media';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Services } from './pages/Services';
import { CMSProvider } from './components/CMSContext';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true, // animates elements when scrolling up as well
      offset: 100,
    });
  }, []);

  return (
    <CMSProvider>
      <HelmetProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="academy" element={<Academy />} />
            <Route path="register" element={<Checkout />} />
            <Route path="academy/checkout/:id" element={<Checkout />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="media" element={<Media />} />
            <Route path="media/:slug" element={<Media />} /> {/* Placeholder for individual articles */}
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
    </CMSProvider>
  );
}
