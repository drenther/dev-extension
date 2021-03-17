import copy from 'copy-to-clipboard';

const state = {
  token: null,
  tenant: null,
};

function update(key, value) {
  const el = document.querySelector(`code[data-id=${key}]`);

  if (el) {
    el.innerText = value;
  }

  state[key] = value;
}

function sync() {
  chrome.runtime.sendMessage(
    { type: 'syncState' },
    function synchronize(newState) {
      if (state.token !== newState.token) {
        update('token', newState.token);
      }
      if (state.tenant !== newState.tenant) {
        update('tenant', newState.tenant);
      }
    }
  );

  requestIdleCallback(sync);
}
sync();

document
  .querySelector('button[data-id=token]')
  .addEventListener('click', function copyToken() {
    copy(state.token || '');
  });

document
  .querySelector('button[data-id=tenant]')
  .addEventListener('click', function copyTenant() {
    copy(state.tenant || '');
  });
