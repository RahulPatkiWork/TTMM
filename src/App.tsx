/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AddExpense } from './pages/AddExpense';

// Placeholder components for other routes
const Friends = () => <div className="p-4 text-center text-gray-500 mt-10">Friends Page (Coming Soon)</div>;
const Activity = () => <div className="p-4 text-center text-gray-500 mt-10">Activity Feed (Coming Soon)</div>;
const Account = () => <div className="p-4 text-center text-gray-500 mt-10">Account Settings (Coming Soon)</div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="friends" element={<Friends />} />
          <Route path="add" element={<AddExpense />} />
          <Route path="activity" element={<Activity />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
