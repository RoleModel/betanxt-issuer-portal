'use client'

import React from 'react'

import Layout from '@/components/Layout/Layout'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <Layout navBar={true}>{children}</Layout>
}
