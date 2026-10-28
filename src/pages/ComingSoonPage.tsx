import { SiteFooter } from '@/components/SiteFooter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router'
import { type Page, pathTo } from '@/lib/pages'

// What each page will show, and where its data will come from
const CONTENT: Partial<Record<Page, { title: string; eyebrow: string; overview: string; sources: string[] }>> = {
}

/** Page whose data is not integrated yet: it announces its content without showing any figure */
export function ComingSoonPage({ page }: { page: Page }) {
  const content = CONTENT[page]
  if (!content) return null
  const { title, eyebrow, overview, sources } = content
  return (
    <>
      <div className="border-b">
        <div className="mx-auto w-full max-w-5xl px-6 py-5">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">{eyebrow}</p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">{title}</h1>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-8">
        <Card className="mx-auto w-full max-w-xl">
          <CardHeader>
            <CardTitle>Page en préparation</CardTitle>
            <CardDescription>{overview}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Sources prévues</p>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {sources.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <p className="text-muted-foreground">
              En attendant, la page{' '}
              <Link to={pathTo('deputies')} className="font-medium text-foreground underline underline-offset-4">
                Députés
              </Link>{' '}
              est complète.
            </p>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </>
  )
}
