import server from 'socket.io'
import app from './app'
const PORT = 3030      

try {
  const io = server.listen(PORT)
  app(io)
  console.log(`Сервис для работы с локальным оборудованием запущен на порту ${PORT}`)
} catch (error) {
  console.error(error)
}
