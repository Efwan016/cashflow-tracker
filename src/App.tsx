import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Layout from './component/layout/layout'

// Styles
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Skeleton from './component/components/Skeleton';

// Lazy Loaded Components
const Auth = lazy(() => import('./component/pages/Auth'));
const Dashboard = lazy(() => import('./component/pages/Dashboard'));
const Transaction = lazy(() => import('./component/pages/Transaction'));
const Expense = lazy(() => import('./component/pages/Expense'));
const Product = lazy(() => import('./component/pages/Product'));
const Stock = lazy(() => import('./component/pages/Stock'));
const StockLogs = lazy(() => import('./component/pages/StockLogs'));
const Reports = lazy(() => import('./component/pages/Reports'));
const Profile = lazy(() => import('./component/pages/Profile'));

// Settings Group
const Settings = lazy(() => import('./component/pages/Setting'));
const Privacy = lazy(() => import('./component/pages/Setting/Privacy'));
const DeleteAccount = lazy(() => import('./component/pages/Setting/DeleteAccount'));
const Terms = lazy(() => import('./component/pages/Setting/Term'));
const DetailInfo = lazy(() => import('./component/pages/Setting/DetailInfo'));


function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Skeleton />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Auth />} />

          {/* Protected Routes */}
          {[
            { path: '/dashboard', element: <Dashboard /> },
            { path: '/transactions', element: <Transaction /> },
            { path: '/products', element: <Product /> },
            { path: '/expenses', element: <Expense /> },
            { path: '/stock', element: <Stock /> },
            { path: '/stock-logs', element: <StockLogs /> },
            { path: '/reports', element: <Reports /> },
            { path: '/profile', element: <Profile /> },
            { path: '/settings', element: <Settings /> },
            { path: '/privacy', element: <Privacy /> },
            { path: '/terms', element: <Terms /> },
            { path: '/delete', element: <DeleteAccount /> },
            { path: '/detailinfo', element: <DetailInfo /> },
          ].map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<Layout>{route.element}</Layout>}
            />
          ))}
        </Routes>
      </Suspense>

      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        newestOnTop
        theme="dark"
        closeOnClick
        pauseOnHover
        draggable
        toastClassName={() =>
          "!flex !items-center !gap-3 !rounded-2xl !px-4 !py-3 !mb-4 " +
          "!bg-slate-900/70 !backdrop-blur-xl !border !border-white/10 " +
          "!shadow-[0_20px_50px_rgba(0,0,0,0.5)] !text-slate-100"
        }
      />
    </BrowserRouter>
  )
}

export default App