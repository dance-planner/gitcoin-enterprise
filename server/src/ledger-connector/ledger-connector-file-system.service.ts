import { Injectable } from '@nestjs/common'
import { ILedgerConnector, ILedgerEntry } from './ledger-connector.interface'
import { LoggerService } from '../logger/logger.service'
import { ELogLevel } from '../logger/logger-interface'
import { PersistencyService } from '../persistency/persistency.service'

@Injectable()
export class LedgerConnector implements ILedgerConnector {

    public constructor(private readonly lg: LoggerService, private readonly persistencyService: PersistencyService) { }

    public getLedgerEntries(): ILedgerEntry[] {

        // const entriesWithAddress = this.getLedgerEntriesWithAddress(login)
        // if (entriesWithAddress.length === 0) { // add start amount of 200 EIC to Ledger
        //     const miningEntry: ILedgerEntry = this.getMiningEntryForUser(login)
        //     const ledgerEntries: ILedgerEntry[] = this.persistencyService.getLedgerEntries()
        //     ledgerEntries.push(miningEntry)
        //     this.lg.log(ELogLevel.Info, `saving enhanced ledger entries after mining for ${login}`)
        //     this.persistencyService.saveLedgerEntries(ledgerEntries)
        // }

        return this.persistencyService.getLedgerEntries()
    }

    public saveLedgerEntries(ledgerEntries: ILedgerEntry[]): void {
        this.persistencyService.saveLedgerEntries(ledgerEntries)
    }

    public addMiningEntryForUser(login: string): ILedgerEntry {
        const entry: ILedgerEntry = {
            id: `tr-${Date.now().toString()}`,
            date: new Date().toISOString(),
            amount: 200,
            sender: 'The Miner',
            receiver: login,
        }
        const content = this.persistencyService.getLedgerEntries()
        content.push(entry)
        this.persistencyService.saveLedgerEntries(content)

        return entry
    }

    public getLedgerEntriesWithAddress(address: string): ILedgerEntry[] {

        return this.persistencyService.getLedgerEntries().filter((ledgerEntry: ILedgerEntry) => {
            if (ledgerEntry.sender === address || ledgerEntry.receiver === address) {
                return true
            }

            return false

        })
    }
}
