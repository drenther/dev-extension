import copy from 'copy-to-clipboard';

const state = {
  token: null,
  tenant: null,
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message) {
    if (message.type === 'token') {
      if (!state.token) {
        // only auto copy the first time
        copy(message.token);
      }

      state.token = message.token;
    }

    if (message.type === 'tenant') {
      state.tenant = message.tenant;
    }

    if (message.type === 'syncState') {
      sendResponse(state);
    }
  }
});
