import { Application, Request, Response } from 'express'
import * as path from 'path'

import { availableDrives } from './device'

// eslint-disable-next-line @typescript-eslint/no-var-requires
var fs = require('fs')
var { parse } = require('json2csv')

const _writeDirectory = (
  deviceId: number,
  directoryName: string
): Promise<{ success: boolean; message: string }> => {
  return new Promise(resolve => {
    let device = availableDrives[deviceId]

    if (device) {
      let localPath = path.join(device.mountpoints[0], directoryName)

      let result = fs.existsSync(localPath) || fs.mkdirSync(localPath)

      resolve({
        success: true,
        message: result,
      })
    } else {
      resolve({
        success: false,
        message: 'no candidates found',
      })
    }
  })
}

const _writeFile = (
  deviceId: number,
  fileName: string,
  content: string
): Promise<{ success: boolean; message: string }> => {
  return new Promise(resolve => {
    let device = availableDrives[deviceId]

    if (device) {
      let localPath = path.join(device.mountpoints[0], fileName)

      fs.writeFile(localPath, content, (err: any) => {
        if (err) {
          resolve({
            success: false,
            message: err,
          })
        } else {
          resolve({
            success: true,
            message: localPath,
          })
        }
      })
    } else {
      resolve({
        success: false,
        message: 'no candidates found',
      })
    }
  })
}

const convertToCsv = (json: { options?: any, data: any[] }) => {
  try {
    if(json.options) {
      return parse(json.data, json.options)
    }
    return parse(json.data)
  } catch (err) {
    console.error(err)
  }
}

export async function setup(app: Application) {
  app.get(
    '/usb/:deviceId/file',
    async (_request: Request, response: Response) => {
      let deviceId = _request.params.deviceId

      var filePath: string | undefined =
        _request.get('path') || _request.query.path || undefined

      if (!filePath) {
        response.json({ success: false, message: 'no path provided' })
        return
      }

      let device = availableDrives[deviceId]
      let localPath = path.join(device.mountpoints[0], filePath)

      response.download(localPath, err => {
        if (!err) return
        response.statusCode = 404
        response.send('Cant find the specified file')
      })
    }
  )

  app.post(
    '/usb/:deviceId/directory',
    async (_request: Request, response: Response) => {
      let deviceId = _request.params.deviceId

      var directoryPath: string =
        _request.get('path') ||
        _request.query.path ||
        new Date().getTime() + '.json'

      const result = await _writeDirectory(deviceId, directoryPath)
      response.json(result)
    }
  )

  app.post(
    '/usb/:deviceId/file',
    async (_request: Request, response: Response) => {
      var filePath: string =
        _request.get('path') ||
        _request.query.path ||
        new Date().getTime() + '.json'
      var fileType = filePath.split('.').pop()
      let file = fileType === 'csv' ? convertToCsv(_request.body) : JSON.stringify(_request.body, null, 2)
      let deviceId = _request.params.deviceId

      const result = await _writeFile(deviceId, filePath, file)
      response.json(result)
    }
  )

  await new Promise<number>(resolve => resolve(1))

  // eslint-disable-next-line no-console
  console.log('file controller setup')
}
