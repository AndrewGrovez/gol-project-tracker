import React from 'react'
import ProjectDetails from '@/components/ProjectDetails'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }
  const { id } = await params
  return <ProjectDetails id={id} />
}