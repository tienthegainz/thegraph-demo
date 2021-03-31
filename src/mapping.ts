import { log, store } from "@graphprotocol/graph-ts";
// import chalk from "chalk";
import {
  Contract,
  AdminDistributeReward,
  OwnershipTransferred,
  Pause,
  StakBankConfigurationChanged,
  Unpause,
  UserStaked,
  UserUnstakedAll,
  UserUnstakedWithId,
  UserWithdrawedReward
} from "../generated/Contract/Contract";
import { ContractConfigEntity, StakeEntity, UserEntity, Log, TransactionEntity } from "../generated/schema";
import { caculateW, randomString, saveTransaction } from "./helper";

export function handleAdminDistributeReward(
  event: AdminDistributeReward
): void {

}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {

}

export function handlePause(event: Pause): void {

}

export function handleStakBankConfigurationChanged(
  event: StakBankConfigurationChanged
): void {
  let id = event.transaction.hash.toHexString();
  let currentTime = event.block.timestamp;
  let config = ContractConfigEntity.load(id);
  if (config === null) {
    config = new ContractConfigEntity(id);
    config.createdAt = currentTime;
  }
  config.changer = event.params.changer;
  let contract = Contract.bind(event.address);
  config.decimal = contract.decimal();
  config.numEthToReward = contract.numEthToReward();
  config.numUsdtToReward = contract.numUsdtToReward();
  config.paused = contract.paused();
  config.updateAt = currentTime;

  config.save();
}

export function handleUnpause(event: Unpause): void {

}


export function handleUserStaked(event: UserStaked): void {
  let userID = event.params.user.toHex();
  let transactionID = event.transaction.hash.toHex();

  let user = UserEntity.load(userID);
  let currentTime = event.block.timestamp;
  if (user === null) {
    user = new UserEntity(event.params.user.toHex());
    user.user = event.params.user;
    user.stakes = [];
  }

  let timestamp = event.params.timestamp;
  let stakeID = event.params.requestId;
  let amount = event.params.amount;

  let id = stakeID.toString() + "_" + transactionID;
  // Stake
  let stake = new StakeEntity(id);

  stake.createdAt = currentTime;
  stake.isUnstaked = false;
  stake.stakeTime = timestamp;
  stake.stakeId = stakeID;
  stake.amount = amount;
  stake.txHash = transactionID;
  stake.updateAt = currentTime;
  stake.user = userID;
  stake.w = caculateW(event.address, amount);

  let stakes = user.stakes;
  stakes.push(id);
  user.stakes = stakes;
  user.save();

  stake.save();
  log.info('Stake with ID: {}', [id]);

  // Transaction
  saveTransaction(transactionID, userID, timestamp, stakeID, "STAKE", amount);
}

export function handleUserUnstakedAll(event: UserUnstakedAll): void {
  //find user
  let userID = event.params.user.toHex();
  let user = UserEntity.load(userID);

  const currentTime = event.block.timestamp;

  if (user != null) {
    let stakesToPop = user.stakes;
    const length = stakesToPop.length;
    for (let index = 0; index < length; index++) {
      let stakeId = stakesToPop.pop();
      let stake = StakeEntity.load(stakeId);

      if (stake != null) {
        stake.isUnstaked = true;
        stake.updateAt = currentTime;
        stake.save();
      }
      else {
        logSaved('Caydang', 'UnstakeAll gonewrong', 'UnstakeAll');
      }
    }
    //Update user's stakes
    user.stakes = [];
    user.save();

    let transactionID = event.transaction.hash.toHexString();
    saveTransaction(transactionID, userID, currentTime, null, "UNSTAKE_ALL", null);
  };

}

export function handleUserUnstakedWithId(event: UserUnstakedWithId): void {
  const userID = event.params.user.toHex();
  const requestId = event.params.requestId;
  const txHash = event.transaction.hash.toHexString();
  const currentTime = event.block.timestamp;

  // find stakeId
  let user = UserEntity.load(userID);
  let stakesToPop = user.stakes; //array of stake's trxHash

  //debug
  logSaved(userID + "_" + txHash + "_REQ", "Id_to_remove: " + requestId.toString(), "REQUEST");

  let lastIndex = stakesToPop.length - 1;

  for (lastIndex; lastIndex >= 0; lastIndex--) {
    //The stakeId get poped is now a TrxHash
    let stakeId = stakesToPop.pop();
    let stake = StakeEntity.load(stakeId);

    //This stakeId being compared is the requestId
    //The acctual id
    if (stake == null) {
      logSaved(userID + "_" + txHash + "_BEING", 'Null in the processing', "BEING");
    }

    if (stake !== null && stake.stakeId == requestId) {
      //debug
      logSaved(userID + "_" + txHash + "_BEING", 'being_unstaked_id: ' + stake.stakeId.toString(), "BEING");
      //Update the being-unstaked stake
      stake.isUnstaked = true;
      stake.updateAt = currentTime;
      stake.save();

      //Create new transaction
      saveTransaction(txHash, userID, currentTime, stake.stakeId, "UNSTAKE", stake.amount);

      //Update stakes of users
      let stakes_ = user.stakes;
      stakes_.splice(lastIndex, 1);
      user.stakes = stakes_;
      user.save();

      break;
    }
  }
  //debug
  logSaved(userID + "_" + txHash + "_AFTER", user.stakes.toString(), "AFTER");
}

function logSaved(id: string, message: string, func: string): void {
  const loged = new Log(id);
  loged.message = message;
  loged.func = func;
  loged.save();
}


export function handleUserWithdrawedReward(event: UserWithdrawedReward): void {
  let id = event.transaction.hash.toHexString();

  let userID = event.params.user.toHex();
  let user = UserEntity.load(userID);
  if (user === null) {
    user = new UserEntity(event.params.user.toHex());
    user.save();
  }

  let transaction = new TransactionEntity(id);

  transaction.ethReward = event.params.ethReward;
  transaction.usdtReward = event.params.usdtReward;
  transaction.beneficiary = userID;
  transaction.purchaser = userID;
  transaction.token = '0x7ee16180c44857b79d1f28b3af757ac8fa0c0089';
  transaction.name = 'Jig Stack';
  transaction.symbol = 'JST';
  // assign with enum value
  transaction.type = "CLAIM_REWARD";

  transaction.save();
  log.info('Transaction saved with ID: {}', [id]);
}
