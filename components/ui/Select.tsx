import React from 'react'

export default function Select({ children, ...props }: any){
  return (
    <select {...props} className={`border rounded px-2 py-2 focus:ring-1 focus:ring-blue-500 ${props.className || ''}`}>
      {children}
    </select>
  )
}
