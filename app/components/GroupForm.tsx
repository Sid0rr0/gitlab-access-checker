'use client'

import { useState } from 'react'
import { getAllGroupsAndProjects } from '@/app/useGitLabAPI'
import {
  useQuery,

} from '@tanstack/react-query'

export default function Home() {
  const [groupID, setGroupID] = useState<string | null>(null)

  const query = useQuery({ queryKey: ['group-members'], queryFn: () => getAllGroupsAndProjects(Number(groupID)), enabled: !!groupID })

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

      {query.isLoading && <p className="text-gray-500">Loading...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {query.data?.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{user.name}</h2>
            <p className="text-blue-600 text-lg mb-4">
              @
              {user.username}
            </p>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Groups:</h3>
              {user.groups.length > 0
                ? (
                    <ul className="list-disc list-inside text-gray-600">
                      {user.groups.map((group, index) => (
                        <li key={index}>{group}</li>
                      ))}
                    </ul>
                  )
                : (
                    <p className="text-gray-500 italic">No groups assigned</p>
                  )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Projects:</h3>
              {user.projects.length > 0
                ? (
                    <ul className="list-disc list-inside text-gray-600">
                      {user.projects.map((project, index) => (
                        <li key={index}>{project}</li>
                      ))}
                    </ul>
                  )
                : (
                    <p className="text-gray-500 italic">No projects assigned</p>
                  )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
