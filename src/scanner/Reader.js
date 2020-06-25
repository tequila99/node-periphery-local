import SerialPort from 'serialport'
// import ReadPort from '@serialport/parser-regex'
import InterByteTimeout  from '@serialport/parser-inter-byte-timeout'
import parsePrescription from './prescription'
import parseMdlp from './mdlp'
import parseOMC from './omc'
import parseSscc from './sscc'

const DEVICES = [
  {
    vendor: '0C2E',
    productid: ['0CAA', '0CD4'],
  },
  {
    vendor: '05E0',
    productid: ['1701'],
  },
  {
    name: 'NLS-FM430', // http://www.newlandca.com/download/Documents/UserGuide/UM10054_NLS-FM430_User_Guide.pdf
    vendor: '1EAB',
    productid: ['1D06'],
  },
]

const TIMEOUT = 10000

// const Parser = new ReadPort({
//   regex: /[\n\r]+/,
// })
const Parser = new InterByteTimeout({interval: 30})

const PRESCRIPTION_REGEXP = new RegExp(/^p([a-zA-Z0-9\/\+]*==)$/)
const MDLP_REGEXP = new RegExp(/01\d{14}.*21[!-&%-_/0-9A-Za-z]{13}\u001d/)
const EAN13_REGEXP = new RegExp(/^[0-9]{13}$/)
const SSCC_REGEXP = new RegExp(/^[0-9]{18,20}$/)

const pnpIDParse = pnpId => DEVICES.some(i => pnpId.includes(i.vendor) && pnpId.includes(i.productid))

const testOfPort = item => (item.vendorId && item.productId)
                            ? DEVICES.some(i => i.vendor === item.vendorId.toUpperCase() && i.productid.includes(item.productId.toUpperCase()))
                            : item.pnpId && pnpIDParse(item.pnpId)

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
    try {
      if (!this.connected) {
        const avaliblePorts = await SerialPort.list()
        // console.log(avaliblePorts)
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
          // this.scanner.pipe(new InterByteTimeout({interval: 30}))
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
            console.log(data)
            if (data.readUInt8(0) === 2) {
              console.log('Прочитан полис ОМС')
              console.log(parseOMC(data))
              this.socketio && this.socketio.emit('OMS', JSON.stringify(parseOMC(data)))
            } else if (PRESCRIPTION_REGEXP.test(data.toString().trim())) {
              console.log('Прочитан льготный рецепт')
              console.log(parsePrescription(data.toString().trim()))
              this.socketio && this.socketio.emit('llo_prescrition', parsePrescription(data.toString().trim()))
            } else if (MDLP_REGEXP.test(data.toString().trim())) {
              console.log('Прочитана маркировка лекарственного средства')
              console.log(parseMdlp(data))
              this.socketio && this.socketio.emit('mdlp_pack', parseMdlp(data))
            } else if (EAN13_REGEXP.test(data.toString().trim())) {
              console.log('Прочитан потребительский штрих код товара')
              this.socketio && this.socketio.emit('ean13', { ean13: data.toString().trim() })
            } else if (SSCC_REGEXP.test(data.toString().trim())) {
              console.log('Прочитан код групповой упаковки')
              this.socketio && this.socketio.emit('sscc', parseSscc(data.toString().trim()))
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

export default io => new Reader(io)
