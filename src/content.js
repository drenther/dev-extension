const injectedTokenElementId = '__interceptedToken';
const injectedTenantElementId = '__interceptedTenant';

function setInterceptors() {
  const xhrOverrideScript = document.createElement('script');
  xhrOverrideScript.type = 'text/javascript';
  xhrOverrideScript.innerHTML = `
(function() {
  function injectDOMElement(id) {
    let el = document.createElement('div');
    try {
      el.id = id;
      el.style.height = 0;
      el.style.overflow = 'hidden';

      return el;
    } finally {
      document.body.appendChild(el)
    }
  }
  injectDOMElement('${injectedTokenElementId}')

  var XHR = XMLHttpRequest.prototype;
  var send = XHR.send;
  var open = XHR.open;
  XHR.open = function(method, url) {
    this.url = url; // the request url
    return open.apply(this, arguments);
  }
  XHR.send = function() {
    this.addEventListener('load', function() {
      if (this.url.includes('eu.auth0.com/oauth/token')) {
          var element = document.getElementById('${injectedTokenElementId}') || injectDOMElement('${injectedTokenElementId}');
          element.innerText = this.response;
        }               
      });
    return send.apply(this, arguments);
  };

  function handleHashChange() {
    var element = document.getElementById('${injectedTenantElementId}') || injectDOMElement('${injectedTenantElementId}');
    element.innerText = window.location.hash;
  }

  window.onhashchange = handleHashChange;
  handleHashChange();
})();
  `;

  document.head.prepend(xhrOverrideScript);
}

function checkForDOM() {
  if (document.body && document.head) {
    setInterceptors();
  } else {
    requestIdleCallback(checkForDOM);
  }
}

checkForDOM();

let token;
function scrapeAuthToken() {
  const injectedElement = document.getElementById(injectedTokenElementId);

  if (injectedElement) {
    try {
      const response = injectedElement.innerText.trim();

      let newToken;
      if (response) {
        const json = JSON.parse(response) || {};

        newToken = json.id_token;

        injectedElement.innerText = '';
      } else {
        newToken = localStorage.getItem('integrtrToken');
      }

      if (newToken && newToken !== token) {
        chrome.runtime.sendMessage({
          type: 'token',
          token: newToken,
        });

        token = newToken;
      }
    } finally {
    }
  }

  requestIdleCallback(scrapeAuthToken);
}
scrapeAuthToken();

const tenantCaptureRegEx = /t-(?<tenant>[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12})-t/gi;
let tenant;
function scrapeTenant() {
  const injectedElement = document.getElementById(injectedTenantElementId);

  if (injectedElement) {
    const value = injectedElement.innerText;

    if (value) {
      try {
        const result = tenantCaptureRegEx.exec(value);

        if (result && result.groups) {
          const newTenant = result.groups.tenant;
          if (newTenant && newTenant !== tenant) {
            chrome.runtime.sendMessage({
              type: 'tenant',
              tenant: newTenant,
            });

            tenant = newTenant;
          }
        }
      } finally {
      }
    }
  }

  requestIdleCallback(scrapeTenant);
}
scrapeTenant();
