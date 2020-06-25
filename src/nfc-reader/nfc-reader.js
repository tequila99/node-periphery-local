const { NFC } = require('nfc-pcsc')
const nfc = new NFC()
const getPerson = require('./parse').getPerson
const { isOkResponse, getDataOnly, getStatusCode } = require('./response-apdu')

/* eslint-disable camelcase */
const c1_byte = [0x66, 0x6f, 0x6d, 0x73, 0x5f, 0x72, 0x6f, 0x6f, 0x74] // 666f6d735f726f6f74 // foms_root
const c2_byte = [0x46, 0x4f, 0x4d, 0x53, 0x5f, 0x49, 0x44] // 464f4d535f4944 // FOMS_ID
const c3_byte = [0x02, 0x01] // выбор файла 0201

const command1 = Buffer.from([0x00, 0xA4, 0x04, 0x0C, c1_byte.length, ...c1_byte]) // c1 - '00A4040C09666f6d735f726f6f7400' - Выбор foms_root
const command2 = Buffer.from([0x00, 0xA4, 0x04, 0x0C, c2_byte.length, ...c2_byte]) // c2 - '00A4040C07464f4d535f494400' - Выбор FOMS_ID
const command3 = Buffer.from([0x00, 0xA4, 0x02, 0x0C, c3_byte.length, ...c3_byte]) // c3 - '00A4020C02020100'  - Выбор файла 0201
const command4 = Buffer.from([0x00, 0xB0, 0x00, 0x03, 0xA7]) // c4 - '00b00003a7' - Чтение данных

class CardReaderNFC {
  constructor (io) {
    if (CardReaderNFC.exists) {
      return CardReaderNFC.instance
    }
    CardReaderNFC.instance = this
    CardReaderNFC.exists = true
    this.socketio = io
    this.connected = false
    this.cardReader = null
    this.nfcLib = nfc
    return this
  }

  async connect () {
    try {
      this.nfcLib.on('reader', reader => {
        reader.autoProcessing = false
        this.cardReader = reader
        this.connected = true
        console.log(`Найден и подключен картридер ${reader.reader.name}`)
        this.socketio && this.socketio.emit('status_card_reader', true)

        this.cardReader.on('error', err => {
          console.error(`Ошибка картридера ${this.cardReader.reader.name}`, err)
        })

        this.cardReader.on('end', () => {
          // console.log(`Картридер ${this.cardReader.reader.name} отключен`)
          console.log('Картридер отключен')
          this.connected = false
          this.socketio && this.socketio.emit('status_card_reader', false)
          this.cardReader = null
        })

        this.cardReader.on('card', async card => {
          console.log(`${this.cardReader.reader.name} -> card inserted`, card.atr)

          try {
            const r1 = await this.cardReader.transmit(command1, 40)
            console.log(`Response '${getStatusCode(r1)}' received from card '${card.atr}' in response to '${command1.toString('hex')}'`)

            if (!!isOkResponse(r1) === true) { // utf8 is default encoding
              const r2 = await this.cardReader.transmit(command2, 40)
              console.log(`Response '${getStatusCode(r2)}' received from card '${card.atr}' in response to '${command2.toString('hex')}'`)

              if (isOkResponse(r2) === true) {
                const r3 = await this.cardReader.transmit(command3, 40)
                console.log(`Response '${getStatusCode(r3)}' received from card '${card.atr}' in response to '${command3.toString('hex')}'`)

                if (isOkResponse(r3) === true) {
                  const r4 = await this.cardReader.transmit(command4, 255)

                  if (isOkResponse(r4) === true) {
                    console.log('>>> Data received: ', r4)
                    console.log('>>> Try convert data..')
                    const person = getPerson(getDataOnly(r4))
                    console.log(person)
                    this.socketio && this.socketio.emit('OMS', JSON.stringify(person))
                  }
                }
              }
            } else {
              // throw new Error('>>>> Пожалуйста, вставьте в картридер карту ОМС <<<<<')
              console.error('>>>> Пожалуйста, вставьте в картридер карту ОМС <<<<<')
            }
          } catch (err) {
            console.error('Произошла ошибка при попытке чтения данных с карты: ', err)
          }
        })

        this.cardReader.on('card.off', async card => {
          console.log(`${this.cardReader.reader.name} -> card removed`, card.atr)
        })
      })
    } catch (error) {
      console.error('Произошла ошибка в процессе работы с картридером ', error)
    }
  }
}

export default io => new CardReaderNFC(io)
