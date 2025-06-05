export default async function callGitLabAPI(endpoint: string) {
  const data = await fetch(process.env.NEXT_PUBLIC_GITLAB_API_URL as string + endpoint, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITLAB_API_TOKEN}`,
    },
  })

  return await data.json()
}

type GitLabGroup = {
  id: number
  name: string
}

interface AccessLevelMapping {
  [key: number]: string
}

const ACCESS_LEVELS: AccessLevelMapping = {
  0: 'No access',
  5: 'Minimal access',
  10: 'Guest',
  15: 'Planner',
  20: 'Reporter',
  30: 'Developer',
  40: 'Maintainer',
  50: 'Owner',
  60: 'Admin',
}

type UserData = {
  id: number
  name: string
  username: string
  groups: string[]
  projects: string[]
}

export async function getAllGroupsAndProjects(initialGroupId: number) {
  const usersMap = new Map<number, UserData>()

  const visitedGroups = new Set<number>()
  const stack: GitLabGroup[] = []

  stack.push(await getGroupDetails(initialGroupId))

  while (stack.length > 0) {
    const group = stack.pop() as GitLabGroup
    if (visitedGroups.has(group.id)) continue

    visitedGroups.add(group.id)
    const members = await getGroupMembers(group.id)

    for (const member of members || []) {
      const existingUser = usersMap.get(member.id)
      if (!existingUser) {
        usersMap.set(member.id, {
          id: member.id,
          name: member.name,
          username: member.username,
          groups: [`${group.name} (${ACCESS_LEVELS[member.accessLevel]})`],
          projects: [],
        })
      }
      else {
        existingUser.groups.push(`${group.name} (${ACCESS_LEVELS[member.accessLevel]})`)
      }
    }

    const projects = await callGitLabAPI(`/groups/${group.id}/projects`)
    for (const project of projects || []) {
      const projectMembers = await getProjectMembers(project.id)
      for (const projectMember of projectMembers || []) {
        const existingUser = usersMap.get(projectMember.id)
        if (existingUser) {
          existingUser.projects.push(project.name)
        }
        else {
          usersMap.set(projectMember.id, {
            id: projectMember.id,
            name: projectMember.name,
            username: projectMember.username,
            groups: [],
            projects: [project.name],
          })
        }
      }
    }

    const subgroups = await callGitLabAPI(`/groups/${group.id}/subgroups`)
    for (const subgroup of subgroups || []) {
      stack.push({ id: subgroup.id, name: subgroup.name })
    }
  }

  console.log('Users Map:', usersMap)
  return Array.from(usersMap.values())
}

async function getGroupDetails(groupId: number) {
  const data = await callGitLabAPI(`/groups/${groupId}`)
  return {
    id: data.id,
    name: data.name,
  }
}

async function getGroupMembers(groupId: number) {
  const data = await callGitLabAPI(`/groups/${groupId}/members`)
  return data?.map(user => ({ id: user.id, name: user.name, username: user.username, accessLevel: user.access_level }))
}

async function getProjectMembers(projectId: number) {
  const data = await callGitLabAPI(`/projects/${projectId}/members`)
  return data?.map(user => ({ id: user.id, name: user.name, username: user.username, accessLevel: user.access_level }))
}
