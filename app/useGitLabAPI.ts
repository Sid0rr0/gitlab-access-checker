export default async function callGitLabAPI(endpoint: string) {
  const data = await fetch(process.env.NEXT_PUBLIC_GITLAB_API_URL as string + endpoint, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITLAB_API_TOKEN}`,
    },
  })

  // TODO check for headers for pagination

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

export async function getAllGroupsAndProjectsDFS(initialGroupId: number) {
  const usersMap = new Map<number, UserData>()

  const visitedGroups = new Set<number>()
  const stack: GitLabGroup[] = []

  stack.push(await getGroupDetails(initialGroupId))

  while (stack.length > 0) {
    const group = stack.pop() as GitLabGroup
    if (visitedGroups.has(group.id)) continue

    visitedGroups.add(group.id)
    await getGroupMembers(group, usersMap)

    const projects = await callGitLabAPI(`/groups/${group.id}/projects`)
    for (const project of projects || []) {
      await getProjectMembers(project, usersMap)
    }

    const subgroups = await callGitLabAPI(`/groups/${group.id}/subgroups`)
    for (const subgroup of subgroups || []) {
      stack.push({ id: subgroup.id, name: subgroup.name })
    }
  }

  return Array.from(usersMap.values())
}

async function getGroupDetails(groupId: number) {
  const data = await callGitLabAPI(`/groups/${groupId}`)
  return {
    id: data.id,
    name: data.name,
  }
}

async function getGroupMembers(group: { id: number, name: string }, usersMap: Map<number, UserData>) {
  const members = await callGitLabAPI(`/groups/${group.id}/members`)

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
}

async function getProjectMembers(project: {
  id: number
  name: string
}, usersMap: Map<number, UserData>) {
  const projectMembers = await callGitLabAPI(`/projects/${project.id}/members`)
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
  // return data?.map((user: GitLabUser) => ({ id: user.id, name: user.name, username: user.username, accessLevel: user.access_level }))
}

async function getDescendantGroup(groupId: number) {
  const data = await callGitLabAPI(`/groups/${groupId}/descendant_groups`)
  return data?.map((subgroup: { id: number, name: string }) => ({ id: subgroup.id, name: subgroup.name }))
}

export async function getAllGroupsAndProjectsDescendant(initialGroupId: number) {
  const usersMap = new Map<number, UserData>()

  const initialGroup = await getGroupDetails(initialGroupId)
  const subgroups = await getDescendantGroup(initialGroupId)
  const allGroups = [initialGroup, ...(subgroups || [])]

  for (const group of allGroups) {
    await getGroupMembers(group, usersMap)

    const projects = await callGitLabAPI(`/groups/${group.id}/projects`)
    for (const project of projects || []) {
      await getProjectMembers(project, usersMap)
    }
  }

  return Array.from(usersMap.values())
}
