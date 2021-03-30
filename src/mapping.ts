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
import { ContractConfigEntity, StakeEntity, UserEntity } from "../generated/schema";
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
  let id = transactionID;
  // let id = event.transaction.hash.toHexString();
  // Stake
  let stake = StakeEntity.load(id);

  if (stake === null) {
    stake = new StakeEntity(id);
  }

  let timestamp = event.params.timestamp;
  let stakeID = event.params.requestId;
  let amount = event.params.amount;

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
  stakes.push(stake.id);
  user.stakes = stakes;
  user.save();
  stake.save();
  log.info('Stake with ID: {}', [id]);

  // Transaction
  saveTransaction(transactionID, userID, timestamp, stakeID, "STAKE", amount);
}

export function handleUserUnstakedAll(event: UserUnstakedAll): void {
  let userID = event.params.user.toHex();
  let user = UserEntity.load(userID);
  let currentTime = event.block.timestamp;
  if (user !== null) {
    let stakes = user.stakes;
    for (let index = 0; index < stakes.length; index++) {
      let stakeId = stakes.pop();
      let stake = StakeEntity.load(stakeId);
      if (stake !== null) {
        stake.isUnstaked = true;
        stake.updateAt = currentTime;
        stake.save();
      }
      else {
        log.error("The stake with ID: {} not found", [stakeId]);
      }
    }
    user.stakes = [];
    user.save();
    let transactionID = event.transaction.hash.toHexString();
    saveTransaction(transactionID, userID, currentTime, null, "UNSTAKE_ALL", null);
  };

}

export function handleUserUnstakedWithId(event: UserUnstakedWithId): void {
  let userID = event.params.user.toHex();

  // find stakeId
  let user = UserEntity.load(userID);
  let stakes = user.stakes;
  let requestId = event.params.requestId;

  for (let index = 0; index < stakes.length; index++) {
    let stakeId = stakes.pop();
    let stake = StakeEntity.load(stakeId);
    if (stake !== null && stake.stakeId === requestId) {
      stake.isUnstaked = true;
      stake.updateAt = event.block.timestamp;
      stake.save();
      log.info('Stake with ID: {} just got unstaked', [stakeId]);
      let userID = event.params.user.toHex();
      saveTransaction(event.transaction.hash.toHexString(), userID, event.block.timestamp, stake.stakeId, "UNSTAKE", stake.amount);
      let stakes_ = user.stakes;
      stakes_ = stakes_.splice(index, 1);
      user.stakes = stakes_;
      user.save();
      break;
    }
  };
}

export function handleUserWithdrawedReward(event: UserWithdrawedReward): void {
  // let id = event.transaction.hash.toHexString();

  // let transaction = TransactionEntity.load(id);
  // if (transaction !== null) {
  //   transaction = new TransactionEntity(id);
  // }
  // transaction.ethReward = event.params.ethReward;
  // transaction.usdtReward = event.params.usdtReward;
  // let userID = event.params.user.toHex();
  // let user = UserEntity.load(userID);
  // if (user === null) {
  //   user = new UserEntity(event.params.user.toHex());
  //   user.save();
  // }
  // transaction.beneficiary = userID;
  // transaction.purchaser = userID;
  // transaction.token = '0x7ee16180c44857b79d1f28b3af757ac8fa0c0089';
  // transaction.name = 'Jig Stack';
  // transaction.symbol = 'JST';
  // // assign with enum value
  // transaction.type = "CLAIM_REWARD";

  // transaction.save();
  // log.info('Transaction saved with ID: {}', [id]);
}
