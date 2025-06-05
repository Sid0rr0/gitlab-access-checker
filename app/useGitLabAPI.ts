export default async function callGitLabAPI(endpoint: string) {
  const data = await fetch(process.env.NEXT_PUBLIC_GITLAB_API_URL as string + endpoint, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITLAB_API_TOKEN}`,
    },
  })

  return await data.json()
}
