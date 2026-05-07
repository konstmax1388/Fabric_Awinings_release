import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type ModelViewerAttributes = Omit<HTMLAttributes<HTMLElement>, 'src'> & {
  src?: string
  poster?: string
  alt?: string
  'camera-controls'?: boolean
  'touch-action'?: string
  'shadow-intensity'?: string | number
  exposure?: string | number
  'auto-rotate'?: boolean
  ar?: boolean
  'environment-image'?: string
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<ModelViewerAttributes, HTMLElement>
    }
  }
}
