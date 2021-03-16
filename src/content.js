const injectedElementId = '__interceptedToken';

function interceptToken() {
  const xhrOverrideScript = document.createElement('script');
  xhrOverrideScript.type = 'text/javascript';
  xhrOverrideScript.innerHTML = `
(function() {
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
              var id = '${injectedElementId}';
              var element = document.getElementById(id) || document.createElement('div');
              element.id = '__interceptedToken';
              element.innerText = this.response;
              element.style.height = 0;
              element.style.overflow = 'hidden';
              document.body.appendChild(element);
          }               
      });
      return send.apply(this, arguments);
  };
})();
  `;

  document.head.prepend(xhrOverrideScript);
}

function checkForDOM() {
  if (document.body && document.head) {
    interceptToken();
  } else {
    requestIdleCallback(checkForDOM);
  }
}

checkForDOM();

let token;

function scrapeAuthToken() {
  const injectedElement = document.getElementById(injectedElementId);

  if (injectedElement) {
    try {
      const response = injectedElement.innerText;
      const json = JSON.parse(response) || {};

      const newToken = json.id_token;

      if (newToken !== token) {
        chrome.runtime.sendMessage({
          type: 'copy',
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
