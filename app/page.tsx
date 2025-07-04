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
      <div className="flex flex-col items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-8 items-center w-3xl">
          <h1 className="text-5xl font-bold">GitLab Access Checker</h1>

          <GroupForm />

        </main>
      </div>
    </QueryClientProvider>
  )
}
