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
import { caculateW, getTimeNow, saveTransaction } from "./helper";

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
  let currentTime = getTimeNow();
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
  let user = UserEntity.load(userID);
  let currentTime = getTimeNow();
  if (user === null) {
    user = new UserEntity(event.params.user.toHex());
    user.user = event.params.user;
    user.stakes = [];
  }
  let id = event.params.requestId.toHex() + "_" + userID;
  // let id = event.transaction.hash.toHexString();
  // Stake
  let stake = StakeEntity.load(id);

  if (stake === null) {
    stake = new StakeEntity(id);
    stake.createdAt = currentTime;
    stake.stakeTime = event.params.timestamp;
  }
  stake.stakeId = event.params.requestId;
  stake.amount = event.params.amount;
  stake.updateAt = currentTime;
  stake.user = userID;
  stake.w = caculateW(event.address, event.params.amount);
  let stakes = user.stakes;
  stakes.push(stake.id);
  user.stakes = stakes;
  user.save();
  stake.save();
  log.info('Stake with ID: {}', [id]);

  // Transaction
  let transactionID = event.transaction.from.toHex();
  saveTransaction(transactionID, userID, currentTime, event.params.requestId, "STAKE");
}

export function handleUserUnstakedAll(event: UserUnstakedAll): void {
  let userID = event.params.user.toHex();
  let user = UserEntity.load(userID);
  let currentTime = getTimeNow();
  if (user !== null) {
    let stakes = user.stakes;
    stakes.forEach(stakeId => {
      let stake = StakeEntity.load(stakeId);
      if (stake !== null) {
        stake.isUnstaked = true;
        stake.updateAt = currentTime;
        stake.save();
      }
      else {
        log.error("The stake with ID: {} not found", [stakeId]);
      }
    });
    user.stakes = [];
    user.save();
    let transactionID = event.transaction.hash.toHexString();
    saveTransaction(transactionID, userID, currentTime, null, "UNSTAKE_ALL");
  }

}

export function handleUserUnstakedWithId(event: UserUnstakedWithId): void {
  let userID = event.params.user.toHex();
  let stakeId = event.params.requestId.toHex() + "_" + userID;
  let user = UserEntity.load(userID);
  let currentTime = getTimeNow();
  let stake = StakeEntity.load(stakeId);
  if (stake !== null) {
    stake.isUnstaked = true;
    stake.updateAt = currentTime;
    stake.save();
    log.info('Stake with ID: {} just got unstaked', [stakeId]);

    let userID = event.params.user.toHex()
    let transactionID = event.transaction.hash.toHexString();
    saveTransaction(transactionID, userID, currentTime, stake.stakeId, "UNSTAKE");
    let stakes = user.stakes;
    let index = stakes.indexOf(stakeId);
    stakes = stakes.splice(index, 1);
    user.stakes = stakes;
    user.save();
  }
  else {
    log.error("The stake with ID: {} not found", [stakeId]);
  }
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
