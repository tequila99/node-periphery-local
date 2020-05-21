import { bufferToBinaryString } from './helpers.js'
import { parseISO, add, formatISO } from 'date-fns'

const CHAR_ENCODE =  ` .-'0123456789АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЬЪЫЭЮЯ                |`
const PROPETY_NAME = ['surname','name','middle_name']

const getNumberEnp = str => parseInt(str.substr(8,64),2)

const getPatient = str => str.substr(72,408)
              .split(/([0-1]{6})/)
              .filter(el => el)
              .reduce((acc, el) => acc + CHAR_ENCODE[parseInt(el,2)],'') 
              .trim()
              .split('|')  
              .reduce((acc,el,i) => { acc[PROPETY_NAME[i]] = el; return acc },{})

const getGender = str => parseInt(str.substr(480,8),2) === 1 ? 'М' : 'Ж'

const getDate = (str,offset) => formatISO(add(parseISO('1900-01-01'), { days: parseInt(str.substr(offset,16), 2)}), { representation: 'date' } )

const getBirthDate = str => getDate(str,488)

const getExpirationDate = str => getDate(str,504)

const getPolis = str => str 
  ? {
      policy_num: getNumberEnp(str),
      birth_date: getBirthDate(str),
      ...getPatient(str),
      gender: getGender(str),
      expiration_date: getExpirationDate(str)
    }
  : null

const parseBuffer = data => getPolis(bufferToBinaryString(data))

export default data => parseBuffer(data)