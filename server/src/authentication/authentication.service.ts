import { Injectable } from '@nestjs/common'
import { LoggerService } from '../logger/logger.service'
import { IAuthenticationData } from '../interfaces'
import { ELogLevel } from '../logger/logger-interface'
// tslint:disable-next-line: no-implicit-dependencies
import * as uuidv1 from 'uuid/v1'
import { config } from '../app.module'
import { GithubIntegrationService } from '../github-integration/github-integration.service'
import { PersistencyService } from '../persistency/persistency.service'
import { LedgerConnector } from '../ledger-connector/ledger-connector-file-system.service'
// tslint:disable-next-line: match-default-export-name
import axios, { AxiosInstance } from 'axios'
import * as tunnel from 'tunnel'

@Injectable()
export class AuthenticationService {
    protected actionsForRedirectingConvenientlyAfterLogin = []
    protected validStates: string[] = []

    public constructor(protected readonly lg: LoggerService, protected readonly gitHubIntegration: GithubIntegrationService, protected readonly persistencyService: PersistencyService, protected readonly ledgerConnector: LedgerConnector) {
        setInterval(() => {
            this.actionsForRedirectingConvenientlyAfterLogin = [] // initializing after 11 days
            this.validStates = []
        },          11 * 24 * 60 * 60 * 1000)
    }

    public isUserAuthenticated(michaelsfriendskey: string): boolean {
        const authenticationData: IAuthenticationData = this.getAuthenticationDataFromMemory(michaelsfriendskey)

        if (authenticationData === undefined) { return false }
        if (authenticationData.login === '') { return false }

        return true
    }

    public getAuthenticationDataFromMemory(userAccessToken: string): IAuthenticationData {
        const allAuthenticationData = this.persistencyService.getAuthenticationData()
        void this.lg.log(ELogLevel.Debug, `checking for token: ${userAccessToken} within ${JSON.stringify(allAuthenticationData)}`)

        return allAuthenticationData.filter((aD: IAuthenticationData) => aD.token === userAccessToken)[0]
    }

    public async createAuthenticationDataFromCode(code: any, state: any): Promise<IAuthenticationData> {
        const newToken = await this.getTokenFromCode(code, state)
        const authenticationData = await this.handleNewToken(newToken)

        return authenticationData
    }

    public addState(): string {
        const state = uuidv1().replace(/-/g, '')
        this.validStates.push(state)

        return state
    }

    public getOAUTHLoginURL(state: string): string {
        // return `${config.gitHubURL}/login/oauth/authorize?client_id=${config.gitHubOAuthClient}&scope=read:user&state=${state}`
        return `${config.oAuthProviderURL}/login/oauth/authorize?client_id=${config.gitHubOAuthClient}&scope=read:user&state=${state}`
    }

    public getActionForAddress(remoteAddress: any): any {
        const entry = this.actionsForRedirectingConvenientlyAfterLogin.filter((e) => e.ipAddress === remoteAddress)[0]
        void this.lg.log(ELogLevel.Debug, `getting action ${entry.action} for ${remoteAddress}`)
        const index = this.actionsForRedirectingConvenientlyAfterLogin.indexOf(entry)
        void this.lg.log(ELogLevel.Debug, `there are: ${this.actionsForRedirectingConvenientlyAfterLogin.length} entries`)
        if (index === -1) {
            return ''
        }
        void this.lg.log(ELogLevel.Debug, `deleting action of IP at index: ${index}`)
        this.actionsForRedirectingConvenientlyAfterLogin.splice(index, 1)

        return entry.action

    }

    public keepTheAction(action: string, ipAddress: string) {
        const addressWantsTo = {
            ipAddress,
            action,
        }
        this.actionsForRedirectingConvenientlyAfterLogin.push(addressWantsTo)
    }

    protected async handleNewToken(michaelsfriendskey: any): Promise<IAuthenticationData> {
        let authenticationData: IAuthenticationData
        void this.lg.log(ELogLevel.Debug, 'handling new token')
        authenticationData = await this.getAuthenticationDataFromGitHub(michaelsfriendskey)
        this.considerAuthenticationData(authenticationData)

        return authenticationData
    }

    protected considerAuthenticationData(aD: IAuthenticationData): void {
        const allAuthenticationData = this.persistencyService.getAuthenticationData()
        if (allAuthenticationData.filter((entry: IAuthenticationData) => entry.login === aD.login)[0] !== undefined) {
            void this.lg.log(ELogLevel.Debug, 'Authentication Data is already in Store')
        } else {
            void this.lg.log(ELogLevel.Info, 'Authentication Data added to Store')

            allAuthenticationData.push(aD)
            this.persistencyService.saveAuthenticationData(allAuthenticationData)

            this.ledgerConnector.addMiningEntryForUser(aD.login)
        }
    }

    protected async getAuthenticationDataFromGitHub(token: string): Promise<IAuthenticationData> {
        let user

        try {
            const getURLToGetUser = (config.gitHubURL === 'https://github.com') ?
                `https://api.github.com/user?access_token=${token}` :
                `${config.gitHubURL}/api/v3/user?access_token=${token}`
            await this.lg.log(ELogLevel.Info, `calling to: ${getURLToGetUser}`)
            user = (await GithubIntegrationService.axiosClient.get(getURLToGetUser)).data
            await this.lg.log(ELogLevel.Info, JSON.stringify(`user: ${user}`))
            const authenticationData: IAuthenticationData = {
                avatarURL: user.avatar_url,
                login: user.login,
                token: uuidv1().replace(/-/g, '').substr(0, 10),
            }

            return authenticationData

        } catch (error) {
            const errorMessage = `The following error occurred while retrieving Login: ${error.message} for ${token}` // shall be deleted as soon as test is successful
            void this.lg.log(ELogLevel.Error, errorMessage)
            throw new Error(errorMessage)
        }
    }

    protected async getTokenFromCode(code: string, state: string) {
        if (this.validStates.indexOf(state) === -1) {
            const message = `I guess the state: ${state} is not valid`
            void this.lg.log(ELogLevel.Error, message)
            throw new Error(message)
        }
        void this.lg.log(ELogLevel.Info, 'Validated state successfully')

        const oauthConfirmationURL =
            `${config.gitHubURL}/login/oauth/access_token?client_id=${config.gitHubOAuthClient}&client_secret=${config.gitHubOAuthSecret}&code=${code}&state=${state}`

        let agent
        let axiosClient: AxiosInstance
        if (config.gitHubURL === 'https://github.com') {
            axiosClient = axios.create({
                baseURL: config.gitHubURL,
                proxy: false,
            })
        } else {
            agent = tunnel.httpsOverHttp({
                proxy: {
                    host: config.proxyHostForEnterpriseGitHubInstance,
                    port: config.proxyHostForEnterpriseGitHubInstancePort,
                },
            })
            axiosClient = axios.create({
                baseURL: config.gitHubURL,
                httpsAgent: agent,
                proxy: false, // to be save regarding autodetection of environment variables...
            })
        }

        let result: any
        try {
            result = (await axiosClient.get(oauthConfirmationURL)).data
            await this.lg.log(ELogLevel.Info, `call was successful: ${JSON.stringify(result)}`)
        } catch (error) {
            await this.lg.log(ELogLevel.Error, `the following error occurred: ${JSON.stringify(error.message)}`)
        }

        const accessToken = result.split('access_token=')[1].split('&')[0]

        return accessToken
    }

}
