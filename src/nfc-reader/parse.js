/**
 * Data from card ->  5f26...5f21...5f22...5f23...5f25...5f24..5f31..5f32...5f29...5f9000
 Заголовки блоков данных (после заголовка блока - его длина - 1 байт - 2 символа):
 Между блоками 5F 26 и 5F 21 (Номер полиса)
 Между блоками 5F 21 и 5F 22 (Фамилия)
 Между блоками 5F 22 и 5F 23 (Имя)
 Между блоками 5F 23 и 5F 25 (Отчество)
 Между блоками 5F 24 и ... (Дата рождения в ОТКРЫТОМ ВИДЕ)
 ...остальные данные 7f3033 - ?
 Между блоками 5F 31 и 5F 32 (Гражданство)
 Между блоками 5F 32 и 5F 29 (Страна)
 Между блоками 5F 29 и 90 00 (Место рождения).
 Между блоками 5F 25 и 5F 24 (ПОЛ)
 */

/* eslint-disable camelcase */
const DATA_KEYS = {
  policy_num: '5f26',
  surname: '5f21',
  name: '5f22',
  middle_name: '5f23',
  sex: '5f25',
  birth_date: '5f24',
  country_code: '5f31',
  country: '5f32',
  // 'snils': '5f27',
  // 'dataend': '5f28',
  birth_place: '5f29'
  // 'data_make_oms': '5f2a',
  // 'fimg': '5f41',
  // 'img': '5f42',
  // 'ogrn': '5f51',
  // 'okato': '5f52',
  // 'data_start_insurance': '5f53',
  // 'data_end_insurance': '5f54',
  // 'ecp':'5f61'
}

const convert = (str, from = 'hex', to = 'utf8') => Buffer.from(str, from).toString(to)

/**
 *
 * @param {string} str - Ответ карты в формате строки '5f2610...'
 * @param {string} key - Ключ по которому в строке искать блок с данными
 * @param {boolean} normalize - Конвертировать блок данных из hex-строки? Так например дата рождения не закодирована в hex, и 12-03-1982 выглядит как 12031982 = 0x12 0x03 0x19 0x82
 * @returns {string}
 */
const responseParse = (str, key, normalize = true) => {
  const key_index = str.indexOf(key) // позиция ключа в строке (hex - 2 байта - 4 символа, например 5f26 )
  const size_index = key_index + key.length // позиция байта в котором указана длинна следующих за ним данных (hex - 1 байт - 2 символа, например 10)
  const data_index = size_index + 2 // позиция начала данных
  const data_length_hex = str.substring(size_index, size_index + 2) // длинна блока данных в hex (str)
  const data_length = parseInt(data_length_hex, 16) * 2 // длинна блока данных в десятиричном формате
  let data = str.substring(data_index, data_index + data_length) // строка с данными в hex
  !!normalize && (data = convert(data))
  return data
}

/**
 *
 * @param {string} dataOnly
 */
const getPerson = (dataOnly) => {
  // console.log(' --->>>>> ', Buffer.from('33363536373130383337303030323238', 'hex').toString('utf8'))
  // policy_num
  const toISODate = (str) => {
    return new Date(`${str.slice(4)}-${str.slice(2, 4)}-${str.slice(0, 2)}`).toISOString().slice(0, 10)
  }
  return {
    // policy_num: parseInt(responseParse(dataOnly, DATA_KEYS.policy_num), 10),
    policy_num: responseParse(dataOnly, DATA_KEYS.policy_num),
    surname: responseParse(dataOnly, DATA_KEYS.surname),
    name: responseParse(dataOnly, DATA_KEYS.name),
    middle_name: responseParse(dataOnly, DATA_KEYS.middle_name),
    sex: (responseParse(dataOnly, DATA_KEYS.sex, false) === '01') ? 'М' : 'Ж',
    birth_date: toISODate(responseParse(dataOnly, DATA_KEYS.birth_date, false)),
    birth_place: responseParse(dataOnly, DATA_KEYS.birth_place),
    country_code: responseParse(dataOnly, DATA_KEYS.country_code),
    country: responseParse(dataOnly, DATA_KEYS.country)
  }
}

module.exports = {
  getPerson: getPerson
}
