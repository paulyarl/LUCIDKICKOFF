import EditPackForm from '../EditForm'

export default function EditPackPage({ params }: { params: { id: string } }) {
  return <EditPackForm id={params.id} />
}
