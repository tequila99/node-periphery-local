import Reader from './Reader'

export default  async io => {
    await Reader(io).connect()
    io.on("connection", socket => {
      console.log(`Установлено соединение с сокетом (ID: ${socket.id})`)
      socket.emit("status_barcode_scanner", Reader.connected)
      socket.on("get_status_barcode_scanner", function () {
        socket.emit("status_barcode_scanner", Reader.connected)
      })
      socket.on("reconnect", () => {
        socket.emit("status_barcode_scenner", Reader.connected)
      })
      socket.on("disconnect", (reason) => {
        console.log(`Отключение сокета ID: ${socket.id} по причине: ${reason}`)
      })
    })
}
