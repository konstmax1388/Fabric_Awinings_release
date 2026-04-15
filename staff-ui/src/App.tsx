import { Admin, Resource } from 'react-admin'

import { authProvider } from './providers/authProvider'
import { dataProvider } from './providers/dataProvider'
import BlogPostCreate from './pages/blog/BlogPostCreate'
import BlogPostEdit from './pages/blog/BlogPostEdit'
import BlogPostList from './pages/blog/BlogPostList'
import CalculatorLeadList from './pages/CalculatorLeadList'
import CalculatorLeadShow from './pages/CalculatorLeadShow'
import CallbackLeadList from './pages/CallbackLeadList'
import CallbackLeadShow from './pages/CallbackLeadShow'
import ProductCategoryList from './pages/catalog/ProductCategoryList'
import ProductList from './pages/catalog/ProductList'
import EmailTemplateEdit from './pages/emailTemplates/EmailTemplateEdit'
import EmailTemplateList from './pages/emailTemplates/EmailTemplateList'
import PortfolioCreate from './pages/portfolio/PortfolioCreate'
import PortfolioEdit from './pages/portfolio/PortfolioEdit'
import PortfolioList from './pages/portfolio/PortfolioList'
import ReviewCreate from './pages/reviews/ReviewCreate'
import ReviewEdit from './pages/reviews/ReviewEdit'
import ReviewList from './pages/reviews/ReviewList'
import OrderEdit from './pages/orders/OrderEdit'
import OrderList from './pages/orders/OrderList'
import OrderShow from './pages/orders/OrderShow'
import StaffDashboard from './pages/StaffDashboard'
import GroupList from './pages/users/GroupList'
import UserEdit from './pages/users/UserEdit'
import UserList from './pages/users/UserList'

export default function App() {
  return (
    <Admin
      basename="/admin"
      dataProvider={dataProvider}
      authProvider={authProvider}
      dashboard={StaffDashboard}
      title="Фабрика Тентов — админка"
      requireAuth
    >
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
        name="email-templates"
        options={{ label: 'Шаблоны писем' }}
        list={EmailTemplateList}
        edit={EmailTemplateEdit}
        hasCreate={false}
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
        hasCreate={false}
        hasEdit={false}
      />
      <Resource
        name="products"
        options={{ label: 'Товары' }}
        list={ProductList}
        hasCreate={false}
        hasEdit={false}
      />
      <Resource name="users" options={{ label: 'Пользователи' }} list={UserList} edit={UserEdit} />
      <Resource
        name="groups"
        options={{ label: 'Группы' }}
        list={GroupList}
        hasCreate={false}
        hasEdit={false}
      />
    </Admin>
  )
}
