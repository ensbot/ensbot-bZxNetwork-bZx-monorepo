const BN = require("bn.js");

function isException(error) {
  let strError = error.toString();
  return (
    strError.includes("invalid opcode") ||
    strError.includes("invalid JUMP") ||
    strError.includes("revert")
  );
}

function ensureException(error) {
  assert(isException(error), error.toString());
}

function getParamFromTxEvent(
  transaction,
  paramName,
  contractFactory,
  eventName
) {
  assert.isObject(transaction);
  let logs = transaction.logs;
  if (eventName != null) {
    logs = logs.filter(l => l.event === eventName);
  }
  assert.equal(logs.length, 1, "too many logs found!");
  let param = logs[0].args[paramName];
  if (contractFactory != null) {
    let contract = contractFactory.at(param);
    assert.isObject(contract, `getting ${paramName} failed for ${param}`);
    return contract;
  } else {
    return param;
  }
}

function mineBlock(web3, reject, resolve) {
  web3.currentProvider.sendAsync(
    {
      method: "evm_mine",
      jsonrpc: "2.0",
      id: new Date().getTime()
    },
    e => (e ? reject(e) : resolve())
  );
}

function increaseTimestamp(web3, increase) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
      {
        method: "evm_increaseTime",
        params: [increase],
        jsonrpc: "2.0",
        id: new Date().getTime()
      },
      e => (e ? reject(e) : mineBlock(web3, reject, resolve))
    );
  });
}

function getBalance(account) {
  return new Promise((resolve, reject) =>
    web3.eth.getBalance(
      account,
      (e, balance) => (e ? reject(e) : resolve(new BN(balance)))
    )
  );
}

async function assertThrowsAsynchronously(test, error) {
  try {
    await test();
  } catch (e) {
    if (!error || e instanceof error) return "everything is fine";
  }
  throw new Error("Missing rejection" + (error ? " with " + error.name : ""));
}

function toWei(number, unit) {
  if (web3.utils.isBN(number)) {
    return web3.utils.toWei(number, unit);
  } else {
    return web3.utils.toBN(web3.utils.toWei(number.toString(), unit));
  }
}

module.exports = {
  zeroAddress: "0x0000000000000000000000000000000000000000",
  isException: isException,
  ensureException: ensureException,
  getParamFromTxEvent: getParamFromTxEvent,
  increaseTimestamp: increaseTimestamp,
  getBalance: getBalance,
  assertThrowsAsynchronously: assertThrowsAsynchronously,
  toWei: toWei
};
