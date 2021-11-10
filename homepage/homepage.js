
const isMobile = navigator.userAgent.match('Mobile') || false;
const isMac = navigator.platform.indexOf('Mac') > -1;
const isSafari = navigator.userAgent.toLowerCase().indexOf('safari') != -1;

window.addEventListener('appinstalled', logAppInstalled);

// Log the installation
function logAppInstalled(evt) {
  
  console.log('Codeit installed succesfully.', evt);
  
  document.querySelectorAll('.btn.install').forEach(button => {
    
    button.classList.remove('loading');
    button.classList.add('installed');
    
    // save installation in local storage
    localStorage.setItem('installed', 'true');
    
    if (!isMobile) {
      window.location.replace(window.location.origin + '/full');
    }
    
  });
  
}

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', saveBeforeInstallPromptEvent);

// Saves the event & shows install button.
function saveBeforeInstallPromptEvent(evt) {
  
  evt.preventDefault();
  
  document.querySelectorAll('.btn.install').forEach(button => {
    
    button.classList.remove('loading');
    
  });
  
  deferredInstallPrompt = evt;
  
}

// Event handler for butInstall - Does the PWA installation.
function installPWA(evt) {
  
  // if able to install codeit
  if (deferredInstallPrompt) {
    
    deferredInstallPrompt.prompt();
    
    // Log user response to prompt.
    deferredInstallPrompt.userChoice
      .then((choice) => {
        if (choice.outcome === 'accepted') {
          
          console.log('Accepted the install prompt');
          
          document.querySelectorAll('.btn.install').forEach(button => {
    
            button.classList.add('loading');

          });
          
        } else {
          
          console.log('Dismissed the install prompt');
          
        }
      
        deferredInstallPrompt = null;
      
      });
    
  } else { // open in the browser
    
    window.location.replace(window.location.origin + '/full');
    
  }
  
}

function checkLocalStorage() {
  
  const test = 'test';
  try {
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch(e) {
    return false;
  }
  
}

document.querySelectorAll('.btn.install').forEach(button => {

  button.addEventListener('click', installPWA);
  
  if (isSafari) {
    
    button.classList.remove('loading');
    
  }
  
  if (localStorage.getItem('installed')) {
    
    button.classList.add('installed');
    
  }
  
  if (checkLocalStorage()) {
    
    button.classList.add('installed');
    button.classList.add('cookies');
    
  }

});


// Register service worker
if ('serviceWorker' in navigator) {

  window.addEventListener('load', () => {

    navigator.serviceWorker.register('/service-worker.js');

  });

}

function checkPWA() {

  let displayMode = 'browser tab';

  if (navigator.standalone) {
    
    displayMode = 'standalone-ios';
    
  }

  if (window.matchMedia('(display-mode: standalone)').matches) {
    
    displayMode = 'standalone';
    
  }

  if (displayMode != 'browser tab') {
    
    window.location.replace(window.location.origin + '/full');
    
  }

};

document.addEventListener('visibilitychange', () => { window.setTimeout(checkPWA, 2000) });
checkPWA();
