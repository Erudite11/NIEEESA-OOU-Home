import React from 'react'

export default function Button({ children, variant = 'default', className = '', ...props }: any) {
  const base =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none transform-gpu'

  const variants: any = {
    default:
      'bg-gradient-to-r from-cyan-500 to-blue-500 bg-[length:200%_200%] bg-left text-white px-3 py-2 hover:bg-right hover:scale-105 hover:shadow-lg active:scale-95',
    ghost:
      'bg-transparent text-gray-700 px-2 py-1 hover:bg-gray-100 hover:scale-105 active:scale-95',
    destructive:
      'bg-red-600 text-white px-3 py-2 hover:bg-red-700 hover:scale-105 active:scale-95',
    subtle:
      'bg-gray-100 text-gray-800 px-2 py-1 hover:scale-105 active:scale-95',
  }

  return (
    <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}> {children}
    </button>
  )
}