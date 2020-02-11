import { Component, OnInit } from '@angular/core'
import { BackendService } from '../backend.service'
import { ProfileComponent } from '../profile/profile.component'
import { backendURL } from '../../configurations/configuration'
import { IUser, IEmail } from '../interfaces'

@Component({
  selector: 'app-invite-friend',
  templateUrl: './invite-friend.component.html',
  styleUrls: ['./invite-friend.component.css', '../app.component.css']
})
export class InviteFriendComponent implements OnInit {


  public url = backendURL
  // public eMailAddress = 'akshay.iyyaudarai.balasundaram@sap.com'
  public eMailAddress = 'michael@peer2peer-enterprise.org'
  public invitingUsersAddress = 'michael.spengler@sap.com'
  public sent = false
  public permissionGranted = false
  public eMail: IEmail

  public constructor() { }

  public ngOnInit(): void {
    // this.eMail = {
    //   senderUserId: ProfileComponent.currentUser.id,
    //   sender: this.invitingUsersAddress,
    //   recipient: this.eMailAddress,
    //   subject: `Invitation to ${this.url}`,
    //   // tslint:disable-next-line: max-line-length
    //   content: `Hi. Your friend ${this.invitingUsersAddress} invited you to join ${this.url}. Your personal access link is ${this.url}?id=accessToken. Everyone who has this link can trigger actions in your name. Please store it securely.`
    // }
  }

  // public send() {
  //   this.eMail.senderUserId = ProfileComponent.currentUser.id
  //   this.backendService.sendEMail(this.eMail, ProfileComponent.currentUser.id)
  //     .subscribe((result: any) => {
  //       if (result.success === false) {
  //         alert('I did not send this E-Mail. Perhaps there had already been an invitation related to this E-Mail before.')
  //       } else {
  //         this.sent = true
  //       }
  //     })
  // }

  // public onUserIdEntered() {

  //   this.backendService.getUser(this.user.id)
  //     .subscribe((user: IUser) => {
  //       if (user === null || user === undefined) {
  //         alert('Please enter a valid user ID')
  //       } else {
  //         this.user = user
  //         ProfileComponent.currentUser = this.user
  //       }
  //     }, error => alert(error.message))
  // }

  public copyText() {
    const selBox = document.createElement('textarea')
    selBox.style.position = 'fixed'
    selBox.style.left = '0'
    selBox.style.top = '0'
    selBox.style.opacity = '0'
    selBox.value = document.URL
    document.body.appendChild(selBox)
    selBox.focus()
    selBox.select()
    selBox.setSelectionRange(0, 9999)
    document.execCommand('copy')
    document.body.removeChild(selBox)

    // alert(NavbarComponent.operatingSystem);
    alert('Link copied to clipboard')
  }
}
