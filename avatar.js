import {inflateSync} from 'node:zlib';

const signature = Buffer.from('89504e470d0a1a0a', 'hex');
export function avatarPng(bytes) {
  const reject = () => { throw Error('Choose a valid photo and try again.'); };
  if (!bytes.subarray(0, 8).equals(signature)) reject();
  let offset = 8, rowSize, height, ended = false;
  const retained = [signature], data = [];
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) reject();
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const part = bytes.subarray(offset + 8, end - 4);
    if (offset === 8 && type !== 'IHDR') reject();
    if (type === 'IHDR') {
      if (offset !== 8 || length !== 13) reject();
      const width = part.readUInt32BE(0);
      height = part.readUInt32BE(4);
      if (!width || !height || width > 256 || height > 256 || part[8] !== 8 ||
          ![2,6].includes(part[9]) || part[10] || part[11] || part[12]) reject();
      rowSize = width * (part[9] === 6 ? 4 : 3) + 1;
    }
    if (type === 'IDAT') data.push(part);
    if (['IHDR','IDAT','IEND'].includes(type)) retained.push(bytes.subarray(offset,end));
    offset = end;
    if (type === 'IEND') { if (length || offset !== bytes.length) reject(); ended = true; break; }
  }
  if (!ended || !data.length) reject();
  const pixels = inflateSync(Buffer.concat(data), {maxOutputLength:rowSize*height});
  if (pixels.length !== rowSize*height) reject();
  for (let row=0; row<height; row++) if (pixels[row*rowSize]>4) reject();
  return Buffer.concat(retained);
}
