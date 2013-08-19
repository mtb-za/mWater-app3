# Run before libs are loaded. Contains hacks

# See issue https://github.com/mWater/app-v3/issues/103
if navigator.userAgent.toLowerCase().indexOf('android 4.1.1') != -1
  window.L_DISABLE_3D = true
