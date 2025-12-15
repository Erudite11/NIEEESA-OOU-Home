import React from 'react'

export default function Card({ children, className = '' }: any){
  return (
    <div className={`bg-gradient-to-t from-fuchsia-200 to-cyan-50 rounded-lg shadow p-4 ${className}`}>{children}</div>
  )
}
