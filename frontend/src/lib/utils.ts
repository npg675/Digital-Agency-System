import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertGoogleDriveUrl(url: string): string {
  if (!url) return url;
  
  let fileId = "";
  
  // Try matching /file/d/FILE_ID
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    fileId = fileDMatch[1];
  } else {
    // Try matching id=FILE_ID or docid=FILE_ID
    const idMatch = url.match(/[?&](?:id|docid)=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    }
  }
  
  if (fileId) {
    // Return direct web link that displays cleanly in HTML and background css
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  return url;
}

export function resolveImageUrl(path: string): string {
  if (!path) return "";
  
  // Normalize Windows backslashes to forward slashes
  const normalizedPath = path.replace(/\\/g, "/");

  if (normalizedPath.startsWith("http://") || normalizedPath.startsWith("https://") || normalizedPath.startsWith("data:")) {
    return normalizedPath;
  }
  
  // If the path contains 'uploads/'
  if (normalizedPath.includes("uploads/")) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const host = apiBase.split("/api/v1")[0]; // e.g. "http://localhost:8000" or ""
    
    // Find where "uploads/" starts and get everything after it
    const uploadsIndex = normalizedPath.indexOf("uploads/");
    const uploadsPath = normalizedPath.substring(uploadsIndex); // e.g. "uploads/some-uuid.png"
    
    return `${host}/api/${uploadsPath}`;
  }
  
  return normalizedPath;
}
