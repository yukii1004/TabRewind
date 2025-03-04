let tabStack = [];
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// keep service worker alive
const keepAlive = () => {
  const keepAliveInterval = 20;
  let retries = 0;
  const maxRetries = 3;

  const ping = () => {
    browserAPI.runtime.getPlatformInfo((info) => {
      if (browserAPI.runtime.lastError) {
        retries++;
        console.warn(`Keep-alive failed (${retries}/${maxRetries}):`, browserAPI.runtime.lastError);
        
        if (retries >= maxRetries) {
          console.error('Keep-alive failed multiple times, restarting service...');
          clearInterval(intervalId);
          setTimeout(keepAlive, 1000);
        }
      } else {
        retries = 0;
      }
    });
  };

  const intervalId = setInterval(ping, keepAliveInterval * 1000);
  ping();
};

// update stack
browserAPI.tabs.onActivated.addListener((activeInfo) => {
  tabStack.push(activeInfo.tabId);
  if (tabStack.length > 2) {
    tabStack.shift();
  }
});

browserAPI.tabs.onRemoved.addListener((tabId) => {
  tabStack = tabStack.filter(id => id !== tabId);
});

// check if tab exists and switch
browserAPI.commands.onCommand.addListener(async (command) => {
  if (command === 'switch-to-last-tab' && tabStack.length >= 2) {
    const lastTabId = tabStack[tabStack.length - 2];
    
    try {
      const tab = await browserAPI.tabs.get(lastTabId);
      if (browserAPI.runtime.lastError) {
        tabStack = tabStack.filter(id => id !== lastTabId);
        return;
      }

      await browserAPI.tabs.update(lastTabId, { active: true });
      const currentTab = tabStack.pop();
      tabStack.push(currentTab);
    } catch (error) {
      console.error('Error switching tabs:', error);
      tabStack = tabStack.filter(id => id !== lastTabId);
    }
  }
});

keepAlive(); 