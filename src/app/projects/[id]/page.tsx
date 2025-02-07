import React from 'react'
import ProjectDetails from '@/components/ProjectDetails'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  return <ProjectDetails id={params.id} />
}