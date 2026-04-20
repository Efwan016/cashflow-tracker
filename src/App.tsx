import './App.css'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import Layout from './component/layout/layout'

// Lazy load semua page
const Auth = lazy(() => import('./component/pages/Auth'))
const Dashboard = lazy(() => import('./component/pages/Dashboard'))
const Transaction = lazy(() => import('./component/pages/Transaction'))
const Expense = lazy(() => import('./component/pages/Expense'))
const Product = lazy(() => import('./component/pages/Product'))
const Stock = lazy(() => import('./component/pages/Stock'))
const StockLogs = lazy(() => import('./component/pages/StockLogs'))
const Reports = lazy(() => import('./component/pages/Reports'))
const Profile = lazy(() => import('./component/pages/Profile'))
const Settings = lazy(() => import('./component/pages/Setting'))
const Privacy = lazy(() => import('./component/pages/Setting/Privacy'))
const DeleteAccount = lazy(() => import('./component/pages/Setting/DeleteAccount'))
const Terms = lazy(() => import('./component/pages/Setting/Term'))
const DetailInfo = lazy(() => import('./component/pages/Setting/DetailInfo'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="text-white text-center mt-10">Loading...</div>}>
        <Routes>

          <Route path="/" element={<Auth />} />

          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/transactions" element={<Layout><Transaction /></Layout>} />
          <Route path="/products" element={<Layout><Product /></Layout>} />
          <Route path="/expenses" element={<Layout><Expense /></Layout>} />
          <Route path="/stock" element={<Layout><Stock /></Layout>} />
          <Route path="/stock-logs" element={<Layout><StockLogs /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />

          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
          <Route path="/terms" element={<Layout><Terms /></Layout>} />
          <Route path="/delete" element={<Layout><DeleteAccount /></Layout>} />
          <Route path="/detailinfo" element={<Layout><DetailInfo /></Layout>} />

        </Routes>
      </Suspense>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        toastClassName="!bg-slate-900/40 !backdrop-blur-2xl !border !border-white/10 !rounded-[30px] !shadow-[0_32px_64px_-15px_rgba(0,0,0,0.6)] !text-slate-100 !text-center !px-6"
      />
    </BrowserRouter>
  )
}

export default App