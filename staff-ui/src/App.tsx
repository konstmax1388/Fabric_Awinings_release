import { Admin, Resource } from 'react-admin'

import { authProvider } from './providers/authProvider'
import { dataProvider } from './providers/dataProvider'
import CallbackLeadList from './pages/CallbackLeadList'
import CallbackLeadShow from './pages/CallbackLeadShow'
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
        name="callback-leads"
        options={{ label: 'Заявки: обратный звонок' }}
        list={CallbackLeadList}
        show={CallbackLeadShow}
        hasCreate={false}
      />
    </Admin>
  )
}
