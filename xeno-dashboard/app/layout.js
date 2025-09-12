export const metadata = {
  title: 'Xeno Shopify Dashboard',
  description: 'Advanced Shopify data sync dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
