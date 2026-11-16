import './shared/device-polyfill'
import { MessageBuilder } from './shared/message'
import { getPackageInfo } from '@zos/app'
import * as ble from '@zos/ble'
import kpayApp from 'kpay-amazfit/app'

import { kpayConfig } from './shared/kpay-config'

App({
  globalData: {
    messageBuilder: null,
    kpay: null,
    kpayStatus: null,
  },

  onCreate() {
    const { appId } = getPackageInfo()
    const messageBuilder = new MessageBuilder({
      appId,
      appDevicePort: 20,
      appSidePort: 0,
      ble,
    })
    this.globalData.messageBuilder = messageBuilder
    messageBuilder.connect()

    const kpay = new kpayApp({
      ...kpayConfig,
      dialogPath: 'page/kpay/index.page',
      messageBuilder,
    })
    this.globalData.kpay = kpay
    kpay.init()

    messageBuilder.on('call', ({ payload }) => {
      try {
        const message = messageBuilder.buf2Json(payload)
        if (message && message.method === 'KPAY_STATUS') {
          this.globalData.kpayStatus = message.data
        }
      } catch (error) {}
    })
  },

  onDestroy() {
    if (this.globalData.messageBuilder) {
      this.globalData.messageBuilder.disConnect()
    }
  },
})
