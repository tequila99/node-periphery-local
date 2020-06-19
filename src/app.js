import CardReaderNFC from './nfc-reader/nfc-reader'
import Scanner from './scanner/Reader'

export default async io => {
  const cardReader = CardReaderNFC(io)
  const scanner = Scanner(io)
  await cardReader.connect()
  await scanner.connect()

  io.on('connection', (socket) => {
    console.log(`Установлено соединение с сокетом (ID: ${socket.id})`)
    socket.emit('status_card_reader', cardReader.connected)
    socket.emit('status_barcode_scanner', scanner.connected)
    socket.on('get_status_card_reader', function () {
      socket.emit('status_card_reader', cardReader.connected)
    })
    socket.on('get_status_barcode_scanner', function () {
      socket.emit('status_barcode_scanner', scanner.connected)
    })
    socket.on('reconnect', () => {
      socket.emit('status_card_reader', cardReader.connected)
      socket.emit('status_barcode_scanner', scanner.connected)
    })
    socket.on('disconnect', (reason) => {
      console.log(`Отключение сокета ID: ${socket.id} по причине: ${reason}`)
    })
  })
}
