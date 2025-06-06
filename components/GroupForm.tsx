'use client'

import { useState } from 'react'
import { getAllGroupsAndProjectsDFS, getAllGroupsAndProjectsDescendantPar, getAllGroupsAndProjectsDescendantSeq, getAllGroupsAndProjectsDescendantV3 } from '@/app/useGitLabAPI'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type SearchMethod = 'dfs' | 'descendant-seq' | 'descendant-par' | 'descendant-v3'

export default function Home() {
  const [groupID, setGroupID] = useState<string | null>(null)
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('descendant-v3')
  const [time, setTime] = useState<number | null>(null)

  const query = useQuery({
    queryKey: ['group-members'],
    queryFn: async () => {
      const t0 = performance.now()
      let data = null
      switch (searchMethod) {
        case 'descendant-v3':
          data = await getAllGroupsAndProjectsDescendantV3(Number(groupID))
          break
        case 'dfs':
          data = await getAllGroupsAndProjectsDFS(Number(groupID))
          break
        case 'descendant-par':
          data = await getAllGroupsAndProjectsDescendantPar(Number(groupID))
          break
        case 'descendant-seq':
          data = await getAllGroupsAndProjectsDescendantSeq(Number(groupID))
          break
        default:
          throw new Error('Invalid search method')
      }
      const t1 = performance.now()
      setTime(t1 - t0)
      return data
    },
    enabled: !!groupID,
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const groupID = formData.get('group-id') as string
    setGroupID(groupID.trim())
    if (query.isFetched) {
      query.refetch()
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-row items-end gap-4">
        <Label className="flex flex-col items-start" htmlFor="group-id">
          Group ID
          <Input type="text" name="group-id" required className="bg-white text-slate-900" />
        </Label>
        <Label className="flex flex-col items-start" htmlFor="search-method">
          Search Method
          <Select name="search-method" defaultValue="descendant-v3" onValueChange={value => setSearchMethod(value as SearchMethod)}>
            <SelectTrigger>
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dfs">DFS</SelectItem>
              <SelectItem value="descendant-seq">Descendant Groups Sequential</SelectItem>
              <SelectItem value="descendant-par">Descendant Groups Parallel</SelectItem>
              <SelectItem value="descendant-v3">Descendant Groups V3</SelectItem>
            </SelectContent>
          </Select>
        </Label>
        <Button type="submit" className="cursor-pointer" disabled={query.isFetching}>
          Check Access
        </Button>
      </form>

      {query.isFetching
        ? (
            <div role="status">
              <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          )
        : (time && (
            <p className="text-gray-500">
              Time taken:
              {' '}
              {(time / 1000).toFixed(2)}
              {' '}
              s
            </p>
          ))}
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
      {query.data && (
        <span>
          Total users:
          {' '}
          {query.data?.length || 0}
        </span>
      )}
    </>
  )
}
