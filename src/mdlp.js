
const getValues = data => ({ gtin: data[1], packid: data[2] })

const parseString = data => getValues(data.match(/01(\d{14}).*21([!-&%-_/0-9A-Za-z]{13})\u001d/))

export default data => parseString(data)
