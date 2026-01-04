<<<<<<< HEAD
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LK Pilates',
    short_name: 'LK Pilates',
    description: 'Sistema de controle de alunos e aulas',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f9a24d',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  }
}
=======
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LK Pilates',
    short_name: 'LK Pilates',
    description: 'Sistema de controle de alunos e aulas',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f9a24d',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  }
}
>>>>>>> e75c32708d0bc9ffbd16ba554dddf4c2db3fdcd0
