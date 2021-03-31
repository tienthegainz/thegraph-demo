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

export function saveTransaction(transactionID: string, userID: string, timestamp: BigInt | null, stakeId: BigInt | null, type: string, amount: BigInt | null): void {

  let transaction: TransactionEntity = new TransactionEntity(transactionID);
  transaction.createdAt = timestamp;
  transaction.updateAt = timestamp;
  transaction.beneficiary = userID;
  transaction.purchaser = userID;
  transaction.stakeId = stakeId;
  transaction.token = '0x7ee16180c44857b79d1f28b3af757ac8fa0c0089';
  transaction.name = 'Jig Stack';
  transaction.symbol = 'JST ';
  transaction.amount = amount;
  // assign with enum value
  transaction.type = type;

  transaction.save();
  log.info('Transaction {} with ID: {}', [type, transactionID]);
}

export function caculateW(address: Address, amount: BigInt): string {
  log.info('Smart contract address: {}', [address.toHexString()]);
  let contract: Contract = Contract.bind(address);
  let second_time: number = contract.countdownToNextDistribution().toI32();
  let day_time_f64: number = second_time / (60 * 60 * 24);
  let w: string = day_time_f64.toString();
  // 5184000 = 60 * 60 * 60 * 24
  // let day_time: BigDecimal = BigInt.from(day_time_i32).toBigDecimal();
  // let w: BigDecimal = day_time.times(amount.toBigDecimal());
  // log.info('Smart contract address: {} - countDown in day: {} -- {} - w: {}',
  //   [address.toHexString(), day_time_i32.toString(), day_time.toString(), w.toString()]
  // );
  return w;
}

export function randomString(): string {
  return (Math.random().toString(36) + '00000000000000000').slice(2, 7);
}