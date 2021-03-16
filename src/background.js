import copy from 'copy-to-clipboard';

chrome.runtime.onMessage.addListener(function (message) {
  if (message && message.type === 'copy') {
    copy(message.token);
  }
});
