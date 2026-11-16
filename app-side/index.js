import { MessageBuilder } from '../shared/message-side'
import kpayAppSide from 'kpay-amazfit/app-side'

import { kpayConfig } from '../shared/kpay-config'

let messageBuilder = null
let kpay = null

AppSideService({
  onInit() {
    messageBuilder = new MessageBuilder()
    kpay = new kpayAppSide({ ...kpayConfig, messageBuilder })
    kpay.init()
    messageBuilder.listen(() => {})

    messageBuilder.on('request', (context) => {
      try {
        const request = messageBuilder.buf2Json(context.request.payload)
        const handled = kpay.onRequest(request)
        context.response({ result: handled })
      } catch (error) {
        context.response({ error: 'payment_request_failed' })
      }
    })
  },

  onDestroy() {
    if (kpay) kpay.destroy()
    kpay = null
    messageBuilder = null
  },
})
