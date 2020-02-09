import { Component, OnInit } from '@angular/core'
import { IEmail } from '../email/email.component'

import { BackendService } from '../backend.service'
import { ProfileComponent } from '../profile/profile.component'
import { backendURL } from '../../configurations/configuration'
import { IUser } from '../interfaces'

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
  public user: IUser = ProfileComponent.currentUser

  public constructor(private readonly backendService: BackendService) { }

  public ngOnInit(): void {

    this.eMail = {
      sender: this.invitingUsersAddress,
      recipient: this.eMailAddress,
      subject: `Invitation to ${this.url}`,
      // tslint:disable-next-line: max-line-length
      content: `Hi. Your friend ${this.invitingUsersAddress} invited you to join ${this.url}. Your personal access link is ${this.url}?id=accessToken. Everyone who has this link can trigger actions in your name. Please store it securely.`
    }
  }

  public send() {
    this.backendService.sendEMail(this.eMail, ProfileComponent.currentUser.id)
      .subscribe((result: any) => {
        if (result.success === false) {
          alert('I did not send this E-Mail. Perhaps there had already been an invitation related to this E-Mail before.')
        } else {
          this.sent = true
        }
      })
  }

  public onUserIdEntered() {

    this.backendService.getUser(this.user.id)
      .subscribe((user: IUser) => {
        if (user === null || user === undefined) {
          alert('Please enter a valid user ID')
        } else {
          this.user = user
          ProfileComponent.currentUser = this.user
        }
      }, error => alert(error.message))

  }
}
