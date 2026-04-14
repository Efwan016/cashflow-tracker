import './App.css'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Auth from './component/pages/Auth'
import Dashboard from './component/pages/Dashboard'
import Transaction from './component/pages/Transaction'
import Expense from './component/pages/Expense'
import Product from './component/pages/Product'
import Stock from './component/pages/Stock'
import StockLogs from './component/pages/StockLogs'
import Reports from './component/pages/Reports'
import Profile from './component/pages/Profile'
import Layout from './component/layout/layout'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login Pages*/}
        <Route path="/" element={<Auth />} />

        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        <Route
          path="/transactions"
          element={
            <Layout>
              <Transaction />
            </Layout>
          }
        />

        <Route
          path="/products"
          element={
            <Layout>
              <Product />
            </Layout>
          }
        />

        <Route
          path="/expenses"
          element={
            <Layout>
              <Expense />
            </Layout>
          }
        />

        <Route
          path="/stock"
          element={
            <Layout>
              <Stock />
            </Layout>
          }
        />

        <Route
          path="/stock-logs"
          element={
            <Layout>
              <StockLogs />
            </Layout>
          }
        />

        <Route
          path="/reports"
          element={
            <Layout>
              <Reports />
            </Layout>
          }
        />

        <Route
          path="/profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick pauseOnHover draggable theme="dark" />
    </BrowserRouter>
  )
}

export default App