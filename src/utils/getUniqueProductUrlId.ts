import { hashText } from './hashText'

export const getUniqueProductUrlId = (url: string) => hashText(url.split('/').pop() as string)