import { redirect } from 'next/navigation'

interface ChatsPageProps {
  params: Promise<{ businessId: string }>
}

export default async function ChatsPage({ params }: ChatsPageProps) {
  const { businessId } = await params
  redirect(`/dashboard/${businessId}/chat`)
}
