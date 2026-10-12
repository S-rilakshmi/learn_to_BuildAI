// Throwaway diagnostic: does Mongo connect from here?
const mod = await
import ('./config/db.js')
try {
    await mod.connectDb()
    console.log('MONGO_OK')
    process.exit(0)
} catch (err) {
    console.log('MONGO_FAIL ::', err.name, '::', err.message.slice(0, 200))
    process.exit(0)
}