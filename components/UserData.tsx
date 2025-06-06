import { type UserData } from '@/app/useGitLabAPI'

export default function UserData({ data }: { data: UserData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
      {data?.map(user => (
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
  )
}
