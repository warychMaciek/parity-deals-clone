import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function removeTrailingSlash(path: string) {
  return path.replace(/\/$/, "")
}

export function createURL(
  href: string, 
  oldParams: Record<string, string>, 
  newParams: Record<string, string | undefined>
) {
  const params = new URLSearchParams(
    Object.entries(oldParams).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[String(key)] = String(value)
      return acc
    }, {})
  )

  Object.entries(newParams).forEach(([key, value]) => {
    if (value == undefined) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
  })
  return `${href}?${params.toString()}`
}