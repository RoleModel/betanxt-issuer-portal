'use client'

import React from 'react'

import Layout from '@/components/Layout/Layout'
import { PageTitle } from '@/components/PageTitle'

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout navBar={true}>
      <PageTitle>Education</PageTitle>
      {children}
    </Layout>
  )
}
