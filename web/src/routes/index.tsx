import { createFileRoute } from '@tanstack/react-router'
import { HomeView } from '../components/HomeView/HomeView'
import { OpenHomeForm } from '../components/OpenHomeForm/OpenHomeForm'
import { Page } from '../components/Page/Page'

type Search = { homeId?: string }

// The one page of the app. The home to show lives in the address: /?homeId=...
export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): Search => {
    const homeId = typeof search.homeId === 'string' ? search.homeId.trim() : ''
    return homeId ? { homeId } : {}
  },
  component: HomePage,
})

function HomePage() {
  const { homeId } = Route.useSearch()

  return (
    <Page>
      <h1>Bill Splitter</h1>
      {homeId ? <HomeView key={homeId} homeId={homeId} /> : <OpenHomeForm />}
    </Page>
  )
}
