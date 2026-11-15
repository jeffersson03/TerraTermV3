import { createBrowserRouter } from 'react-router'
import ExplorerLayout from '@/layouts/ExplorerLayout'
import ExplorerPage from '@/pages/ExplorerPage'
import RouteErrorPage from '@/pages/RouteErrorPage'
import { ROUTE_PATHS } from '@/router/routePaths'

// El usuario entra directo al explorador (sin landing).
export const appRouter = createBrowserRouter([
  {
    path: ROUTE_PATHS.explorer,
    element: <ExplorerLayout />,
    errorElement: <RouteErrorPage />,
    children: [{ index: true, element: <ExplorerPage /> }],
  },
])
