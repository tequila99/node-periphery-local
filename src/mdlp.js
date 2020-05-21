const parseString = data => {  
  const [, gtin, packid ] =  data.match(/01(\d{14}).*21([!-&%-_/0-9A-Za-z]{13})\u001d/)
  return { gtin, packid }
}

export default data => {
  return parseString(data)
}