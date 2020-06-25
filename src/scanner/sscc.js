const getValues = data => ({ sscc: data[1] })

const parseString = data => getValues(data.match(/^0*(\d{18})$/))

export default data => parseString(data)