import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { BackendService } from '../backend.service'
import { IAuthenticationData, IFunding, IBountiesAndFundings, IBounty, IBountyReceiver } from '../interfaces'
import { ILedgerEntry } from '../ledger/ledger.interface'
import { Helper } from '../helper'
import { AppComponent } from '../app.component'

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css', '../app.component.css'],
})
export class ProfileComponent implements OnInit {

  @Input() public authenticationData: IAuthenticationData
  @Output() public viewTransactionInLedgerTriggered = new EventEmitter<ILedgerEntry>()
  // public justKidding = true
  public viewBountiesAndFundings = false
  public fundingIdOfInterest: IFunding
  public balance = 0
  public usersFundings: IFunding[] = []
  public usersBounties: IBounty[] = []
  public ledgerEntries: ILedgerEntry[] = []
  public entryIdOfInterest: ILedgerEntry
  public newLedgerEntries: ILedgerEntry[]
  public transferCompleted = false

  public constructor(private readonly backendService: BackendService) { }

  public ngOnInit(): void {
    // setTimeout(() => this.justKidding = false, 3000)
    this.backendService.getLedgerEntries(this.authenticationData.p2pAccessToken)
      .subscribe((result: ILedgerEntry[]) => {
        this.ledgerEntries = result
        this.balance = Helper.getBalanceFromLedgerEntries(this.authenticationData.login, this.ledgerEntries)
        const bountiesAndFundings: IBountiesAndFundings = Helper.getFundingsAndBountiesFromLedgerEntries(this.authenticationData.login, this.ledgerEntries)
        this.usersFundings = bountiesAndFundings.fundings
        this.usersBounties = bountiesAndFundings.bounties
      })
  }

  public getLink() {
    return `${BackendService.gitHubURL}/${this.authenticationData.login}`
  }

  public getId(link: string): string {
    return Helper.getId(link)
  }

  public onTransferTriggered(receivers: IBountyReceiver[]): any {
    this.backendService.postTransfer(receivers, this.authenticationData.p2pAccessToken)
      .subscribe((newLedgerEntries: ILedgerEntry[]) => {
        this.newLedgerEntries = newLedgerEntries
        this.transferCompleted = true
      })
  }

  public login() {
    window.location.assign(`${BackendService.backendURL}/login`)
  }

  public clickViewTransactionInLedger(newLedgerEntry: ILedgerEntry) {
    this.viewTransactionInLedgerTriggered.emit(newLedgerEntry)
  }

  public loginViaGitHub() {
    const authenticationURL = `${BackendService.backendURL}/login?action=profile`
    location.assign(authenticationURL)
  }

  public clickBountiesAndFundings() {
    this.viewBountiesAndFundings = true
    setTimeout(() => {
      window.scrollTo(0, ((document.body.scrollHeight / 2) - 110))
    },         100)
  }

  public getSum(): number {
    let sum = 0
    for (const e of this.usersFundings) {
      sum = sum + e.amount
    }

    return sum
  }

  public onEntryClicked(funding: IFunding) {
    this.fundingIdOfInterest = funding
    window.scrollTo(0, 0)
  }

  // public onUserIdEntered() {

  //   this.backendService.getUser(this.user.id)
  //     .subscribe((user: IUser) => {
  //       if (user === undefined) {
  //         alert('Please enter a valid user ID')
  //       } else {
  //         this.user = user
  //         ProfileComponent.currentUser = this.user
  //       }
  //     },
  //     (error) => alert(error.message))
  // }

}
