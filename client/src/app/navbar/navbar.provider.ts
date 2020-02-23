import { INavbarData, IMenuEntry } from './navbar.interfaces'
import { gitHubURL } from '../../configurations/configuration'

export class NavBarProvider {

  public static getNavBarData(): INavbarData {

    return {
      logoURL: '../assets/peer-2-peer.jpg',
      appTitle: 'GitCoin Enterprise',
      menuEntries: NavBarProvider.getMenuEntries()
    }
  }


  private static getMenuEntries(): IMenuEntry[] {
    const menuEntries = []

    menuEntries.push({ isActive: true, text: 'Home', href: 'landing' })
    menuEntries.push({ isActive: false, text: 'Fund a Task', href: 'fund' })
    menuEntries.push({ isActive: false, text: 'Solve a Task', href: 'solve' })
    menuEntries.push({ isActive: false, text: 'Profile', href: 'profile' })
    menuEntries.push({ isActive: false, text: 'Ledger', href: 'downloadLedger' })
    menuEntries.push({ isActive: false, text: 'Use as App', href: 'useAsApp' })
    menuEntries.push({ isActive: false, text: 'Invite Friends', href: 'inviteFriends' })
    menuEntries.push({ isActive: false, text: 'Open Source', href: 'openSource' })
    menuEntries.push({ isActive: false, text: 'About', href: 'about' })
    if (gitHubURL === 'https://github.com') { // the following one is not needed for enterprise internal instance
      menuEntries.push({ isActive: false, text: 'Contact', href: 'contact' })
    }

    return menuEntries
  }
}
