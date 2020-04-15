import SerialPort from 'serialport'
import ReadPort from '@serialport/parser-regex'
import parsePrescription from './prescription'

const DEVICES = [
  {
    vendor: '0C2E',
    productid: ['0CAA'],
  },
  {
    vendor: '05E0',
    productid: ['1701'],
  },
]

const TIMEOUT = 10000

const Parser = new ReadPort({
  regex: /[\n\r\t]+/,
})

const mdlpDataMatrix = new RegExp(/^01(\d{14})(.*)\x1d21([0-9A-Z]*)$/)
const PRESCRIPTION_REGEXP = new RegExp(/^p([a-zA-Z0-9\/\+]*==)$/)
const cardid = new RegExp(/^0\d{12}$/)
const ean13 = new RegExp(/^\d{13}$/)

const testOfPort = item => {
  if (
    'vendorId' in item &&
    'productId' in item &&
    !!item.vendorId &&
    !!item.productId
  ) {
    return DEVICES.some(i => {
      if (
        item.vendorId.toUpperCase() === i.vendor &&
        i.productid.includes(item.productId.toUpperCase())
      ) {
        return true
      } else {
        return false
      }
    })
  }
  return false
}

class Reader {
  constructor(io) {
    if (Reader.exists) {
      return Reader.instance
    }
    Reader.instance = this
    Reader.exists = true
    this.socketio = io
    this.connected = false
    this.port = null
    this.scanner = null
    this.timerId =  null    
    return this
  }
  async connect() {
    // console.log(111111)
    try {
      if (!this.connected) {
        const avaliblePorts = await SerialPort.list()
        const scannerPort  =  avaliblePorts.find(el => testOfPort(el))
        if (scannerPort) {
          const { manufacturer = '', pnpId = '', path = '' } = scannerPort
          this.port = {
            path,
            manufacturer,
            id: pnpId,          
          }
          this.scanner = new SerialPort(path)
          this.scanner.pipe(Parser)
          this.scanner.on('open', () => {
            this.timerId && clearTimeout(this.timerId)
            console.log(`Найден и подключен сканер штрих кода (порт ${this.port.path})` )
            this.connected = true
            this.scanner.flush(err => {
              if (err) console.error(`Ошибка при попытке сбросить сканер штрих кода (порт ${port.path}) `, err)
            })
            this.socketio && this.socketio.emit('status_barcode_scanner', true)
          })
          this.scanner.on('error', err => console.error(`Ошибка сканера штрих кода (порт ${port.path}) `,err))
          this.scanner.on('close', () => {
            console.log(`Сканер штрих кода (порт ${this.port.path}) отключен`)
            this.connected = false
            this.socketio && this.socketio.emit('status_barcode_scanner', false)
            this.port = {
              path: '',
              manufacturer: '',
              id: '',
            }
            this.scanner = null
            this.timerId && clearTimeout(this.timerId) 
            this.timerId = setTimeout(() => this.connect(), TIMEOUT)
          })
          Parser.on('data', data => {
            if (PRESCRIPTION_REGEXP.test(data.toString().trim())) {
              console.log('Прочитан льготный рецепт')
              console.log(parsePrescription(data.toString().trim()))
              this.socketio && this.socketio.emit('llo_precrition', parsePrescription(data.toString().trim()))
            }
          })
        } else {
          this.timerId && clearTimeout(this.timerId)
          this.timerId = setTimeout(() => this.connect(), TIMEOUT)
        }
      }
    } catch (error) {
      console.error('Произошла ошибка в процессе поиска сканера штрих-кода ', error)
    }
  }
}

const Api = function (io) {
  const socketio = io

  let timerId = 0

  let port = {
    path: '',
    manufacturer: '',
    id: '',
  }

  this.connected = false
  let [scanner, timeout] = [null, 10000]

  const testOfPort = function (item) {
    if (
      'vendorId' in item &&
      'productId' in item &&
      !!item.vendorId &&
      !!item.productId
    ) {
      return DEVICES.some((i) => {
        if (
          item.vendorId.toUpperCase() === i.vendor &&
          i.productid.includes(item.productId.toUpperCase())
        ) {
          return true
        } else {
          return false
        }
      })
    }
    return false
  }

  const listOfPorts = function (clb) {
    SerialPort.list()
      .then((resp) => clb(null, resp))
      .catch((resp) => clb(resp, null))
  }

  const foundOfScanners = function (clb) {
    listOfPorts((err, data) => {
      if (!err) {
        clb(
          null,
          data.filter((val) => testOfPort(val))
        )
      } else {
        clb(err, null)
      }
    })
  }

  this.isConnected = () => this.connected

  connect = function (clb = null) {
    if (!this.connected) {
      foundOfScanners((err, res) => {
        if (!err) {
          if (!!res.length) {
            const { manufacturer = '', pnpId = '', comName } = res[0]

            port = {
              path: comName,
              manufacturer: manufacturer,
              id: pnpId,
            }
            scanner = new SerialPort(comName)

            scanner.pipe(parser)
            scanner.on('open', () => {
              !!timerId ? clearTimeout(timerId) : null
              console.log(
                `Найден и подключен сканер штрих кода (порт ${port.path})`
              )
              this.connected = true
              scanner.flush((err) => {
                if (!!err) {
                  console.error(
                    `Ошибка при попытке сбросить сканер штрих кода (порт ${port.path}) `,
                    err
                  )
                }
              })
              if (socketio) {
                socketio.emit('status_barcode_scanner', true)
              }
            })
            scanner.on('error', (err) => {
              console.error(
                `Ошибка сканера штрих кода (порт ${port.path}) `,
                err
              )
            })
            scanner.on('close', () => {
              console.log(`Сканер штрих кода (порт ${port.path}) отключен`)
              this.connected = false
              if (socketio) {
                socketio.emit('status_barcode_scanner', false)
              }
              port = {
                path: '',
                manufacturer: '',
                id: '',
              }
              scanner = null
              !!timerId ? clearTimeout(timerId) : null
              timerId = setTimeout(() => {
                connect()
              }, timeout)
            })

            parser.on('data', (data) => {
              console.log(data)
              data = data.toString().trim()
              if (prescription.test(data)) {
                // это льготный рецепт
                console.log('Прочитан льготный рецепт')
                if (socketio) {
                  socketio.emit('prescription', Prescription.barCode(data))
                }
              } else if (mdlpDataMatrix.test(data)) {
                // это маркировка лекарства
                res = mdlpDataMatrix.exec(data)
                console.log(
                  `Прочитана маркировка лекарственного средства с GTIN:${res[1]}, номер упаковки: ${res[3]}`
                )
                let mdlp = { gtin: res[1], serialPack: res[3] }
                if (!!res[2]) {
                  [
                    dumball,
                    day,
                    month,
                    year,
                    partserial,
                  ] = /^(\d\d)(\d\d)(\d\d\d\d)10(.*)$/.exec(res[2])
                }
                if (!!dumball) {
                  //    log.info(`Day of expire: ${new Date(year,month,day)}`)
                  //    log.info(`serialPart: ${partserial}`)
                  mdlp = {
                    ...mdlp,
                    expire: `${year}-${month}-${day}`,
                    serialPart: partserial,
                  }
                }
                if (!!socketio) {
                  socketio.emit('mdlp', mdlp)
                }
              } else if (cardid.test(data)) {
                console.log(`Прочитан номер медицинскогой карты: ${data}`)
              } else if (ean13.test(data)) {
                console.log(`Прочитан артикул: ${data}`)
              } else {
              }
              if (!!clb && typeof clb === 'function') {
                clb(data)
              }
            })
          } else {
            !!timerId ? clearTimeout(timerId) : null
            timerId = setTimeout(() => {
              connect()
            }, timeout)
          }
        } else {
          console.log(
            'Произошла ошибка в процессе поиска сканера штрих-кода ',
            err
          )
        }
      })
    }
  }

  connect()

  return this
}

export default io => new Reader(io)
