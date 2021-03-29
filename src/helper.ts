import { ContractConfigEntity, StakeEntity, UnStakeEntity, UserEntity, TransactionEntity } from "../generated/schema";
import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  log,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";
import { Contract } from "../generated/Contract/Contract";

export function saveTransaction(transactionID: string, userID: string, timestamp: string | null, stakeId: BigInt | null, type: string): void {

  let transaction: TransactionEntity = new TransactionEntity(transactionID);
  transaction.createdAt = timestamp;
  transaction.updateAt = timestamp;
  transaction.beneficiary = userID;
  transaction.purchaser = userID;
  transaction.stakeId = stakeId;
  transaction.token = '0x7ee16180c44857b79d1f28b3af757ac8fa0c0089';
  transaction.name = 'Jig Stack';
  transaction.symbol = 'JST ';
  // assign with enum value
  transaction.type = type;

  transaction.save();
  log.info('Transaction {} with ID: {}', [type, transactionID]);
}

export function saveUnstake(stake: StakeEntity): void {
  let unstake: UnStakeEntity = new UnStakeEntity(stake.id);
  unstake.unstakedAt = getTimeNow();
  unstake.stakeTime = stake.stakeTime;
  unstake.stakeId = stake.stakeId;
  unstake.amount = stake.amount;
  unstake.user = stake.user;
  unstake.save();
}

export function getTimeNow(): string {
  // return (new Date()).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ");
  return null;
}

export function caculateW(address: Address, amount: BigInt): BigInt {
  let contract: Contract = Contract.bind(address);
  let second_time: BigInt = contract.countdownToNextDistribution();
  let day_time: BigInt = BigInt.fromI32(second_time.toI32() / (60 * 60 * 60 * 24));
  let w: BigInt = day_time.times(amount);
  return w;
}