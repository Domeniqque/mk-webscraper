export const getFileName = (section: string) => {
  const date = new Date();

  const dmy = date.toLocaleDateString("pt-BR").replace(/\//g, '-');

  // 034982347283:04-12-2021-products.json
  return `${date.getTime()}:${dmy}-${section}.json`;
}
