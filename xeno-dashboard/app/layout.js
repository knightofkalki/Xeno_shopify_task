import { AuthProvider } from './context/AuthContext'

export const metadata = {
  title: 'Xeno Analytics',
  description: 'Professional Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}


