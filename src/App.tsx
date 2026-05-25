import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { APP_ROUTES, DEFAULT_ROUTE, appRoutes } from './routes'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          path="/"
          element={<Navigate to={DEFAULT_ROUTE.path} replace />}
        />
        {appRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route
          path="*"
          element={<Navigate to={APP_ROUTES.dashboard} replace />}
        />
      </Route>
    </Routes>
  )
}

export default App
