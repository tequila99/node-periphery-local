import { bufferToBinaryString } from './helpers.js'
import { formatISO } from 'date-fns'

const BARCODE_CONTENT = [
  {
    name: 'hz',
    type: 'Number',
    label: 'ХЗ',
    length: 6,
  },
  {
    name: 'ogrn',
    type: 'Number',
    label: 'ОГРН ЛПУ',
    length: 50,
  },
  {
    name: 'doctor_id',
    type: 'String',
    label: 'Код врача',
    length: 56,
  },
  {
    name: 'ogrn',
    type: 'Number',
    label: 'ОГРН ЛПУ',
    length: 50,
  },
  {
    name: 'lpu_id',
    type: 'String',
    label: 'Код ЛПУ',
    length: 56,
  },
  {
    name: 'prescription_ser',
    type: 'String',
    label: 'Серия рецепта',
    length: 112,
  },
  {
    name: 'prescription_number',
    type: 'Number',
    label: 'Номер рецепта',
    length: 64,
  },
  {
    name: 'mkb10_id',
    type: 'String',
    label: 'Код заболевания по МКБ10',
    length: 56,
  },
  {
    name: 'fin_source',
    type: 'Number',
    label: 'Источник финансирования',
    length: 2,
  },
  {
    name: 'procent',
    type: 'Number',
    label: 'Процент льготы рецепта',
    length: 1,
  },
  {
    name: 'mnn_flag',
    type: 'Number',
    label: 'Признак МНН(0)/ТоргНаим(1)',
    length: 1,
  },
  {
    name: 'mnn_id',
    type: 'Number',
    label: 'Код МНН/ТоргНаименования (в кодировке 2006 г.)',
    length: 44,
  },
  {
    name: 'person_id',
    type: 'Number',
    label: 'СНИЛС',
    length: 37,
  },
  {
    name: 'dosage',
    type: 'String',
    label: 'Дозировка',
    length: 160,
  },
  {
    name: 'amount',
    type: 'Number',
    label: 'Количество единиц',
    length: 24,
  },
  {
    name: 'person_ctg',
    type: 'Number',
    label: 'Код категории гражданина',
    length: 10,
  },
  {
    name: 'expired',
    type: 'Number',
    label: 'Срок действия',
    length: 1,
  },
  {
    name: 'year',
    type: 'Number',
    label: 'Год выписки рецепта',
    length: 7,
  },
  {
    name: 'month',
    type: 'Number',
    label: 'Месяц выписки рецепта',
    length: 4,
  },
  {
    name: 'day',
    type: 'Number',
    label: 'День выписки рецепта',
    length: 5,
  }
]

const stringFromBinaryString = str => String.fromCodePoint(...str.split(/([0-1]{8})/).filter(el => el).map(el => parseInt(el,2)).filter(el => el)).trim()

const dateFromNumber = ({ year, month, day, ...params }) => (
    {
      ...params, day, month, year, 
      date_rcp: formatISO(new Date(2000+year, --month, day)) 
    }
  )

const parseBinaryString = data => BARCODE_CONTENT.reduce((acc,el) => {
      if (el.type === 'Number') {
        acc[0] = { ...acc[0], [el.name]: parseInt(data.substr(acc[1], el.length), 2) }
      } else if (el.type === 'String') {
        acc[0] = { ...acc[0], [el.name]: stringFromBinaryString(data.substr(acc[1], el.length)) }
      }
      acc[1] += el.length
      return acc
    },[{}, 0])[0]

const parseString = data => Buffer.isBuffer(data) ? dateFromNumber(parseBinaryString(bufferToBinaryString(data))) : null

export default data => {
  if (typeof data === 'string') {
    return parseString(Buffer.from(data, 'base64'));
  } else {
    return parseString(data);
  }
}
