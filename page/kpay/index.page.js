Page({
  onInit() {
    const app = getApp()
    this.kpay = app.globalData && app.globalData.kpay
    if (this.kpay) this.kpay.pageInit()
  },

  build() {
    if (this.kpay) this.kpay.pageBuild()
  },

  onDestroy() {
    if (this.kpay) this.kpay.pageDestroy()
  },
})
