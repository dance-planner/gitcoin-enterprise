import { Component, OnInit, Input } from '@angular/core'
import { ILedgerEntry } from './ledger.interface'
import { BackendService } from '../backend.service'
import * as moment from 'moment'
import { IAuthenticationData } from '../interfaces'
import { Helper } from '../helper'

@Component({
  selector: 'app-ledger',
  templateUrl: './ledger.component.html',
  styleUrls: ['./ledger.component.css', '../app.component.css'],
})

export class LedgerComponent implements OnInit {

  @Input() public transactionId = ''
  @Input() public authenticationData: IAuthenticationData

  public ledgerEntries: ILedgerEntry[] = []
  public bounties: ILedgerEntry[] = []
  public fundings: ILedgerEntry[] = []
  public entryIdOfInterest: ILedgerEntry

  public constructor(private readonly backendService: BackendService) { }

  public ngOnInit(): void {
    this.backendService.getLedgerEntries(this.authenticationData.p2pAccessToken)
      .subscribe((result: ILedgerEntry[]) => {
        this.ledgerEntries = result
        this.fundings = this.ledgerEntries.filter((entry: ILedgerEntry) => entry.sender === this.authenticationData.login)
        this.bounties = this.ledgerEntries.filter((entry: ILedgerEntry) => entry.receiver === this.authenticationData.login)
        if (this.transactionId !== '') {
          setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight)
          },         700)
        }
      })
  }

  // public triggerBackup() {
  //   this.backendService.triggerBackup(this.authenticationData.p2pAccessToken)
  //     .subscribe()
  // }

  public downloadAsCSV(): void {
    const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
    const header = Object.keys(this.ledgerEntries[0])
    let line = `${String(header)}\n`
    let index = 0
    this.ledgerEntries.map((row) => header.map((fieldName) => {
      index += 1
      if (index < header.length) {
        line = `${line}${JSON.stringify(row[fieldName], replacer)},`
      } else {
        line = `${line}${JSON.stringify(row[fieldName], replacer)}\n`
        index = 0
      }
    }))
    // tslint:disable-next-line: prefer-template
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(line)
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', `${moment().format('YYYY-MM-DD')} ${BackendService.backendURL.split('https://')[1]}` + '.csv')
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  public downloadAsJSON(): void {
    // tslint:disable-next-line: prefer-template
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.ledgerEntries))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', `${moment().format('YYYY-MM-DD')} ${BackendService.backendURL.split('https://')[1]}` + '.json')
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  public getSum(): number {
    let sum = 0
    for (const e of this.ledgerEntries) {
      sum = sum + e.amount
    }

    return sum
  }

  public onEntryClicked(ledgerEntry: ILedgerEntry) {
    this.entryIdOfInterest = ledgerEntry
    window.scrollTo(0, 0)
  }

  public backToOverview() {
    delete this.entryIdOfInterest
  }

  public getSourceType(): string {
    const myArray = this.entryIdOfInterest.receiver.split('/')

    return (myArray.length > 5) ? 'User' : (myArray.length > 0) ? 'Task' : ''
  }

  public getTargetType(): string {
    const myArray = this.entryIdOfInterest.receiver.split('/')

    return (myArray.length > 5) ? 'Task' : 'User'
  }

  public getSource(): string {
    // tbd
    return this.entryIdOfInterest.sender
  }

  public getTarget(): string {
    if (this.getTargetType() === 'User') {
      return `${BackendService.gitHubURL}/${this.entryIdOfInterest.receiver}`
    }

    return Helper.getId(this.entryIdOfInterest.receiver)
  }

  public getSourceLink(): string {
    // tbd
    return (this.getSourceType() === 'Task') ? this.entryIdOfInterest.sender : `${BackendService.gitHubURL}/${this.entryIdOfInterest.sender}`
  }

  public getTargetLink(): string {
    // tbd
    return (this.getTargetType() === 'Task') ? this.entryIdOfInterest.receiver : `${BackendService.gitHubURL}/${this.entryIdOfInterest.receiver}`
  }

}
