let tabStack = [];
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

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