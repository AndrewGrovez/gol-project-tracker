import React from 'react'
import ProjectDetails from '@/components/ProjectDetails'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProjectDetails id={id} />
}