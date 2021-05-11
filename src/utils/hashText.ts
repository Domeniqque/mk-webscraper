import { sha256 } from 'js-sha256';

export const hashText = (text: string) => {
  const name = text.toLowerCase().replace(/ /ig, '').replace(/_/ig, '-');
  return sha256(name);
}