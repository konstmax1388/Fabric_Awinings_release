import { Create } from 'react-admin'

import { BlogPostForm } from './BlogPostForm'

export default function BlogPostCreate() {
  return (
    <Create>
      <BlogPostForm />
    </Create>
  )
}
