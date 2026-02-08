import { useParams } from 'react-router-dom'

export function Editor() {
  const { id } = useParams()
  return (
    <section>
      <h1>Editor</h1>
      <p>Page ID: {id}</p>
      <p>Editor stub for Phase 0.</p>
    </section>
  )
}
