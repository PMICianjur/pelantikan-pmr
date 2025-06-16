'use client'

import React, { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Image from 'next/image'

type PropType = {
  images: string[]
}

export const Carousel = ({ images }: PropType) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {images.map((src, index) => (
            <div className="relative flex-grow-0 flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 p-2" key={index}>
              {/* --- PERUBAHAN DI BARIS DI BAWAH INI --- */}
              <div className="relative aspect-square block h-full w-full overflow-hidden rounded-lg">
                 <Image
                    src={src}
                    alt={`Dokumentasi Acara ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover bg-zinc-200 transition-transform duration-500 ease-in-out hover:scale-105"
                 />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button
        className="absolute top-1/2 -translate-y-1/2 left-0 sm:-left-4 bg-white/80 hover:bg-white text-zinc-900 rounded-full p-2 shadow-md transition-all backdrop-blur-sm"
        onClick={scrollPrev}
        aria-label="Previous slide"
      >
        <ArrowLeft size={24} />
      </button>
      <button
        className="absolute top-1/2 -translate-y-1/2 right-0 sm:-right-4 bg-white/80 hover:bg-white text-zinc-900 rounded-full p-2 shadow-md transition-all backdrop-blur-sm"
        onClick={scrollNext}
        aria-label="Next slide"
      >
        <ArrowRight size={24} />
      </button>
    </div>
  )
}