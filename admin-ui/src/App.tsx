import { Admin, CustomRoutes, Resource } from 'react-admin'
import { Route } from 'react-router-dom'

import { i18nProvider } from './i18n/i18nProvider'
import { AdminLayout } from './layout/AdminLayout'
import { authProvider } from './providers/authProvider'
import { dataProvider } from './providers/dataProvider'
import StaffLoginPage from './pages/StaffLoginPage'
import { adminTheme } from './theme/adminTheme'
import BlogPostCreate from './pages/blog/BlogPostCreate'
import BlogPostEdit from './pages/blog/BlogPostEdit'
import BlogPostList from './pages/blog/BlogPostList'
import CalculatorLeadList from './pages/CalculatorLeadList'
import CalculatorLeadShow from './pages/CalculatorLeadShow'
import CallbackLeadList from './pages/CallbackLeadList'
import CallbackLeadShow from './pages/CallbackLeadShow'
import ProductCategoryCreate from './pages/catalog/ProductCategoryCreate'
import ProductCategoryEdit from './pages/catalog/ProductCategoryEdit'
import ProductCategoryList from './pages/catalog/ProductCategoryList'
import ProductCreate from './pages/catalog/ProductCreate'
import ProductEdit from './pages/catalog/ProductEdit'
import ProductImageCreate from './pages/catalog/ProductImageCreate'
import ProductImageEdit from './pages/catalog/ProductImageEdit'
import ProductList from './pages/catalog/ProductList'
import ProductSpecificationCreate from './pages/catalog/ProductSpecificationCreate'
import ProductSpecificationEdit from './pages/catalog/ProductSpecificationEdit'
import ProductVariantCreate from './pages/catalog/ProductVariantCreate'
import ProductVariantEdit from './pages/catalog/ProductVariantEdit'
import HomeContentHub from './pages/home/HomeContentHub'
import HomeSectionPage from './pages/home/HomeSectionPage'
import OrderEdit from './pages/orders/OrderEdit'
import OrderList from './pages/orders/OrderList'
import OrderShow from './pages/orders/OrderShow'
import PortfolioCreate from './pages/portfolio/PortfolioCreate'
import PortfolioEdit from './pages/portfolio/PortfolioEdit'
import PortfolioList from './pages/portfolio/PortfolioList'
import ReviewCreate from './pages/reviews/ReviewCreate'
import ReviewEdit from './pages/reviews/ReviewEdit'
import ReviewList from './pages/reviews/ReviewList'
import ReviewModerationQueue from './pages/reviews/ReviewModerationQueue'
import StaffDashboard from './pages/StaffDashboard'
import CustomerProfileCreate from './pages/customers/CustomerProfileCreate'
import CustomerProfileEdit from './pages/customers/CustomerProfileEdit'
import CustomerProfileList from './pages/customers/CustomerProfileList'
import ShippingAddressCreate from './pages/customers/ShippingAddressCreate'
import ShippingAddressEdit from './pages/customers/ShippingAddressEdit'
import ShippingAddressList from './pages/customers/ShippingAddressList'

export default function App() {
  return (
    <Admin
      layout={AdminLayout}
      dataProvider={dataProvider}
      authProvider={authProvider}
      i18nProvider={i18nProvider}
      theme={adminTheme}
      loginPage={StaffLoginPage}
      dashboard={StaffDashboard}
      title="Фабрика Тентов — рабочая панель"
      requireAuth
    >
      <CustomRoutes>
        <Route path="home-content/sections/:slug" element={<HomeSectionPage />} />
        <Route path="home-content" element={<HomeContentHub />} />
        <Route path="reviews/moderation" element={<ReviewModerationQueue />} />
      </CustomRoutes>
      <Resource
        name="portfolio-projects"
        options={{ label: 'Портфолио' }}
        list={PortfolioList}
        create={PortfolioCreate}
        edit={PortfolioEdit}
      />
      <Resource
        name="reviews"
        options={{ label: 'Отзывы' }}
        list={ReviewList}
        create={ReviewCreate}
        edit={ReviewEdit}
      />
      <Resource
        name="blog-posts"
        options={{ label: 'Блог' }}
        list={BlogPostList}
        create={BlogPostCreate}
        edit={BlogPostEdit}
      />
      <Resource
        name="callback-leads"
        options={{ label: 'Заявки: обратный звонок' }}
        list={CallbackLeadList}
        show={CallbackLeadShow}
        hasCreate={false}
      />
      <Resource
        name="calculator-leads"
        options={{ label: 'Заявки: калькулятор' }}
        list={CalculatorLeadList}
        show={CalculatorLeadShow}
        hasCreate={false}
      />
      <Resource
        name="orders"
        options={{ label: 'Заказы' }}
        list={OrderList}
        show={OrderShow}
        edit={OrderEdit}
        hasCreate={false}
      />
      <Resource
        name="product-categories"
        options={{ label: 'Категории каталога' }}
        list={ProductCategoryList}
        create={ProductCategoryCreate}
        edit={ProductCategoryEdit}
      />
      <Resource
        name="products"
        options={{ label: 'Товары' }}
        list={ProductList}
        create={ProductCreate}
        edit={ProductEdit}
      />
      <Resource
        name="product-variants"
        options={{ label: 'Варианты товара' }}
        create={ProductVariantCreate}
        edit={ProductVariantEdit}
      />
      <Resource
        name="product-images"
        options={{ label: 'Изображения товара' }}
        create={ProductImageCreate}
        edit={ProductImageEdit}
      />
      <Resource
        name="product-specifications"
        options={{ label: 'Характеристики товара' }}
        create={ProductSpecificationCreate}
        edit={ProductSpecificationEdit}
      />
      <Resource
        name="customer-profiles"
        options={{ label: 'Профили покупателей' }}
        list={CustomerProfileList}
        create={CustomerProfileCreate}
        edit={CustomerProfileEdit}
      />
      <Resource
        name="shipping-addresses"
        options={{ label: 'Адреса доставки' }}
        list={ShippingAddressList}
        create={ShippingAddressCreate}
        edit={ShippingAddressEdit}
      />
    </Admin>
  )
}
