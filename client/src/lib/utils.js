import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getHomeUrl(rol){
  switch (rol) {
    case "admin-emp":
      return "/adminemp/home"
    case "manager":
      return "/manager/home"
    case "empleado":
      return "/empleado/home"
    case "reclutador":
      return "/reclutador/home"
      default:
        return "/login"
  }
}