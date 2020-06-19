// websocket клиент для теста
const io = require('socket.io-client')
const ioClient = io.connect('http://localhost:3030')

ioClient.on('status_card_reader', msg => console.info('status_card_reader', msg))
ioClient.on('status_barcode_scanner', msg => console.info('status_barcode_scanner', msg))
ioClient.on('OMS', person => console.info('Прочитан полис ОМС: \n', JSON.parse(person)))
