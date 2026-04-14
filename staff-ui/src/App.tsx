import { Admin, Resource } from 'react-admin'

import { authProvider } from './providers/authProvider'
import { dataProvider } from './providers/dataProvider'
import BlogPostCreate from './pages/blog/BlogPostCreate'
import BlogPostEdit from './pages/blog/BlogPostEdit'
import BlogPostList from './pages/blog/BlogPostList'
import CallbackLeadList from './pages/CallbackLeadList'
import CallbackLeadShow from './pages/CallbackLeadShow'
import EmailTemplateEdit from './pages/emailTemplates/EmailTemplateEdit'
import EmailTemplateList from './pages/emailTemplates/EmailTemplateList'
import PortfolioCreate from './pages/portfolio/PortfolioCreate'
import PortfolioEdit from './pages/portfolio/PortfolioEdit'
import PortfolioList from './pages/portfolio/PortfolioList'
import ReviewCreate from './pages/reviews/ReviewCreate'
import ReviewEdit from './pages/reviews/ReviewEdit'
import ReviewList from './pages/reviews/ReviewList'
import StaffDashboard from './pages/StaffDashboard'

export default function App() {
  return (
    <Admin
      basename="/staff"
      dataProvider={dataProvider}
      authProvider={authProvider}
      dashboard={StaffDashboard}
      title="Фабрика Тентов — персонал"
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
    </Admin>
  )
}
