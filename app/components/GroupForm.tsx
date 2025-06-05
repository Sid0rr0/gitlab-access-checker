'use client'

import { useState } from 'react'
import fetchGitLabAPI from '@/app/useGitLabAPI'
import {
  useQuery,

} from '@tanstack/react-query'

export default function Home() {
  const [groupID, setGroupID] = useState<string | null>(null)

  const query = useQuery({ queryKey: ['group-members'], queryFn: () => fetchGitLabAPI(`/groups/${groupID}/members`), enabled: !!groupID })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = event.currentTarget.querySelector('input') as HTMLInputElement
    const groupID = input.value.trim()
    setGroupID(groupID)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type="text" className="bg-white text-slate-900" />
        <button type="submit" className="ml-4 px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">
          Check Access
        </button>
      </form>

      <div>
        {query.data?.map(user => (
          <li key={user.id} className="bg-white p-4">
            <span className="text-xl font-semibold text-gray-800">{user.name}</span>
            {' '}
            <a
              href={user.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline text-lg"
            >
              (@
              {user.username}
              )
            </a>
          </li>
        ))}
      </div>
    </>
  )
}
