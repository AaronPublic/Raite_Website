import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RAITE Registration',
    short_name: 'RAITE',
    description: 'Event registration platform for PSITE Region III',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0038A8',
    icons: [
      {
        src: '/RAITE.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
