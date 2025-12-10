import React from 'react'

export default function Input(props: any){
  return (
    <input {...props} className={`border rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 ${props.className || ''}`} />
  )
}
