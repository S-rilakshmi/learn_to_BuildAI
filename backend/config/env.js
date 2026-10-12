import 'dotenv/config'

// Every environment value the server reads, resolved in one place. The rest of
// the app imports from here instead of touching process.env, so a mistyped
// variable name is one edit rather than a hunt through the codebase.
//
// The key is MONGODB_URI (not MONGO_URI) - it must match backend/.env exactly,
// or it arrives as undefined and the server refuses to boot.

export const PORT = process.env.PORT || 4000
export const MONGO_URI = process.env.MONGODB_URI
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

// 5 MB is plenty for a resume.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024