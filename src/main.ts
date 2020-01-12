// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {SnapcraftPublisher} from './publish'

async function run(): Promise<void> {
  try {
    const loginData: string = core.getInput('store_login')
    const snapFile: string = core.getInput('snap')
    const release: string = core.getInput('release')
    core.info(`Publishing snap "${snapFile}"...`)

    const publisher = new SnapcraftPublisher(loginData, snapFile, release)
    await publisher.publish()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
