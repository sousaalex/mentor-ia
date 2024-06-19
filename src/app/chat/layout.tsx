export const metadata = {
  title: 'MentorIA',
  description: 'Uma Implementação de modelo de Aprendizagem baseado de inteligêndia Artificial',
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
