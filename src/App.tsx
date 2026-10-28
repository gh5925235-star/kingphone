import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { CategoryPage } from '@/pages/CategoryPage';
import { ProductPage } from '@/pages/ProductPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { ConfirmationPage } from '@/pages/ConfirmationPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AuthProvider } from '@/admin/context/AuthContext';
import { RequireAuth } from '@/admin/components/RequireAuth';
import { AdminLayout } from '@/admin/components/AdminLayout';
import { LoginPage } from '@/admin/pages/LoginPage';
import { OrdersPage } from '@/admin/pages/OrdersPage';
import { OrderDetailsPage } from '@/admin/pages/OrderDetailsPage';
import { OrderEditPage } from '@/admin/pages/OrderEditPage';
import { NewOrderPage } from '@/admin/pages/NewOrderPage';
import { DocumentPage } from '@/admin/pages/DocumentPage';
import { SettingsPage } from '@/admin/pages/SettingsPage';
import { ProductsPage } from '@/admin/pages/ProductsPage';
import { ProductEditPage } from '@/admin/pages/ProductEditPage';
import { CategoriesPage } from '@/admin/pages/CategoriesPage';
import { DashboardPage } from '@/admin/pages/DashboardPage';
import { AdminErrorBoundary } from '@/admin/components/AdminErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/c/:slug" element={<CategoryPage />} />
            <Route path="/p/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:orderNumber" element={<ConfirmationPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<RequireAuth />}>
            <Route element={<AdminErrorBoundary><AdminLayout /></AdminErrorBoundary>}>
              <Route index element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/new" element={<NewOrderPage />} />
              <Route path="orders/:id" element={<OrderDetailsPage />} />
              <Route path="orders/:id/edit" element={<OrderEditPage />} />
              <Route path="orders/:id/doc/:docType" element={<DocumentPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<ProductEditPage />} />
              <Route path="products/:id" element={<ProductEditPage />} />
              <Route path="categories" element={<CategoriesPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
