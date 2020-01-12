// -*- mode: javascript; js-indent-level: 2 -*-

import * as fs from 'fs'
import * as exec from '@actions/exec'
import * as publish from '../src/publish'
import * as tools from '../src/tools'

test('SnapcraftPublisher.login deletes the login data', async () => {
  expect.assertions(2)

  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  const publisher = new publish.SnapcraftPublisher('login-data', '', '')
  await publisher.login()
  expect(execMock).toHaveBeenCalledWith('snapcraft', [
    'login',
    '--with',
    expect.any(String)
  ])
  const loginFile = (execMock.mock.calls[0][1] as string[])[2] as string
  expect(fs.existsSync(loginFile)).toBe(false)
})

test('SnapcraftBuilder.build runs a snap build', async () => {
  expect.assertions(5)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureSnapcraft = jest
    .spyOn(tools, 'ensureSnapcraft')
    .mockImplementation(async (): Promise<void> => {})
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  const publisher = new publish.SnapcraftPublisher(
    'login-data',
    'filename.snap',
    'edge'
  )
  await publisher.publish()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureSnapcraft).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('snapcraft', [
    'login',
    '--with',
    expect.any(String)
  ])
  expect(execMock).toHaveBeenCalledWith('snapcraft', [
    'push',
    'filename.snap',
    '--release',
    'edge'
  ])
  expect(execMock).toHaveBeenCalledWith('snapcraft', ['logout'])
})
