import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from '../components/ErrorBoundary'

export const metadata = {
  title: 'Xeno Analytics',
  description: 'Professional Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}


