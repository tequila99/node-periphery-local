export const bufferToBinaryString = buf => {
  let binaryString = ''
  for (let offset = 0, length = buf.length; offset < length; offset++) {
    binaryString += buf.readUInt8(offset).toString(2).padStart(8, '0')
  }
  return binaryString
}