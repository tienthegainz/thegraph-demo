import { ContractConfigEntity, StakeEntity, UserEntity, TransactionEntity } from "../generated/schema";
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

export function saveTransaction(transactionID: string, userID: string, timestamp: BigInt | null, stakeId: BigInt | null, type: string): void {

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

export function caculateW(address: Address, amount: BigInt): BigInt {
  let contract: Contract = Contract.bind(address);
  let second_time: BigInt = contract.countdownToNextDistribution();
  let day_time: BigInt = BigInt.fromI32(second_time.toI32() / (60 * 60 * 60 * 24));
  let w: BigInt = day_time.times(amount);
  return w;
}

export function randomString(): string {
  return (Math.random().toString(36) + '00000000000000000').slice(2, 7);
}