'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'

export default function Settings() {
  const [gitlabApiKey, setGitlabApiKey] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const gitlabApiKey = formData.get('gitlab-access-token') as string
    if (gitlabApiKey) {
      localStorage.setItem('gitlab-access-token', gitlabApiKey)
      setGitlabApiKey(gitlabApiKey)
      setStatus('GitLab Access Token saved successfully.')
    }
  }

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gitlab-access-token')
    if (storedApiKey) {
      setGitlabApiKey(storedApiKey)
    }
  }, [])

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <main className="flex flex-col items-center justify-center gap-4 w-lg">
        <h1>Settigns</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
          <Label className="flex flex-col gap-2 items-start">
            <span>GitLab Access token</span>
            <Input type="text" name="gitlab-access-token" />
          </Label>
          <Button type="submit" className="cursor-pointer">Save</Button>
        </form>
        {status && <p className="text-green-600 mt-2">{status}</p>}
        {gitlabApiKey && (
          <p className="text-gray-600 mt-2">
            Current GitLab Access Token:
            {' '}
            <span className="font-mono">
              {'\''}
              {gitlabApiKey}
              {'\''}
            </span>
          </p>
        )}
      </main>
    </div>
  )
}
