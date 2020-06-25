const bufferToString = (buffer, to = 'hex') => {
  return buffer.toString(to)
}

const getStatusCode = (response) => {
  const str = bufferToString(response)
  return str.substring(str.length - 4)
}

const getDataOnly = (response) => {
  const str = bufferToString(response)
  return str.substring(0, str.length - 4)
}

const isOk = (response) => {
  return getStatusCode(response) === '9000'
}

module.exports = {
  isOkResponse: isOk,
  getDataOnly: getDataOnly,
  getStatusCode: getStatusCode
}
