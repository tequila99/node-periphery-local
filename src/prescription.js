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

const bufferToBinaryString = buf => {
  let binaryString = ''
  for (let offset = 0, length = buf.length; offset < length; offset++) {
    binaryString += buf.readUInt8(offset).toString(2).padStart(8, '0')
  }
  return binaryString
}

const stringFromBinaryString = str => {
  let r = []
  for (let i = 0; i < str.length; i += 8) {
    let c = parseInt(str.substr(i, 8), 2)
    c && r.push(c)
  }
  return String.fromCodePoint(...r)
}

const dateFromNumber = ({ year: y, month: m, day: d }) => {
  return new Date(
    `20${y.toString().padStart(2, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
  );
};

const parseString = data => {
  let binaryString = ''
  if (Buffer.isBuffer(data)) {
    binaryString = bufferToBinaryString(data);
  } else {
    binaryString = ''
  }
  if (!!binaryString) {
    let [ result, start, _str ] = [ {}, 0, '' ]
    for (let i = 0; i < BARCODE_CONTENT.length; i++) {
      _str = binaryString.substr(start, BARCODE_CONTENT[i].length)
      start += BARCODE_CONTENT[i].length
      if (BARCODE_CONTENT[i].type === 'Number') {
        result = { ...result, [BARCODE_CONTENT[i].name]: parseInt(_str, 2) }
      } else if ((BARCODE_CONTENT[i].type = 'String')) {
        result = {
          ...result,
          [BARCODE_CONTENT[i].name]: stringFromBinaryString(_str)
        }
      }
    }
    return { ...result, date_rcp: dateFromNumber(result) }
  }
}

export default (data) => {
  if (typeof data === 'string') {
    return parseString(Buffer.from(data, 'base64'));
  } else {
    return parseString(data);
  }
}
