const VALID_LICENSE_STATUSES = new Set(['checking', 'unlicensed', 'licensed'])

export function createLicenseState() {
  return {
    status: 'checking',
    paymentCode: null,
  }
}

export function applyLicenseStatus(current, update) {
  if (!update || !VALID_LICENSE_STATUSES.has(update.status)) {
    return createLicenseState()
  }

  if (update.status === 'licensed') {
    return {
      status: 'licensed',
      paymentCode: null,
    }
  }

  const paymentCode = typeof update.paymentCode === 'string' && update.paymentCode.length > 0
    ? update.paymentCode
    : null

  return {
    status: update.status,
    paymentCode,
  }
}

export function canUseApp(state) {
  return state && state.status === 'licensed'
}

export function shouldRequestLicenseSync(hasReceivedStatus, lastRequestAt, nowMs = Date.now(), retryMs = 30_000) {
  if (hasReceivedStatus) return false
  if (!Number.isFinite(lastRequestAt)) return true
  return nowMs - lastRequestAt >= retryMs
}
