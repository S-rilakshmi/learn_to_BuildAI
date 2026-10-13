// Temporary: category-only Mongo connection probe. Deleted after one run.
const { connectDb } = await
import ('./config/db.js')

try {
    await connectDb()
    console.log('RESULT: MONGO_OK')
} catch (err) {
    const msg = String((err && err.message) || '')
    let kind = 'OTHER'
    if (/MONGODB_URI is missing/i.test(msg)) kind = 'VAR_MISSING'
    else if (/auth|Authentication failed|bad auth/i.test(msg)) kind = 'AUTH'
    else if (/whitelist|not allowed|ENOTFOUND|ETIMEOUT|ESERVFAIL|querySrv|Server selection/i.test(msg)) kind = 'NETWORK_OR_ALLOWLIST'
    else if (/Invalid scheme|must begin with|URI/i.test(msg)) kind = 'MALFORMED_URI'
    console.log('RESULT: MONGO_FAIL')
    console.log('category:', kind)
    console.log('error name:', (err && err.name) || 'unknown')
}
process.exit(0)