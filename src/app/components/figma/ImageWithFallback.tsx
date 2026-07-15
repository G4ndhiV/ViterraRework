import React, { useState } from 'react'
import { optimizedImageUrl } from '../../lib/supabaseImageUrl'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  /**
   * Ancho objetivo (px) para pedir la imagen ya redimensionada/comprimida vía el
   * endpoint de transformación de Supabase Storage. No afecta el `width` nativo del
   * `<img>` (layout); solo el recurso que se descarga. Sin efecto en URLs que no son
   * de Supabase Storage (p. ej. el CDN de Tokko).
   */
  optimizeWidth?: number
  optimizeQuality?: number
}

export function ImageWithFallback(props: Props) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, loading, optimizeWidth, optimizeQuality, ...rest } = props

  const resolvedSrc = optimizeWidth
    ? optimizedImageUrl(src, { width: optimizeWidth, quality: optimizeQuality })
    : src

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      loading={loading ?? 'lazy'}
      {...rest}
      onError={handleError}
    />
  )
}
