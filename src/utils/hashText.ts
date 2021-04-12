import crypto from 'crypto';

export const hashText = (text: string) => {
  const name = text.toLowerCase().replace(/ /ig, '');
  return crypto.createHash('md5').update(name).digest('hex');
}