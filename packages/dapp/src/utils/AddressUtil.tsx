export const formatAddress = (account) => {
  return account.substring(0, 7) + '...' + account.substring(account.length - 4, account.length);
};
