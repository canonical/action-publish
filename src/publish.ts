// -*- mode: javascript; js-indent-level: 2 -*-

import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as tools from './tools'

interface SnapcraftPublisherOptions {
  loginData: string
  snapFile: string
  release: string
}

export class SnapcraftPublisher {
  loginData: string
  snapFile: string
  release: string

  constructor(options: SnapcraftPublisherOptions) {
    this.loginData = options.loginData
    this.snapFile = options.snapFile
    this.release = options.release
  }

  async validate(): Promise<void> {
    if (process.env.SNAPCRAFT_STORE_CREDENTIALS) {
      return
    }

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

  async upload(): Promise<void> {
    const args = ['upload', this.snapFile]
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
    if (!process.env.SNAPCRAFT_STORE_CREDENTIALS) {
      await this.login()
    }
    try {
      await this.upload()
    } finally {
      if (!process.env.SNAPCRAFT_STORE_CREDENTIALS) {
        await this.logout()
      }
    }
  }
}
