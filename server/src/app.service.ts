import { Injectable } from '@nestjs/common'

import * as fs from 'fs-sync'
import * as path from 'path'
import { ITask, ETaskStatus, ETaskType, IUser, IFunding, ITaskAndFunding, IApplication } from './interfaces'
import { LoggerService } from './logger/logger.service'
import { LedgerConnector } from './ledger-connector/ledger-connector-file-system.service'
import { GithubIntegrationService } from './github-integration/github-integration.service'
import { ILedgerEntry } from './ledger-connector/ledger-connector.interface'
import { ELogLevel } from './logger/logger-interface'

// set personal acceess token for posting issue comment
const config = fs.readJSON(path.join(__dirname, '../.env.json'))

@Injectable()
export class AppService {

  public static currentSessionWithoutCookiesLogin = ''
  private fundedTasksFileId = path.join(__dirname, '../operational-data/funded-tasks.json')
  private usersFileId = path.join(__dirname, '../operational-data/users.json')

  // Interface would be cool for LedgerConnector... The reason why I could not use interface polymorphism here is interfaces are design-time only in the current context :)
  public constructor(private readonly lg: LoggerService, private readonly ledgerConnector: LedgerConnector, private readonly gitHubIntegration: GithubIntegrationService) {
    // tbd
  }

  public addUser(id: string) {
    const users: IUser[] = fs.readJSON(this.usersFileId)

    const newUser: IUser = {
      id,
      firstName: '',
      balance: 0,
      link: '',
    }

    if (users.filter((user: IUser) => user.id === newUser.id)[0] === undefined) {
      users.push(newUser)
      fs.write(this.usersFileId, JSON.stringify(users))
    }

  }

  public async getUser(userId: string): Promise<IUser> {
    await this.lg.log(ELogLevel.Info, `getting user ${userId}`)
    return fs.readJSON(this.usersFileId).filter((user: IUser) => user.id === userId)[0]
  }

  public applyForSolving(userId: string, application: IApplication): void {
    const existingUser = fs.readJSON(this.usersFileId).filter((user: IUser) => user.id === userId)[0]
    if (existingUser === undefined) {
      throw new Error('User not found')
    }
    this.gitHubIntegration.postCommentAboutApplication(application)
  }

  public getGitHubToken(): string {
    return fs.readJSON(path.join(__dirname, '../.env.json')).gitHubToken
  }

  public saveFundedTasks(fundedTasks: ITask[]): void {
    return fs.write(this.fundedTasksFileId, JSON.stringify(fundedTasks))
  }

  public authorizeInstallation(): void {
    const userId = '123'
    this.lg.log(ELogLevel.Info, `User: ${userId} authorized installation.`)
  }

  public handleOAuthCallbackRequest(): void {
    const calbackRequestData = 'calbackRequestData'
    this.lg.log(ELogLevel.Info, `OAuthCallBackRequest Received: ${calbackRequestData}`)
  }

  public async ghAppWebHookURL(): Promise<void> {
    const trigger = 'tbd'
    await this.lg.log(ELogLevel.Info, `Webhook URL: ${trigger}`)
  }

  public getFundedTasks(): ITask[] {
    return fs.readJSON(this.fundedTasksFileId)
  }

  public getDefaultTaskForDemo(): ITask {
    return {
      id: '1',
      taskType: ETaskType.GitHubIssue,
      name: 'Just a Demo Task',
      description: 'Just a Demo Description',
      funding: 0,
      currency: 'EIC',
      status: ETaskStatus.created,
      funderRatedWith: 5,
      solutionProviderRatedWith: 5,
      link: 'https://github.com/gitcoin-enterprise/gitcoin-enterprise/issues/16',
      dueDate: '2020-01-08',
    }
  }

  public getLedgerEntries(): ILedgerEntry[] {

    return this.ledgerConnector.getLedgerEntries()
  }

  public saveFunding(taskAndFunding: ITaskAndFunding, key: string): ILedgerEntry {

    const user = fs.readJSON(this.usersFileId)
      .filter((entry: IUser) => entry.id === key)[0]

    if (user === undefined) {
      throw new Error('I could not find an authorized user with this id.')
    }

    const newLedgerEntry: ILedgerEntry = this.createLedgerEntry(taskAndFunding.funding)

    const tasks = fs.readJSON(this.fundedTasksFileId)
    const existingTask = tasks.filter((entry: IUser) => entry.link === taskAndFunding.task.link)[0]

    let task: ITask
    if (existingTask === undefined) {
      task = taskAndFunding.task
      task.id = Date.now().toString()
    } else {
      task = existingTask
      task.funding = task.funding + taskAndFunding.funding.amount
      const indexOfExistingTasks = tasks.indexOf(existingTask)
      tasks.splice(indexOfExistingTasks, 1)
    }

    tasks.push(task)

    fs.write(this.fundedTasksFileId, JSON.stringify(tasks))

    this.gitHubIntegration.postCommentAboutSuccessfullFunding(taskAndFunding.task.link, taskAndFunding.funding)
    return newLedgerEntry

  }

  private createLedgerEntry(funding: IFunding): ILedgerEntry {
    const entries: ILedgerEntry[] = this.ledgerConnector.getLedgerEntries()
    const entry: ILedgerEntry = {
      id: `tr-${Date.now().toString()}`,
      date: new Date().toISOString(),
      amount: funding.amount,
      sender: funding.funderId,
      receiver: funding.taskId,
    }

    entries.push(entry)

    this.ledgerConnector.saveLedgerEntries(entries)

    return entry
  }

}
