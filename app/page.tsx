'use client'

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import GroupForm from '@/components/GroupForm'

const queryClient = new QueryClient()

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <h1 className="text-5xl font-bold">GitLab Access Checker</h1>

          <GroupForm />

        </main>
        <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
          <span>GitLab Access Checker</span>
        </footer>
      </div>
    </QueryClientProvider>
  )
}
