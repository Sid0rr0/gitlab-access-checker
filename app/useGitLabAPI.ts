'use server'

export default async function callGitLabAPI(endpoint: string) {
  let hasNextPage = true
  const allData = []
  let page = 1

  while (hasNextPage) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_GITLAB_API_URL + endpoint)
      url.searchParams.set('per_page', String(100))
      url.searchParams.set('page', String(page))

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.GITLAB_API_TOKEN}`,
        },
      })

      const data = await response.json()

      if (response.headers.get('x-next-page')) {
        allData.push(...data)
        page += 1
      }
      else {
        if (data.length > 0) {
          allData.push(...data)
          hasNextPage = false
          continue
        }

        return data
      }
    }
    catch (error) {
      console.error('Error fetching data from GitLab API:', error)
      throw new Error('Failed to fetch data from GitLab API')
    }
  }

  return allData
}

type GitLabGroup = {
  id: number
  name: string
}

type GitLabProject = {
  id: number
  name: string
}

type GitLabMember = {
  id: number
  name: string
  username: string
  access_level: number
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

export type UserData = {
  id: number
  name: string
  username: string
  groups: string[]
  projects: string[]
}

// Gets all groups and projects recursively using DFS and fetches group and projects members
export async function getAllGroupsAndProjectsDFS(initialGroupId: number) {
  const usersMap = new Map<number, UserData>()

  const visitedGroups = new Set<number>()
  const stack: GitLabGroup[] = []

  stack.push(await getGroupDetails(initialGroupId))

  while (stack.length > 0) {
    const group = stack.pop() as GitLabGroup
    if (visitedGroups.has(group.id)) continue

    visitedGroups.add(group.id)
    const [projectsPromise, subgroupsPromise] = await Promise.allSettled([
      callGitLabAPI(`/groups/${group.id}/projects`),
      callGitLabAPI(`/groups/${group.id}/subgroups`),
      getGroupMembers(group, usersMap),
    ])

    if (projectsPromise.status === 'fulfilled' && projectsPromise.value) {
      const projects = projectsPromise.value
      for (const project of projects) {
        await getProjectMembers(project, usersMap)
      }
    }

    if (subgroupsPromise.status === 'fulfilled' && subgroupsPromise.value) {
      const subgroups = subgroupsPromise.value as GitLabGroup[]
      for (const subgroup of subgroups) {
        stack.push({ id: subgroup.id, name: subgroup.name })
      }
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
  const members: GitLabMember[] = await callGitLabAPI(`/groups/${group.id}/members`)

  for (const member of members) {
    const existingUser = usersMap.get(member.id)
    if (!existingUser) {
      usersMap.set(member.id, {
        id: member.id,
        name: member.name,
        username: member.username,
        groups: [`${group.name} (${ACCESS_LEVELS[member.access_level]})`],
        projects: [],
      })
    }
    else {
      existingUser.groups.push(`${group.name} (${ACCESS_LEVELS[member.access_level]})`)
    }
  }
}

async function getProjectMembers(project: {
  id: number
  name: string
}, usersMap: Map<number, UserData>) {
  const projectMembers: GitLabMember[] = await callGitLabAPI(`/projects/${project.id}/members`)
  for (const projectMember of projectMembers) {
    const existingUser = usersMap.get(projectMember.id)
    if (existingUser) {
      existingUser.projects.push(`${project.name} (${ACCESS_LEVELS[projectMember.access_level]})`)
    }
    else {
      usersMap.set(projectMember.id, {
        id: projectMember.id,
        name: projectMember.name,
        username: projectMember.username,
        groups: [],
        projects: [`${project.name} (${ACCESS_LEVELS[projectMember.access_level]})`],
      })
    }
  }
}

async function getDescendantGroup(groupId: number) {
  const data = await callGitLabAPI(`/groups/${groupId}/descendant_groups`)
  return data?.map((subgroup: { id: number, name: string }) => ({ id: subgroup.id, name: subgroup.name }))
}

// Gets all subgroups with `/groups/:id/descendant_groups` and parrallelly fetches subgroups and projects members
export async function getAllGroupsAndProjectsDescendantPar(initialGroupId: number) {
  const usersMap = new Map<number, UserData>()

  const initialGroup = await getGroupDetails(initialGroupId)
  const subgroups = await getDescendantGroup(initialGroupId)
  const allGroups = [initialGroup, ...subgroups]

  const groupProcessingPromises = allGroups.map(async (group) => {
    const [projectsResult] = await Promise.allSettled([
      callGitLabAPI(`/groups/${group.id}/projects`),
      getGroupMembers(group, usersMap),
    ])

    if (projectsResult.status === 'fulfilled' && projectsResult.value) {
      const projects: GitLabProject[] = projectsResult.value
      const projectMemberPromises = projects.map(project => getProjectMembers(project, usersMap))
      await Promise.allSettled(projectMemberPromises)
    }
  })

  await Promise.allSettled(groupProcessingPromises)

  return Array.from(usersMap.values())
}

// Gets all subgroups with `/groups/:id/descendant_groups` and parrallelly fetches subgroups and projects members
export async function getAllGroupsAndProjectsDescendantV3(initialGroupId: number) {
  const usersMap = new Map<number, UserData>()

  const [
    initialGroupDetailsResult,
    descendantGroupsResult,
    allProjectsInInitialGroupTreeResult, // Projects from initial group and its subgroups
  ] = await Promise.allSettled([
    getGroupDetails(initialGroupId),
    getDescendantGroup(initialGroupId),
    callGitLabAPI(`/groups/${initialGroupId}/projects?include_subgroups=true`),
  ])

  const allPromises: Promise<void>[] = []

  if (initialGroupDetailsResult.status === 'fulfilled' && descendantGroupsResult.status === 'fulfilled') {
    const allGroups = [initialGroupDetailsResult.value, ...descendantGroupsResult.value]
    for (const group of allGroups) {
      allPromises.push(getGroupMembers(group, usersMap))
    }
  }

  if (allProjectsInInitialGroupTreeResult.status === 'fulfilled') {
    const projects = allProjectsInInitialGroupTreeResult.value
    for (const project of projects) {
      allPromises.push(getProjectMembers(project, usersMap))
    }
  }

  await Promise.allSettled(allPromises)

  return Array.from(usersMap.values())
}

// Gets all subgroups with `/groups/:id/descendant_groups` and sequentially fetches subgroups and projects members
export async function getAllGroupsAndProjectsDescendantSeq(initialGroupId: number) {
  const usersMap = new Map<number, UserData>()

  const initialGroup = await getGroupDetails(initialGroupId)
  const subgroups = await getDescendantGroup(initialGroupId)
  const allGroups = [initialGroup, ...subgroups]

  for (const group of allGroups) {
    await getGroupMembers(group, usersMap)

    const projects = await callGitLabAPI(`/groups/${group.id}/projects`)
    for (const project of projects) {
      await getProjectMembers(project, usersMap)
    }
  }

  return Array.from(usersMap.values())
}
