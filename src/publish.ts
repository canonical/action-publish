// -*- mode: javascript; js-indent-level: 2 -*-

import * as os from 'os'
import * as path from 'path'
import * as exec from '@actions/exec'
import * as tools from './tools'
// Importing as an ECMAScript Module blocks access to fs.promises:
//   https://github.com/nodejs/node/issues/21014
import fs = require('fs') // eslint-disable-line @typescript-eslint/no-require-imports

export class SnapcraftPublisher {
  loginData: string
  snapFile: string
  release: string

  constructor(loginData: string, snapFile: string, release: string) {
    this.loginData = loginData
    this.snapFile = snapFile
    this.release = release
  }

  async validate(): Promise<void> {
    if (!this.loginData) {
      throw new Error('login_data is empty')
    }
    try {
      await fs.promises.access(this.snapFile, fs.constants.R_OK)
    } catch (error) {
      throw new Error(`cannot read snap file "${this.snapFile}"`)
    }
  }

  async login(): Promise<void> {
    const tmpdir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'login-data-')
    )
    try {
      const loginfile = path.join(tmpdir, 'login.txt')
      await fs.promises.writeFile(loginfile, this.loginData)
      await exec.exec('snapcraft', ['login', '--with', loginfile])
    } finally {
      await fs.promises.rmdir(tmpdir, {recursive: true})
    }
  }

  async push(): Promise<void> {
    const args = ['push', this.snapFile]
    if (this.release) {
      args.push('--release')
      args.push(this.release)
    }
    await exec.exec('snapcraft', args)
  }

  async logout(): Promise<void> {
    await exec.exec('snapcraft', ['logout'])
  }

  async publish(): Promise<void> {
    await tools.ensureSnapd()
    await tools.ensureSnapcraft()
    await this.login()
    try {
      await this.push()
    } finally {
      await this.logout()
    }
  }
}
