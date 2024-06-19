export const metadata = {
  title: 'MentorIA',
  description: 'Aprendizado Inteligente, Crescimento Exponencial',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
