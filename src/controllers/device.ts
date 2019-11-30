import { Application, Request, Response } from 'express'

const drivelist = require('drivelist');

export class UsbDeviceInfo {
    id: number
    description: string
    mountpoints: string[]
  
    constructor(id: number, description: string, mountpoints: string[]) {
      this.id = id
      this.description = description
      this.mountpoints = mountpoints
    }
}

export var availableDrives: UsbDeviceInfo[] = []

const _getUsbDrives = async (): Promise<any> => {
    return new Promise(async resolve => {
  
      const drives = await drivelist.list();

      availableDrives = []
      
      drives.forEach((drive: any) => {
        if (drive.isRemovable && drive.isUSB && !drive.isSystem) {
          let mountpoints: string[] = []
          drive.mountpoints.forEach((mountpoint:any) => mountpoints.push(mountpoint.path))

          let driveInfo = new UsbDeviceInfo(availableDrives.length, drive.description, mountpoints)
          availableDrives.push(driveInfo)  
        }
      });

      resolve(availableDrives)
    })
  }

export async function setup(app: Application) {

    app.get('/usb', async (_request: Request, response: Response) => {
        const devices = await _getUsbDrives()
        response.json(devices)
      })


    await _getUsbDrives()

    console.log('device controller setup')
}
