// -*- mode: javascript; js-indent-level: 2 -*-

import * as fs from 'fs'
import * as path from 'path'
import * as exec from '@actions/exec'
import * as publish from '../src/publish'
import * as tools from '../src/tools'

test('SnapcraftPublisher.validate validates inputs', async () => {
  expect.assertions(2)

  const existingSnap = path.join(__dirname, '..', 'README.md')
  const missingSnap = path.join(__dirname, 'no-such-snap.snap')

  // No error on valid inputs
  let publisher = new publish.SnapcraftPublisher({
    loginData: 'login-data',
    snapFile: existingSnap,
    release: ''
  })
  await publisher.validate()

  // Missing login data
  publisher = new publish.SnapcraftPublisher({
    loginData: '',
    snapFile: existingSnap,
    release: ''
  })
  await expect(publisher.validate()).rejects.toThrow('login_data is empty')

  // Missing snap
  publisher = new publish.SnapcraftPublisher({
    loginData: 'login-data',
    snapFile: missingSnap,
    release: ''
  })
  await expect(publisher.validate()).rejects.toThrow(
    `cannot read snap file "${missingSnap}"`
  )
})

test('SnapcraftPublisher.login deletes the login data', async () => {
  expect.assertions(2)

  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const publisher = new publish.SnapcraftPublisher({
    loginData: 'login-data',
    snapFile: '',
    release: ''
  })
  await publisher.login()
  expect(execMock).toHaveBeenCalledWith('snapcraft', [
    'login',
    '--with',
    expect.any(String)
  ])
  const loginFile = (execMock.mock.calls[0][1] as string[])[2] as string
  expect(fs.existsSync(loginFile)).toBe(false)
})

test('SnapcraftPublisher.login deletes the login data on login failure', async () => {
  expect.assertions(3)

  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        throw new Error('login failure')
      }
    )

  const publisher = new publish.SnapcraftPublisher({
    loginData: 'login-data',
    snapFile: '',
    release: ''
  })
  await expect(publisher.login()).rejects.toThrow('login failure')
  expect(execMock).toHaveBeenCalledWith('snapcraft', [
    'login',
    '--with',
    expect.any(String)
  ])
  const loginFile = (execMock.mock.calls[0][1] as string[])[2] as string
  expect(fs.existsSync(loginFile)).toBe(false)
})

test('SnapcraftPublisher.publish publishes the snap', async () => {
  expect.assertions(5)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureSnapcraft = jest
    .spyOn(tools, 'ensureSnapcraft')
    .mockImplementation(async (): Promise<void> => {})
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const publisher = new publish.SnapcraftPublisher({
    loginData: 'login-data',
    snapFile: 'filename.snap',
    release: ''
  })
  await publisher.publish()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureSnapcraft).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('snapcraft', [
    'login',
    '--with',
    expect.any(String)
  ])
  expect(execMock).toHaveBeenCalledWith('snapcraft', [
    'upload',
    'filename.snap'
  ])
  expect(execMock).toHaveBeenCalledWith('snapcraft', ['logout'])
})

test('SnapcraftPublisher.publish can release the published snap', async () => {
  expect.assertions(5)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureSnapcraft = jest
    .spyOn(tools, 'ensureSnapcraft')
    .mockImplementation(async (): Promise<void> => {})
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  const publisher = new publish.SnapcraftPublisher({
    loginData: 'login-data',
    snapFile: 'filename.snap',
    release: 'edge'
  })
  await publisher.publish()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureSnapcraft).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('snapcraft', [
    'login',
    '--with',
    expect.any(String)
  ])
  expect(execMock).toHaveBeenCalledWith('snapcraft', [
    'upload',
    'filename.snap',
    '--release',
    'edge'
  ])
  expect(execMock).toHaveBeenCalledWith('snapcraft', ['logout'])
})

describe('process.env', () => {
  const env = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {...env}
  })

  afterEach(() => {
    process.env = env
  })

  test('SnapcraftPublisher.publish can release the published snap with new login', async () => {
    expect.assertions(5)

    const ensureSnapd = jest
      .spyOn(tools, 'ensureSnapd')
      .mockImplementation(async (): Promise<void> => {})
    const ensureSnapcraft = jest
      .spyOn(tools, 'ensureSnapcraft')
      .mockImplementation(async (): Promise<void> => {})
    const execMock = jest
      .spyOn(exec, 'exec')
      .mockImplementation(
        async (program: string, args?: string[]): Promise<number> => {
          return 0
        }
      )

    process.env.SNAPCRAFT_STORE_CREDENTIALS = 'credentials'
    const publisher = new publish.SnapcraftPublisher({
      loginData: '',
      snapFile: 'filename.snap',
      release: 'edge'
    })
    await publisher.publish()

    expect(ensureSnapd).toHaveBeenCalled()
    expect(ensureSnapcraft).toHaveBeenCalled()
    expect(execMock).not.toHaveBeenCalledWith('snapcraft', [
      'login',
      '--with',
      expect.any(String)
    ])
    expect(execMock).toHaveBeenCalledWith('snapcraft', [
      'upload',
      'filename.snap',
      '--release',
      'edge'
    ])
    expect(execMock).not.toHaveBeenCalledWith('snapcraft', ['logout'])
  })

  test('SnapcraftPublisher.validate validates inputs with new login', async () => {
    expect.assertions(0)

    const existingSnap = path.join(__dirname, '..', 'README.md')
    process.env.SNAPCRAFT_STORE_CREDENTIALS = 'credentials'

    // Missing login data but env set
    let publisher = new publish.SnapcraftPublisher({
      loginData: '',
      snapFile: existingSnap,
      release: ''
    })
    await publisher.validate()
  })
})
