import React from 'react'

export default function Button({ children, variant = 'default', className = '', ...props }: any){
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none'
  const variants: any = {
    default: 'bg-gradient-to-r from-cyan-500 to-blue-500  text-white px-3 py-2 hover:bg-blue-700',
    ghost: 'bg-transparent text-gray-700 px-2 py-1 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white px-3 py-2 hover:bg-red-700',
    subtle: 'bg-gray-100 text-gray-800 px-2 py-1'
  }
  return (
    <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>{children}</button>
  )
}
